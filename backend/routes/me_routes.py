from flask import Blueprint, jsonify, request
from db import get_db_connection
from auth_utils import verify_token
import psycopg2.extras

bp = Blueprint("me_routes", __name__)

@bp.route("/me/", methods=["GET", "OPTIONS"])
def get_current_user():
    if request.method == "OPTIONS":
        return jsonify({"status": "ok"}), 200

    decoded, error_resp, status = verify_token()
    if error_resp:
        return error_resp, status

    firebase_uid = decoded.get("uid")

    try:
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
