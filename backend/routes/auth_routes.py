# auth_routes.py
from flask import Blueprint, request, jsonify
from firebase_admin import auth
import psycopg2.extras
from db import get_db_connection

bp = Blueprint("auth_routes", __name__)

@bp.route("/login", methods=["POST"])
def login():
    data = request.json or {}
    id_token = data.get("idToken")

    if not id_token:
        return jsonify({"success": False, "message": "No ID token provided"}), 400

    try:
        decoded_token = auth.verify_id_token(id_token)
        email = decoded_token.get("email")
        name = decoded_token.get("name", "")
        uid = decoded_token.get("uid")

        if not email:
            return jsonify({"success": False, "message": "No email in Firebase token"}), 400

        allowed_domains = ["stinte.co", "upandcs.com"]
        if not any(email.endswith(f"@{d}") for d in allowed_domains):
            return jsonify({"success": False, "message": "Only STINTE and UPANDCS are allowed"}), 403

        # DB lookup / create / update
        with get_db_connection() as conn:
            with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
                cur.execute("SELECT * FROM users WHERE email = %s", (email,))
                user = cur.fetchone()

                if not user:
                    cur.execute("""
                        INSERT INTO users (firebase_uid, name, email, role)
                        VALUES (%s, %s, %s, %s)
                        RETURNING id, email, name, firebase_uid, role
                    """, (uid, name, email, "technician"))
                    user = cur.fetchone()
                else:
                    cur.execute("""
                        UPDATE users
                        SET firebase_uid = %s, name = %s
                        WHERE email = %s
                        RETURNING id, email, name, firebase_uid, role
                    """, (uid, name, email))
                    user = cur.fetchone()

                conn.commit()

        return jsonify({"success": True, "user": dict(user)}), 200

    except Exception as e:
        return jsonify({"success": False, "message": "Authentication failed", "error": str(e)}), 401
