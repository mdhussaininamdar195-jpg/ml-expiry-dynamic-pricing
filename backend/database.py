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
    cursor = connection.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,

            product_name TEXT NOT NULL,
            category TEXT NOT NULL,

            stock_date TEXT,
            expiry_date TEXT,

            current_stock INTEGER,
            historical_sales INTEGER,

            selling_price REAL,

            demand_rate REAL,
            sales_velocity INTEGER,

            days_left INTEGER,
            expected_demand INTEGER,

            prediction TEXT
        )
    """)

    connection.commit()
    connection.close()