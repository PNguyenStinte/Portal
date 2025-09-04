#config.py
import os

# === Database Config ===
DB_CONFIG = {
    "host": os.getenv("DB_HOST", "localhost"),
    "dbname": os.getenv("DB_NAME", "technician_portal"),
    "user": os.getenv("DB_USER", "postgres"),
    "password": os.getenv("DB_PASSWORD", "Stinte1!"),  # ideally use .env
    "port": os.getenv("DB_PORT", "5432"),
}

# === Firebase Config Path ===
# Set this env variable locally or default to a local secure path
FIREBASE_CREDENTIALS = os.getenv(
    "FIREBASE_CREDENTIALS_PATH",
    "C:\\Users\\Phi Nguyen\\Secrets\\firebase-admin.json"  # your local path
)