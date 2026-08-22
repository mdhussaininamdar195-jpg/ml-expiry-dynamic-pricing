import sqlite3
from pathlib import Path

import pandas as pd


# ============================================================
# PATHS
# ============================================================

BASE_DIR = Path(__file__).resolve().parents[1]

CSV_PATH = (
    BASE_DIR
    / "ml"
    / "datasets"
    / "raw"
    / "synthetic_expiry_pricing_dataset.csv"
)

DB_PATH = BASE_DIR / "products.db"


# ============================================================
# LOAD DATASET
# ============================================================

print("Loading dataset...")

df = pd.read_csv(CSV_PATH)

print("Dataset loaded successfully")
print("Total rows:", len(df))


# ============================================================
# CONNECT TO SQLITE
# ============================================================

connection = sqlite3.connect(DB_PATH)

cursor = connection.cursor()


# ============================================================
# CLEAR EXISTING PRODUCTS
# ============================================================

print("Clearing existing products...")

cursor.execute("DELETE FROM products")

print("Existing products cleared")


# ============================================================
# IMPORT DATASET
# ============================================================

inserted = 0

for _, row in df.iterrows():

    cursor.execute("""
        INSERT INTO products (
            product_name,
            category,
            stock_date,
            expiry_date,
            current_stock,
            historical_sales,
            selling_price,
            demand_rate,
            sales_velocity,
            days_left,
            expected_demand
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        row["Product_Name"],
        row["Category"],
        row["Stock_Date"],
        row["Expiry_Date"],
        int(row["Current_Stock"]),
        int(row["Historical_Sales"]),
        float(row["Selling_Price"]),
        float(row["Demand_Rate"]),
        int(row["Sales_Velocity"]),
        int(row["Days_Left"]),
        int(row["Expected_Demand"])
    ))

    inserted += 1


# ============================================================
# SAVE
# ============================================================

connection.commit()
connection.close()


# ============================================================
# RESULT
# ============================================================

print("Import completed successfully!")
print("Rows inserted:", inserted)