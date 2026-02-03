
import sqlite3
import pandas as pd
import os

DB_PATH = "nexus_health.db"

if not os.path.exists(DB_PATH):
    print(f"ERROR: {DB_PATH} not found in {os.getcwd()}")
    exit()

conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()

# Get all tables
cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
tables = [t[0] for t in cursor.fetchall()]

print(f"Found {len(tables)} tables: {tables}")

for table in tables:
    print(f"\n{'='*30}")
    print(f"TABLE: {table}")
    print(f"{'='*30}")
    
    # Get count
    count = cursor.execute(f"SELECT COUNT(*) FROM {table}").fetchone()[0]
    print(f"Total Rows: {count}")
    
    # Get sample
    try:
        df = pd.read_sql_query(f"SELECT * FROM {table} LIMIT 5", conn)
        if not df.empty:
            print(df.to_string())
        else:
            print("(Table is empty)")
    except Exception as e:
        print(f"Error reading table: {e}")

conn.close()
