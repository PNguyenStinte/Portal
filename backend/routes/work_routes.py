# work_routes.py
from flask import Blueprint, request, jsonify
from db import get_db_connection
import psycopg2.extras
import pandas as pd
from difflib import get_close_matches
from firebase_admin import auth
from auth_utils import verify_token
from datetime import datetime

bp = Blueprint("work_routes", __name__)

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
    if not tech_name_raw or pd.isna(tech_name_raw):
        return None
    norm = normalize_name(str(tech_name_raw).strip())
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

# === Upload work from Excel ===
@bp.route("/work/upload/", methods=["POST", "OPTIONS"])
def upload_work():
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
            employee_map = build_employee_map(conn)
            unmatched_techs = set()
            inserted = 0

            for _, row in df.iterrows():
                date_and_time = row.get("Date and Time")
                customer_name = row.get("Customer Name")
                property_ = row.get("Property")
                job = row.get("Job")
                visit = row.get("Visit")
                description = row.get("Description")
                job_type = row.get("Job Type")
                primary_technician = row.get("Primary Technician")
                department = row.get("Department")
                visit_status = row.get("Visit Status")
                last_updated_time_utc = row.get("Last Updated Time Utc")
                address_line = row.get("Address Line 1")
                city = row.get("City")
                state = row.get("State")
                zipcode = row.get("Zipcode")

                # ✅ employee_id from Technician Name
                employee_id = find_employee_id(primary_technician, employee_map)
                if not employee_id:
                    unmatched_techs.add(primary_technician)

                # ✅ last_updated_by is always uploader
                last_updated_by = uploader_id
                last_updated_by_name = uploader_name

                cur.execute(
                    """
                    INSERT INTO work_events (
                        employee_id, date_and_time, customer_name, property,
                        job, visit, description, job_type, primary_technician,
                        department, visit_status, last_updated_by, last_updated_by_name,
                        last_updated_time_utc, address_line, city, state, zipcode, created_at
                    )
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW())
                    """,
                    (
                        employee_id, date_and_time, customer_name, property_,
                        job, visit, description, job_type, primary_technician,
                        department, visit_status, last_updated_by, last_updated_by_name,
                        last_updated_time_utc, address_line, city, state, zipcode
                    )
                )
                inserted += 1

            conn.commit()
            cur.close()

        return jsonify({
            "message": f"✅ {inserted} work events uploaded successfully.",
            "unmatched_technicians": list(unmatched_techs)
        }), 200

    except Exception as e:
        print("❌ Error uploading work:", str(e))
        return jsonify({"error": str(e)}), 500


# === Fetch work for FullCalendar ===
@bp.route("/work/", methods=["GET", "OPTIONS"])
def get_work():
    if request.method == "OPTIONS":
        return jsonify({"status": "ok"}), 200

    decoded, error_resp, status = verify_token()
    if error_resp:
        return error_resp, status

    try:
        firebase_uid = decoded.get("uid")
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

        cur.execute("SELECT id, role FROM users WHERE firebase_uid = %s", (firebase_uid,))
        user = cur.fetchone()
        if not user:
            return jsonify({"success": False, "message": "User not found"}), 404

        # Role-based filtering
        if user["role"].lower() in ["scheduler", "admin"]:
            cur.execute("SELECT * FROM work_events ORDER BY date_and_time ASC")
        else:
            cur.execute(
                "SELECT * FROM work_events WHERE employee_id = %s ORDER BY date_and_time ASC",
                (user["id"],)
            )

        rows = cur.fetchall()
        cur.close()
        conn.close()

        work_list = []
        for row in rows:
            dt = row.get("date_and_time")
            start_iso = dt.isoformat() if isinstance(dt, datetime) else str(dt)
            work_list.append({
            "id": row["id"],
            "title": row.get("description") or row.get("job") or "Work Event",
            "start": start_iso,
            "extendedProps": {
                "property": row.get("property"),
                "status": row.get("visit_status"),
                "technician_name": row.get("primary_technician"),
                "department_name": row.get("department"),
                "customer_name": row.get("customer_name"),
                "job_number": row.get("job"),
                "visit_number": row.get("visit"),
                "work_type": row.get("job_type"),
                "address_line": row.get("address_line"),
                "city": row.get("city"),
                "state": row.get("state"),
                "zipcode": row.get("zipcode"),
                "event_type": "work"   # ✅ ADD THIS LINE
            }
        })
        return jsonify(work_list), 200

    except Exception as e:
        print("❌ Error fetching work:", e)
        return jsonify({"success": False, "message": str(e)}), 500


# === Delete all work events ===
@bp.route("/work/delete_all/", methods=["DELETE", "OPTIONS"])
def delete_all_work():
    if request.method == "OPTIONS":
        return jsonify({"status": "ok"}), 200

    decoded, error_resp, status = verify_token()
    if error_resp:
        return error_resp, status

    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("DELETE FROM work_events")
        conn.commit()
        cur.close()
        conn.close()
        return jsonify({"message": "✅ All work events deleted."}), 200
    except Exception as e:
        print("❌ Error deleting work events:", e)
        return jsonify({"error": str(e)}), 500
