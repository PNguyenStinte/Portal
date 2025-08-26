from flask import Flask, jsonify, request
from flask_cors import CORS
import psycopg2
import psycopg2.extras
import os
import json

# Firebase Admin
import firebase_admin
from firebase_admin import auth, credentials

# Initialize Flask
app = Flask(__name__)
CORS(app)

# === Database connection ===
def get_db_connection():
    conn = psycopg2.connect(
        host="localhost",
        database="technician_portal",   # change if needed
        user="postgres",                # change if needed
        password="Stinte1!"             # change if needed
    )
    return conn

# === Firebase Admin init ===
cred = credentials.Certificate(os.path.join(os.path.dirname(__file__), "firebase-admin.json"))
firebase_admin.initialize_app(cred)


# === LOGIN ENDPOINT ===
@app.route("/api/login", methods=["POST"])
def login():
    data = request.json
    id_token = data.get("idToken")

    if not id_token:
        return jsonify({"success": False, "message": "No ID token provided"}), 400

    try:
        # Verify Firebase token
        decoded_token = auth.verify_id_token(id_token)
        email = decoded_token.get("email")
        name = decoded_token.get("name", "")
        uid = decoded_token.get("uid")

        # Restrict to allowed domains
        allowed_domains = ["stinte.co", "upandcs.com"]
        if not any(email.endswith(f"@{d}") for d in allowed_domains):
            return jsonify({"success": False, "message": "Only STINTE and UPANDCS are allowed"}), 403

        # Check or create/update user in Postgres
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)

        cur.execute("SELECT * FROM users WHERE email=%s", (email,))
        user = cur.fetchone()

        if not user:
            # Insert new user
            cur.execute(
                """
                INSERT INTO users (firebase_uid, name, email, role)
                VALUES (%s, %s, %s, %s)
                RETURNING id, email, name, firebase_uid, role
                """,
                (uid, name, email, "technician")  # default role
            )
            user = cur.fetchone()
        else:
            # Update existing user to make sure firebase_uid + name are stored
            cur.execute(
                """
                UPDATE users
                SET firebase_uid = %s, name = %s
                WHERE email = %s
                RETURNING id, email, name, firebase_uid, role
                """,
                (uid, name, email)
            )
            user = cur.fetchone()

        conn.commit()
        cur.close()
        conn.close()

        return jsonify({"success": True, "user": dict(user)}), 200

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 401



# === EMPLOYEES ===
@app.route("/employees", methods=["GET"])
def get_employees():
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT id, name, position, phone, email, certifications FROM employees ORDER BY id;")
    rows = cur.fetchall()
    cur.close()
    conn.close()

    employees = [
        {"id": r[0], "name": r[1], "position": r[2], "phone": r[3], "email": r[4], "certifications": r[5]}
        for r in rows
    ]
    return jsonify(employees)


# === DATA MATERIALS ===
@app.route("/materials/data", methods=["GET"])
def get_data_materials():
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("""
        SELECT id, category, description, manufacture, vendor
        FROM materials
        WHERE type = 'data'
        ORDER BY id;
    """)
    rows = cur.fetchall()
    cur.close()
    conn.close()

    materials = [
        {"id": r[0], "category": r[1], "description": r[2], "manufacture": r[3], "vendor": r[4]}
        for r in rows
    ]
    return jsonify(materials)


# === ELECTRICAL MATERIALS ===
@app.route("/materials/electrical", methods=["GET"])
def get_electrical_materials():
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("""
        SELECT id, description, manufacture, vendor
        FROM materials
        WHERE type = 'electrical'
        ORDER BY id;
    """)
    rows = cur.fetchall()
    cur.close()
    conn.close()

    materials = [
        {"id": r[0], "description": r[1], "manufacture": r[2], "vendor": r[3]}
        for r in rows
    ]
    return jsonify(materials)


# === COMPANY INFO ===
@app.route("/company-info", methods=["GET"])
def company_info():
    return jsonify({
        "name": "STRATEGIC INFRASTRUCTURE TECHNOLOGIES",
        "address": "21121 W Hardy Rd, Houston, TX 77073",
        "phone": "(833) 930-2583",
        "email": "info@stinte.co",
        "logo_url": "http://localhost:5000/static/logo.png"
    })


if __name__ == "__main__":
    app.run(debug=True, port=5000)