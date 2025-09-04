from flask import Flask
from flask_cors import CORS
from cors import init_cors

# Import firebase init (runs automatically)
import firebase_app  

# cors.py
from flask_cors import CORS
def init_cors(app):
    CORS(
        app,
        resources={
            r"/api/*": {
                "origins": ["http://localhost:3000", "https://stinteportal.co"],
                "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
                "allow_headers": ["Content-Type", "Authorization", "X-User-Id", "X-User-Name"],
                "supports_credentials": True,
            }
        },
    )
# Import routes
from routes import (
    auth_routes,
    events_routes,
    employees_routes,
    materials_routes,
    company_routes,
)

app = Flask(__name__)
init_cors(app)   # ✅ clean import

# Register routes
app.register_blueprint(auth_routes.bp, url_prefix="/api")
app.register_blueprint(events_routes.bp, url_prefix="/api")
app.register_blueprint(employees_routes.bp, url_prefix="/api")
app.register_blueprint(materials_routes.bp, url_prefix="/api")
app.register_blueprint(company_routes.bp, url_prefix="/api")

print("📌 Registered routes:")
print(app.url_map)

if __name__ == "__main__":
    app.run(debug=True, port=5000)
