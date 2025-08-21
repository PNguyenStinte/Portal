from flask import Flask, jsonify, request
from flask_cors import CORS
import psycopg2
import psycopg2.extras
import os
import json

app = Flask(__name__)
CORS(app)

def get_db_connection():
    conn = psycopg2.connect(
        host="localhost",
        database="technician_portal",   # change if your DB name is different
        user="postgres",                # change if your username is different
        password="Stinte1!"             # change to your real password
    )
    return conn


@app.route("/visits", methods=["GET"])
def get_visits():
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)

    # join visits with employees (primary tech) + departments
    cur.execute("""
        SELECT v.visit_id, v.visit_description, v.todo, v.required_certifications,
               v.department_id, d.name AS department_name,
               v.primary_technician_id, v.additional_technicians,
               v.visit_date, v.duration_hours,
               e.name AS primary_technician_name
        FROM visits v
        LEFT JOIN employees e ON v.primary_technician_id = e.id
        LEFT JOIN departments d ON v.department_id = d.id
        ORDER BY v.visit_id DESC;
    """)
    rows = cur.fetchall()

    # preload employees for mapping additional_technicians IDs -> names
    cur.execute("SELECT id, name FROM employees;")
    employee_map = {str(r[0]): r[1] for r in cur.fetchall()}

    cur.close()
    conn.close()

    visits = []
    for r in rows:
        additional_ids = r["additional_technicians"] or []
        # convert JSONB IDs to names
        additional_names = [employee_map.get(str(i), f"ID:{i}") for i in additional_ids]

        visits.append({
            "visit_id": r["visit_id"],
            "visit_description": r["visit_description"],
            "todo": r["todo"],
            "required_certifications": r["required_certifications"],
            "department_id": r["department_id"],
            "department_name": r["department_name"],
            "primary_technician_id": r["primary_technician_id"],
            "primary_technician_name": r["primary_technician_name"],
            "additional_technicians": additional_names,
            "visit_date": r["visit_date"],
            "duration_hours": r["duration_hours"],
        })

    return jsonify(visits)



# Employees
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


# Data Materials
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
        {
            "id": r[0],
            "category": r[1],
            "description": r[2],
            "manufacture": r[3],
            "vendor": r[4]
        }
        for r in rows
    ]
    return jsonify(materials)


# Electrical Materials
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
        {
            "id": r[0],
            "description": r[1],
            "manufacture": r[2],
            "vendor": r[3]
        }
        for r in rows
    ]
    return jsonify(materials)


# Company Info
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
