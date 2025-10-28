# travel_routes.py
from flask import Blueprint, request, jsonify
from db import get_db_connection
import psycopg2.extras
import pandas as pd
from difflib import get_close_matches
from firebase_admin import auth
from auth_utils import verify_token
from datetime import datetime

bp = Blueprint("travel_routes", __name__)

# === Name normalization helpers ===
def normalize_name(name):
    return "".join(e.lower() for e in name if e.isalnum())

def build_employee_map(conn):
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute("SELECT id, name FROM employees")
    rows = cur.fetchall()
    employee_map = {}
    for row in rows:
        norm_name = normalize_name(row["name"].strip())
        employee_map[norm_name] = row["id"]
    print("✅ Employee map keys:", list(employee_map.keys())[:20])
    return employee_map

def find_employee_id(tech_name_raw, employee_map):
    if not tech_name_raw:
        return None
    norm = normalize_name(tech_name_raw.strip())
    if norm in employee_map:
        print(f"✅ Exact match: {tech_name_raw} -> {employee_map[norm]}")
        return employee_map[norm]
    match = get_close_matches(norm, employee_map.keys(), n=1, cutoff=0.6)
    if match:
        emp_id = employee_map[match[0]]
        print(f"🔎 Fuzzy match: {tech_name_raw} -> {emp_id} ({match[0]})")
        return emp_id
    print(f"❌ No match for: {tech_name_raw}")
    return None

# === Upload travel from Excel ===
@bp.route("/travel/upload/", methods=["POST", "OPTIONS"])
def upload_travel():
    if request.method == "OPTIONS":
        return jsonify({"status": "ok"}), 200

    try:
        # --- Verify Firebase token ---
        auth_header = request.headers.get("Authorization")
        if not auth_header:
            return jsonify({"error": "Missing Authorization header"}), 401
        token = auth_header.split("Bearer ")[-1]
        decoded_token = auth.verify_id_token(token)
        firebase_uid = decoded_token["uid"]

        # --- Get uploader info ---
        with get_db_connection() as conn:
            with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
                cur.execute("SELECT id, name FROM users WHERE firebase_uid = %s", (firebase_uid,))
                uploader = cur.fetchone()
                if not uploader:
                    return jsonify({"error": "Uploader not found"}), 404
                uploader_id = uploader["id"]
                uploader_name = uploader["name"]

        # --- Read Excel ---
        file = request.files["file"]
        df = pd.read_excel(file)

        with get_db_connection() as conn:
            cur = conn.cursor()
            # Build employee map once
            employee_map = build_employee_map(conn)
            unmatched_techs = set()
            inserted = 0

            for _, row in df.iterrows():
                planned_start_time_utc = row.get("Planned Start Time Utc")
                name = row.get("Name")
                property_ = row.get("Property")
                job_number = row.get("Job Number")
                visit_number = row.get("Visit Number")
                description = row.get("Description")
                event_type = row.get("Event Type")
                technician_name = row.get("Technician Name")
                department_name = row.get("Department Name")
                status = row.get("Status")
                additional_technicians = row.get("Additional Technicians")
                last_updated_time_utc = row.get("Last Updated Time Utc")

                # ✅ employee_id from Technician Name
                employee_id = find_employee_id(technician_name, employee_map)
                if not employee_id:
                    unmatched_techs.add(technician_name)

                # ✅ last_updated_by is always uploader
                last_updated_by = uploader_id
                last_updated_by_name = uploader_name

                cur.execute(
                    """
                    INSERT INTO travel_events (
                        employee_id, planned_start_time_utc, name, property,
                        job_number, visit_number, description, event_type,
                        technician_name, department_name, status, additional_technicians,
                        last_updated_by, last_updated_time_utc, created_at, last_updated_by_name
                    )
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW(), %s)
                    """,
                    (
                        employee_id,
                        planned_start_time_utc,
                        name,
                        property_,
                        job_number,
                        visit_number,
                        description,
                        event_type,
                        technician_name,
                        department_name,
                        status,
                        additional_technicians,
                        last_updated_by,
                        last_updated_time_utc,
                        last_updated_by_name
                    )
                )
                inserted += 1

            conn.commit()
            cur.close()

        return jsonify({
            "message": f"✅ {inserted} events uploaded successfully.",
            "unmatched_technicians": list(unmatched_techs)
        }), 200

    except Exception as e:
        print("❌ Error uploading events:", str(e))
        return jsonify({"error": str(e)}), 500

