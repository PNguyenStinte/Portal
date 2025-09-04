import firebase_admin
from firebase_admin import credentials
from config import FIREBASE_CREDENTIALS

# Initialize Firebase once
if not firebase_admin._apps:
    cred = credentials.Certificate(FIREBASE_CREDENTIALS)
    firebase_admin.initialize_app(cred)
