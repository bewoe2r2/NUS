import sqlite3
conn = sqlite3.connect('nexus_health.db')
conn.execute('''CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY,
    user_id TEXT UNIQUE,
    name TEXT,
    tier TEXT DEFAULT 'BASIC',
    created_at INTEGER
)''')
conn.commit()
print('Created users table')
conn.close()
