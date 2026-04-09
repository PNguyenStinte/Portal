import anthropic, requests, json, os
from datetime import date
from bs4 import BeautifulSoup
from dotenv import load_dotenv
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors

load_dotenv()

client = anthropic.Anthropic()

#1. SYSTEM PROMPT ─────────────────────────────────────────────
SYSTEM_PROMPT = f"""
You are an expert market research analyst and competitive intelligence agent.
Your job is to research topics thoroughly and produce clear, actionable briefs.

## Behaviour
- Always search before answering. Never rely on training data for facts about
  companies, markets, or recent events.
- Use multiple searches to triangulate findings.
- Cite every claim with a source URL.
- Stop when you have 3–5 high-quality sources. Do not over-research.

## Tool use rules
- Use web_search for news, company info, and market data.
- Use fetch_url to read the full content of a promising page.
- Prefer primary sources (filings, official blogs) over aggregators.

## Output format
Return your brief with this structure:
**Executive summary** (3 bullets)
**Key findings** (finding · evidence + URL · why it matters)
**Sources** (numbered list with title and date)
**Confidence & caveats**

## Constraints
- Max 600 words in the brief body.
- Do not speculate beyond what sources support.
- Today's date: {date.today().isoformat()}
"""

#2. TOOL DEFINITIONS ──────────────────────────────────────────
TOOLS = [
    {
        "name": "web_search",
        "description": "Search the web for current information. Use for news, company data, market research, competitor activity.",
        "input_schema": {
            "type": "object",
            "properties": {
                "query": {"type": "string", "description": "Search query — be specific, 3–8 words"}
            },
            "required": ["query"]
        }
    },
    {
        "name": "fetch_url",
        "description": "Fetch and read the full text content of a webpage. Use when a search snippet is not enough.",
        "input_schema": {
            "type": "object",
            "properties": {
                "url": {"type": "string", "description": "Full URL to fetch"}
            },
            "required": ["url"]
        }
    }
]

#3. TOOL IMPLEMENTATIONS ──────────────────────────────────────
def web_search(query: str) -> str:
    """
    Swap this stub for a real search API.
    Recommended: Tavily (pip install tavily-python)

    from tavily import TavilyClient
    _tavily = TavilyClient(api_key=os.environ["TAVILY_API_KEY"])

    def web_search(query: str) -> str:
        results = _tavily.search(query, max_results=5, search_depth="advanced")
        hits = []
        for r in results.get("results", []):
            hits.append(
                f"Title: {r['title']}\n"
                f"URL: {r['url']}\n"
                f"Published: {r.get('published_date', 'unknown')}\n"
                f"Content: {r['content'][:500]}\n"
            )
        return "\n---\n".join(hits) if hits else "No results found."
    """
    return json.dumps({"note": f"[stub] search results for: {query}"})

def fetch_url(url: str) -> str:
    try:
        r = requests.get(url, timeout=10, headers={"User-Agent": "Mozilla/5.0"})
        soup = BeautifulSoup(r.text, "html.parser")
        for tag in soup(["script", "style", "nav", "footer"]):
            tag.decompose()
        text = soup.get_text(" ", strip=True)
        return text[:8000]
    except Exception as e:
        return f"Error fetching URL: {e}"

def execute_tool(name: str, inputs: dict) -> str:
    if name == "web_search":
        return web_search(inputs["query"])
    elif name == "fetch_url":
        return fetch_url(inputs["url"])
    return "Unknown tool"

#4. PDF SAVE ───────────────────────────────────────────────────
def save_to_pdf(brief: str, query: str, filename: str = None):
    if not filename:
        safe = "".join(c if c.isalnum() or c in " _-" else "_" for c in query)
        filename = f"research_{safe[:50].strip().replace(' ', '_')}_{date.today().isoformat()}.pdf"

    doc = SimpleDocTemplate(
        filename,
        pagesize=letter,
        leftMargin=1*inch, rightMargin=1*inch,
        topMargin=1*inch, bottomMargin=1*inch
    )

    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        "ReportTitle",
        parent=styles["Title"],
        fontSize=18,
        textColor=colors.HexColor("#1a1a2e"),
        spaceAfter=6,
    )
    meta_style = ParagraphStyle(
        "Meta",
        parent=styles["Normal"],
        fontSize=10,
        textColor=colors.HexColor("#666666"),
        spaceAfter=16,
    )
    heading_style = ParagraphStyle(
        "SectionHeading",
        parent=styles["Heading2"],
        fontSize=13,
        textColor=colors.HexColor("#1a1a2e"),
        spaceBefore=14,
        spaceAfter=6,
    )
    body_style = ParagraphStyle(
        "Body",
        parent=styles["Normal"],
        fontSize=11,
        leading=17,
        textColor=colors.HexColor("#222222"),
        spaceAfter=8,
    )
    bullet_style = ParagraphStyle(
        "Bullet",
        parent=body_style,
        leftIndent=16,
        bulletIndent=0,
        spaceAfter=5,
    )

    story = []

    # Header
    story.append(Paragraph("Research &amp; Intelligence Brief", title_style))
    story.append(Paragraph(
        f"Query: {query} &nbsp;&nbsp;|&nbsp;&nbsp; Generated: {date.today().strftime('%B %d, %Y')}",
        meta_style
    ))
    story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#cccccc")))
    story.append(Spacer(1, 10))

    # Parse and render brief sections
    for line in brief.split("\n"):
        stripped = line.strip()
        if not stripped:
            story.append(Spacer(1, 4))
            continue

        # Bold section headers like **Executive summary**
        if stripped.startswith("**") and stripped.endswith("**"):
            heading_text = stripped.strip("*").replace("&", "&amp;")
            story.append(Paragraph(heading_text, heading_style))

        # Bullet lines
        elif stripped.startswith("- ") or stripped.startswith("• "):
            text = stripped[2:].replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
            story.append(Paragraph(f"• {text}", bullet_style))

        # Numbered lines
        elif len(stripped) > 2 and stripped[0].isdigit() and stripped[1] in ".):":
            text = stripped.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
            story.append(Paragraph(text, bullet_style))

        # Normal body text — handle inline **bold**
        else:
            text = stripped.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
            # Convert **word** to <b>word</b>
            import re
            text = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", text)
            story.append(Paragraph(text, body_style))

    doc.build(story)
    return filename

#5. THE AGENTIC LOOP ──────────────────────────────────────────
def run_research_agent(query: str, save_pdf: bool = True) -> str:
    messages = [{"role": "user", "content": query}]
    tool_calls_made = 0
    MAX_TOOL_CALLS = 10

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
                    print(f"  → calling {block.name}({block.input})")
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
                    brief = block.text
                    if save_pdf:
                        pdf_file = save_to_pdf(brief, query)
                        print(f"\n  Saved to: {pdf_file}")
                    return brief
            break

    return "Agent hit tool call limit without completing."

#6. RUN IT 
if __name__ == "__main__":
    query = "What are the latest moves by Salesforce in the AI agent space?"
    print(f"\nResearching: {query}\n")
    brief = run_research_agent(query, save_pdf=True)
    print(brief)