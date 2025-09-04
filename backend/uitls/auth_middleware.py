from flask import request, jsonify
from firebase_admin import auth

def verify_token():
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return None, jsonify({"error": "Missing or invalid Authorization header"}), 401
    id_token = auth_header.split(" ")[1]
    try:
        decoded = auth.verify_id_token(id_token)
        return decoded, None, None
    except Exception as e:
        return None, jsonify({"error": str(e)}), 401
