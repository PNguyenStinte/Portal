import psycopg2
from psycopg2.extras import execute_values
from server import employees, data_materials, electrical_materials   # import from server.py

# Database connection
conn = psycopg2.connect(
    host="localhost",         
    database="technician_portal",     
    user="postgres",          
    password="Stinte1!"   
)
cur = conn.cursor()

# Insert employees
if employees:
    employee_values = [(e["name"], e["position"], e["phone"], e["email"]) for e in employees]
    execute_values(cur,
        """
        INSERT INTO employees (name, position, phone, email)
        VALUES %s
        ON CONFLICT (email) DO NOTHING;
        """,
        employee_values
    )

# Insert data materials
if data_materials:
    data_values = [(m["category"], m["description"], m["manufacture"], m["vendor"], "data") for m in data_materials]
    execute_values(cur,
        """
        INSERT INTO materials (category, description, manufacture, vendor, type)
        VALUES %s
        ON CONFLICT (description, type) DO NOTHING;
        """,
        data_values
    )

# Insert electrical materials
if electrical_materials:
    electrical_values = [(None, m["description"], m["manufacture"], m["vendor"], "electrical") for m in electrical_materials]
    execute_values(cur,
        """
        INSERT INTO materials (category, description, manufacture, vendor, type)
        VALUES %s
        ON CONFLICT (description, type) DO NOTHING;
        """,
        electrical_values
    )

conn.commit()
cur.close()
conn.close()

print("✅ Migration complete! Data inserted into Postgres.")
