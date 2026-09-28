import sqlite3
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parents[1]
DATABASE_PATH = BASE_DIR / "products.db"

def get_connection():
    connection = sqlite3.connect(DATABASE_PATH)
    connection.row_factory = sqlite3.Row
    return connection

def create_table():
    connection = get_connection()
    try:
        cursor = connection.cursor()
        cursor.execute("""CREATE TABLE IF NOT EXISTS products (id INTEGER PRIMARY KEY AUTOINCREMENT, product_name TEXT NOT NULL, category TEXT NOT NULL, stock_date TEXT, expiry_date TEXT, current_stock INTEGER, historical_sales INTEGER, selling_price REAL, demand_rate REAL, sales_velocity INTEGER, days_left INTEGER, expected_demand INTEGER, prediction TEXT, dataset_product_id INTEGER, discount REAL, final_price REAL, wastage_quantity INTEGER, expiry_risk REAL, waste_risk TEXT, recommended_discount REAL, image_data TEXT)""")
        cursor.execute("PRAGMA table_info(products)")
        cols={r["name"] for r in cursor.fetchall()}
        if "image_data" not in cols: cursor.execute("ALTER TABLE products ADD COLUMN image_data TEXT")
        connection.commit()
    finally: connection.close()

def create_users_table():
    connection=get_connection()
    try:
        cursor=connection.cursor()
        cursor.execute("""CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT UNIQUE NOT NULL, email TEXT UNIQUE, hashed_password TEXT NOT NULL, is_active INTEGER DEFAULT 1, role TEXT DEFAULT 'customer')""")
        cursor.execute("PRAGMA table_info(users)")
        cols={r["name"] for r in cursor.fetchall()}
        if "role" not in cols: cursor.execute("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'customer'")
        cursor.execute("UPDATE users SET role='admin' WHERE username='admin'")
        connection.commit()
    finally: connection.close()

def create_purchases_table():
    connection=get_connection()
    try:
        cursor=connection.cursor()
        cursor.execute("""CREATE TABLE IF NOT EXISTS purchases (id INTEGER PRIMARY KEY AUTOINCREMENT, product_id INTEGER NOT NULL, user_id INTEGER, quantity INTEGER NOT NULL, price_per_unit REAL NOT NULL, total_amount REAL NOT NULL, purchased_at TEXT NOT NULL, days_left_at_purchase INTEGER, waste_risk_at_purchase TEXT, FOREIGN KEY(product_id) REFERENCES products(id))""")
        cursor.execute("PRAGMA table_info(purchases)")
        cols={r["name"] for r in cursor.fetchall()}
        if "days_left_at_purchase" not in cols: cursor.execute("ALTER TABLE purchases ADD COLUMN days_left_at_purchase INTEGER")
        if "waste_risk_at_purchase" not in cols: cursor.execute("ALTER TABLE purchases ADD COLUMN waste_risk_at_purchase TEXT")
        if "user_id" not in cols: cursor.execute("ALTER TABLE purchases ADD COLUMN user_id INTEGER")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_purchases_user_id ON purchases(user_id)")
        connection.commit()
    finally: connection.close()
