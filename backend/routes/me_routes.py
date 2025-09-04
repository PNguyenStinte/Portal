from flask import Blueprint, jsonify, request
from db import get_db_connection
from auth_utils import verify_token

bp = Blueprint("me_routes", __name__)

@bp.route("/me/", methods=["GET", "OPTIONS"])
def get_current_user():
    if request.method == "OPTIONS":
        return jsonify({"status": "ok"}), 200

    decoded, error_resp, status = verify_token()
    if error_resp:
        return error_resp, status

    firebase_uid = decoded.get("uid")
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT id, email, name, role FROM users WHERE firebase_uid=%s", (firebase_uid,))
    user = cur.fetchone()
    cur.close()
    conn.close()

    if not user:
        return jsonify({"success": False, "message": "User not found"}), 404

    return jsonify({
        "id": user[0],
        "email": user[1],
        "name": user[2],
        "role": user[3]
    })
