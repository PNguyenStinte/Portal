from flask import Blueprint, jsonify
from db import get_db_connection

bp = Blueprint("materials_routes", __name__)

@bp.route("/materials/data", methods=["GET"])
def get_data_materials():
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT id, category, description, manufacture, vendor
                FROM materials
                WHERE type = 'data'
                ORDER BY id;
            """)
            rows = cur.fetchall()
    return jsonify([
        {
            "id": r["id"],
            "category": r["category"],
            "description": r["description"],
            "manufacture": r["manufacture"],
            "vendor": r["vendor"],
        }
        for r in rows
    ])


@bp.route("/materials/electrical", methods=["GET"])
def get_electrical_materials():
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT id, description, manufacture, vendor
                FROM materials
                WHERE type = 'electrical'
                ORDER BY id;
            """)
            rows = cur.fetchall()
    return jsonify([
        {
            "id": r["id"],
            "description": r["description"],
            "manufacture": r["manufacture"],
            "vendor": r["vendor"],
        }
        for r in rows
    ])

