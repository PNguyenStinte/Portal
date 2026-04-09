import anthropic, json, os
from datetime import date
from dotenv import load_dotenv
import psycopg2
import psycopg2.extras
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, HRFlowable, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
import re

load_dotenv()

client = anthropic.Anthropic()

#1. DATABASE CONNECTION ────────────────────────────────────────
def get_db_connection():
    return psycopg2.connect(
        host=os.environ.get("PG_HOST", "localhost"),
        port=os.environ.get("PG_PORT", "5432"),
        dbname=os.environ.get("PG_DATABASE"),
        user=os.environ.get("PG_USER"),
        password=os.environ.get("PG_PASSWORD"),
    )

#2. SYSTEM PROMPT ─────────────────────────────────────────────
SYSTEM_PROMPT = f"""
You are an expert data analyst. You translate natural language questions into
PostgreSQL queries, execute them, and return clear findings with a plain-English
summary.

## Behaviour
- Always call inspect_schema first if you don't yet know the available tables.
- Write correct, efficient PostgreSQL. Use CTEs for complex queries.
- If run_sql returns an error, read the message carefully, fix the SQL, and retry.
  You may retry up to 3 times before giving up.
- Never write INSERT, UPDATE, DELETE, DROP, TRUNCATE, or any DDL. Read-only only.
- Always add LIMIT 1000 unless the user explicitly asks for more rows.

## Output format
Return your answer in this exact structure:

**Question understood:** restate what was asked in one sentence

**SQL used:**
```sql
<your final query here>
```

**Results summary:** 2–4 sentence plain-English insight from the data

**Key numbers:** bullet list of the most important values from the results

**Caveats:** note any assumptions, filters applied, or data quality issues

## Constraints
- Do not show raw row dumps — summarise the data.
- If a query returns 0 rows, say so clearly and suggest why.
- Today's date: {date.today().isoformat()}
"""

#3. TOOL DEFINITIONS ──────────────────────────────────────────
TOOLS = [
    {
        "name": "inspect_schema",
        "description": (
            "List all tables and their columns in the database. "
            "Call this first before writing any SQL so you know what exists."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "table_name": {
                    "type": "string",
                    "description": "Optional. If provided, returns detailed column info for that table only."
                }
            },
            "required": []
        }
    },
    {
        "name": "run_sql",
        "description": (
            "Execute a read-only PostgreSQL SELECT query and return results as JSON. "
            "Results are capped at 1000 rows. Never use for writes."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "A valid read-only PostgreSQL SELECT query."
                }
            },
            "required": ["query"]
        }
    }
]

#4. TOOL IMPLEMENTATIONS ──────────────────────────────────────
def inspect_schema(table_name: str = None) -> str:
    try:
        conn = get_db_connection()
        cur = conn.cursor()

        if table_name:
            cur.execute("""
                SELECT column_name, data_type, is_nullable, column_default
                FROM information_schema.columns
                WHERE table_schema = 'public' AND table_name = %s
                ORDER BY ordinal_position
            """, (table_name,))
            rows = cur.fetchall()
            if not rows:
                return f"Table '{table_name}' not found in public schema."
            result = f"Columns in '{table_name}':\n"
            for col, dtype, nullable, default in rows:
                result += f"  {col} ({dtype}){' NULLABLE' if nullable == 'YES' else ''}\n"
        else:
            cur.execute("""
                SELECT table_name,
                       (SELECT COUNT(*) FROM information_schema.columns c
                        WHERE c.table_name = t.table_name
                        AND c.table_schema = 'public') AS col_count
                FROM information_schema.tables t
                WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
                ORDER BY table_name
            """)
            rows = cur.fetchall()
            if not rows:
                return "No tables found in public schema."
            result = "Tables in database:\n"
            for tname, col_count in rows:
                result += f"  {tname} ({col_count} columns)\n"

        cur.close()
        conn.close()
        return result

    except Exception as e:
        return f"Schema inspection error: {e}"


def run_sql(query: str) -> str:
    # Safety: block any write operations
    forbidden = ["insert", "update", "delete", "drop", "truncate",
                 "alter", "create", "grant", "revoke"]
    query_lower = query.lower()
    for word in forbidden:
        if re.search(rf"\b{word}\b", query_lower):
            return f"Blocked: query contains forbidden keyword '{word}'. Read-only queries only."

    # Enforce row limit
    if "limit" not in query_lower:
        query = query.rstrip(";").strip() + " LIMIT 1000"

    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute(query)
        rows = cur.fetchall()
        cur.close()
        conn.close()

        if not rows:
            return "Query returned 0 rows."

        # Return as JSON — Claude can read and summarise this
        data = [dict(row) for row in rows]
        return json.dumps({
            "row_count": len(data),
            "columns": list(data[0].keys()),
            "rows": data[:100],   # send first 100 rows to Claude
            "note": f"Showing 100 of {len(data)} rows." if len(data) > 100 else ""
        }, default=str)

    except Exception as e:
        return f"SQL error: {e}"


