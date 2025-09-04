from flask_cors import CORS

def init_cors(app):
    CORS(
        app,
        resources={r"/api/*": {"origins": ["http://localhost:3000", "https://stinteportal.co"]}},
        supports_credentials=True,
        methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allow_headers=["Content-Type", "Authorization", "X-User-Id", "X-User-Name"],
    )
