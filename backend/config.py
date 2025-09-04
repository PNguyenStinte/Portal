import os
from firebase_admin import credentials

# === Database Config ===
DB_CONFIG = {
    "host": os.getenv("DB_HOST", "localhost"),
    "dbname": os.getenv("DB_NAME", "technician_portal"),
    "user": os.getenv("DB_USER", "postgres"),
    "password": os.getenv("DB_PASSWORD", "Stinte1!"),  # 🔒 ideally use .env
    "port": os.getenv("DB_PORT", "5432"),
}

# === Firebase Config Path ===
FIREBASE_CREDENTIALS = os.path.join(os.path.dirname(__file__), "firebase-admin.json")
