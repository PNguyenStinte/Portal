from flask import Blueprint, jsonify
from db import get_db_connection
import psycopg2.extras

bp = Blueprint("employees_routes", __name__)

@bp.route("/employees", methods=["GET"])
def get_employees():
    with get_db_connection() as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute("""
                SELECT id, name, position, phone, email, certifications
                FROM employees
                ORDER BY id;
            """)
            rows = cur.fetchall()
    return jsonify(rows)
