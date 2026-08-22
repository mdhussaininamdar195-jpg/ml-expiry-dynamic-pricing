import sqlite3
from pathlib import Path


# ============================================================
# DATABASE CONFIGURATION
# ============================================================

BASE_DIR = Path(__file__).resolve().parents[1]

DATABASE_PATH = BASE_DIR / "products.db"


# ============================================================
# DATABASE CONNECTION
# ============================================================

def get_connection():

    connection = sqlite3.connect(
        DATABASE_PATH
    )

    connection.row_factory = sqlite3.Row

    return connection


# ============================================================
# PRODUCTS TABLE
# ============================================================

def create_table():

    connection = get_connection()

    try:

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

                prediction TEXT,

                -- Dataset fields
                dataset_product_id INTEGER,
                discount REAL,
                final_price REAL,
                wastage_quantity INTEGER,
                expiry_risk REAL,
                waste_risk TEXT,
                recommended_discount REAL
            )
        """)

        connection.commit()

    finally:

        connection.close()


# ============================================================
# USERS TABLE - JWT AUTHENTICATION
# ============================================================

def create_users_table():

    connection = get_connection()

    try:

        cursor = connection.cursor()

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (

                id INTEGER PRIMARY KEY AUTOINCREMENT,

                username TEXT UNIQUE NOT NULL,
                email TEXT UNIQUE,

                hashed_password TEXT NOT NULL,

                is_active INTEGER DEFAULT 1
            )
        """)

        connection.commit()

    finally:

        connection.close()