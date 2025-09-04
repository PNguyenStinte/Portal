import uuid
import psycopg2

# --- Database connection ---
conn = psycopg2.connect(
    host="localhost",
    database="technician_portal",
    user="postgres",
    password="Stinte1!"
)
cur = conn.cursor()

# --- Fetch all users without a firebase_uid ---
cur.execute("SELECT id, email, name FROM users WHERE firebase_uid IS NULL OR firebase_uid = ''")
users = cur.fetchall()

print(f"Found {len(users)} users without firebase_uid.")

for user_id, email, name in users:
    # Generate a unique placeholder UID
    placeholder_uid = str(uuid.uuid4())

    # Update the user in the database
    cur.execute(
        "UPDATE users SET firebase_uid = %s WHERE id = %s",
        (placeholder_uid, user_id)
    )
    print(f"Assigned UID {placeholder_uid} to {name} ({email})")

# Commit changes and close
conn.commit()
cur.close()
conn.close()

print("✅ All missing firebase_uid values populated.")