# === Fetch travel for FullCalendar ===
@bp.route("/travel/", methods=["GET", "OPTIONS"])
def get_travel():
    if request.method == "OPTIONS":
        return jsonify({"status": "ok"}), 200

    decoded, error_resp, status = verify_token()
    if error_resp:
        return error_resp, status

    try:
        firebase_uid = decoded.get("uid")
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

        # Get user info
        cur.execute("SELECT id, role FROM users WHERE firebase_uid = %s", (firebase_uid,))
        user = cur.fetchone()
        if not user:
            return jsonify({"success": False, "message": "User not found"}), 404

        # Role-based filtering
        if user["role"].lower() in ["scheduler", "admin"]:
            cur.execute("SELECT * FROM travel_events ORDER BY planned_start_time_utc ASC")
        else:
            cur.execute(
                "SELECT * FROM travel_events WHERE employee_id = %s ORDER BY planned_start_time_utc ASC",
                (user["id"],)
            )

        rows = cur.fetchall()
        cur.close()
        conn.close()

        travel_list = []
        for row in rows:
            planned = row.get("planned_start_time_utc")  # for travel
            if isinstance(planned, datetime):
                planned_iso = planned.isoformat()
            else:
                planned_iso = str(planned) if planned else None

            travel_list.append({
                "id": row["id"],
                "title": row["name"],
                "start": planned_iso,
                "extendedProps": {
                    "planned_start_time_utc": planned_iso,
                    "property": row.get("property"),
                    "status": row.get("status"),
                    "technician_name": row.get("technician_name"),
                    "department_name": row.get("department_name"),
                    "description": row.get("description"),
                    "job_number": row.get("job_number"),
                    "visit_number": row.get("visit_number"),
                    "additional_technicians": row.get("additional_technicians"),
                    "travel_type": row.get("travel_type"),
                }
            })

        return jsonify(travel_list), 200

    except Exception as e:
        print("❌ Error fetching travel:", e)
        return jsonify({"success": False, "message": str(e)}), 500


# === Current user info ===
@bp.route("/me/", methods=["GET", "OPTIONS"])
def current_user():
    if request.method == "OPTIONS":
        return jsonify({"status": "ok"}), 200

    decoded, error_resp, status = verify_token()
    if error_resp:
        return error_resp, status

    try:
        firebase_uid = decoded.get("uid")
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute(
            "SELECT id, email, name, role FROM users WHERE firebase_uid = %s",
            (firebase_uid,)
        )
        user = cur.fetchone()
        cur.close()
        conn.close()

        if not user:
            return jsonify({"success": False, "message": "User not found"}), 404

        return jsonify(user), 200

    except Exception as e:
        print("❌ Error fetching user:", e)
        return jsonify({"success": False, "message": str(e)}), 500
    

# === Delete all travel events ===
@bp.route("/travel/delete_all/", methods=["DELETE", "OPTIONS"])
def delete_all_travel():
    if request.method == "OPTIONS":
        return jsonify({"status": "ok"}), 200

    decoded, error_resp, status = verify_token()
    if error_resp:
        return error_resp, status

    try:
        conn = get_db_connection()
        cur = conn.cursor()
        # ⚠️ Deletes all travel events. Add WHERE clause if needed.
        cur.execute("DELETE FROM travel_events")
        conn.commit()
        cur.close()
        conn.close()
        return jsonify({"message": "✅ All travel events deleted."}), 200
    except Exception as e:
        print("❌ Error deleting travel events:", e)
        return jsonify({"error": str(e)}), 500