def execute_tool(name: str, inputs: dict) -> str:
    if name == "inspect_schema":
        return inspect_schema(inputs.get("table_name"))
    elif name == "run_sql":
        return run_sql(inputs["query"])
    return "Unknown tool"

#5. PDF SAVE 
def save_to_pdf(answer: str, query: str, filename: str = None):
    if not filename:
        safe = "".join(c if c.isalnum() or c in " _-" else "_" for c in query)
        filename = f"analytics_{safe[:50].strip().replace(' ', '_')}_{date.today().isoformat()}.pdf"

    doc = SimpleDocTemplate(
        filename, pagesize=letter,
        leftMargin=1*inch, rightMargin=1*inch,
        topMargin=1*inch, bottomMargin=1*inch
    )
    styles = getSampleStyleSheet()

    title_style = ParagraphStyle("T", parent=styles["Title"], fontSize=17,
                                 textColor=colors.HexColor("#1a1a2e"), spaceAfter=4)
    meta_style  = ParagraphStyle("M", parent=styles["Normal"], fontSize=10,
                                 textColor=colors.HexColor("#666666"), spaceAfter=14)
    h2_style    = ParagraphStyle("H2", parent=styles["Heading2"], fontSize=13,
                                 textColor=colors.HexColor("#1a1a2e"), spaceBefore=14, spaceAfter=5)
    body_style  = ParagraphStyle("B", parent=styles["Normal"], fontSize=11,
                                 leading=17, textColor=colors.HexColor("#222222"), spaceAfter=6)
    code_style  = ParagraphStyle("C", parent=styles["Code"], fontSize=9,
                                 leading=14, backColor=colors.HexColor("#f5f5f5"),
                                 leftIndent=12, spaceAfter=8)
    bullet_style = ParagraphStyle("BL", parent=body_style, leftIndent=16, spaceAfter=4)

    story = []
    story.append(Paragraph("Data Analytics Brief", title_style))
    story.append(Paragraph(
        f"Query: {query} &nbsp;|&nbsp; {date.today().strftime('%B %d, %Y')}",
        meta_style
    ))
    story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#cccccc")))
    story.append(Spacer(1, 10))

    in_code_block = False
    code_lines = []

    for line in answer.split("\n"):
        stripped = line.strip()

        # Code block toggle
        if stripped.startswith("```"):
            if in_code_block:
                story.append(Paragraph("<br/>".join(code_lines), code_style))
                code_lines = []
                in_code_block = False
            else:
                in_code_block = True
            continue

        if in_code_block:
            code_lines.append(stripped.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;"))
            continue

        if not stripped:
            story.append(Spacer(1, 4))
        elif stripped.startswith("**") and stripped.endswith("**"):
            story.append(Paragraph(stripped.strip("*"), h2_style))
        elif stripped.startswith("- ") or stripped.startswith("• "):
            text = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>",
                          stripped[2:].replace("&","&amp;").replace("<","&lt;").replace(">","&gt;"))
            story.append(Paragraph(f"• {text}", bullet_style))
        else:
            text = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>",
                          stripped.replace("&","&amp;").replace("<","&lt;").replace(">","&gt;"))
            story.append(Paragraph(text, body_style))

    doc.build(story)
    return filename

#6. THE AGENTIC LOOP 
def run_analytics_agent(query: str, save_pdf: bool = True) -> str:
    messages = [{"role": "user", "content": query}]
    tool_calls_made = 0
    MAX_TOOL_CALLS = 12  # schema + a few SQL attempts with retries

    while tool_calls_made < MAX_TOOL_CALLS:
        response = client.messages.create(
            model="claude-opus-4-6",
            max_tokens=4096,
            system=SYSTEM_PROMPT,
            tools=TOOLS,
            messages=messages
        )

        if response.stop_reason == "tool_use":
            messages.append({"role": "assistant", "content": response.content})
            tool_results = []

            for block in response.content:
                if block.type == "tool_use":
                    print(f"  → {block.name}({json.dumps(block.input)[:80]}...)")
                    result = execute_tool(block.name, block.input)
                    tool_calls_made += 1
                    tool_results.append({
                        "type": "tool_result",
                        "tool_use_id": block.id,
                        "content": result
                    })

            messages.append({"role": "user", "content": tool_results})

        else:
            for block in response.content:
                if hasattr(block, "text"):
                    answer = block.text
                    if save_pdf:
                        pdf_file = save_to_pdf(answer, query)
                        print(f"\n  Saved to: {pdf_file}")
                    return answer
            break

    return "Agent hit tool call limit without completing."

#7. RUN IT 
if __name__ == "__main__":
    query = "Show me total revenue by month for the last 6 months"
    print(f"\nAnalysing: {query}\n")
    result = run_analytics_agent(query, save_pdf=True)
    print(result)