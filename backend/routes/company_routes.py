from flask import Blueprint, jsonify

bp = Blueprint("company_routes", __name__)

@bp.route("/company-info", methods=["GET"])
def company_info():
    return jsonify({
        "name": "STRATEGIC INFRASTRUCTURE TECHNOLOGIES",
        "address": "21121 W Hardy Rd, Houston, TX 77073",
        "phone": "(833) 930-2583",
        "email": "info@stinte.co",
        "logo_url": "http://localhost:5000/static/logo.png"
    })
