import sys
import sqlite3
import json
from pathlib import Path

import pandas as pd


# ============================================================
# PROJECT ROOT
# ============================================================

BASE_DIR = Path(__file__).resolve().parents[1]

sys.path.insert(0, str(BASE_DIR))

from ml.src.predict import predict_price

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
# IMPORT DATASET + ML PREDICTION
# ============================================================

inserted = 0

print("Running ML predictions...")

for _, row in df.iterrows():

    # --------------------------------------------------------
    # Prepare product data for ML model
    # --------------------------------------------------------

    product_data = {
        "Product_Name": row["Product_Name"],
        "Category": row["Category"],
        "Stock_Date": row["Stock_Date"],
        "Expiry_Date": row["Expiry_Date"],
        "Current_Stock": int(row["Current_Stock"]),
        "Historical_Sales": int(row["Historical_Sales"]),
        "Selling_Price": float(row["Selling_Price"]),
        "Demand_Rate": float(row["Demand_Rate"]),
        "Sales_Velocity": int(row["Sales_Velocity"]),
        "Days_Left": int(row["Days_Left"]),
        "Expected_Demand": int(row["Expected_Demand"]),
    }

    # --------------------------------------------------------
    # RUN YOUR ML MODEL
    # --------------------------------------------------------

    prediction = predict_price(product_data)

    # --------------------------------------------------------
    # Store product + ML prediction
    # --------------------------------------------------------

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
            expected_demand,

            prediction,
            discount,
            final_price,
            waste_risk,
            recommended_discount
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
        int(row["Expected_Demand"]),

        # Complete ML prediction stored as JSON
        json.dumps(prediction),

        # ML recommended discount
        float(prediction["recommended_discount"]),

        # ML final price
        float(prediction["final_price"]),

        # ML waste risk category
        prediction["waste_risk_category"],

        # ML recommended discount
        float(prediction["recommended_discount"]),
    ))

    inserted += 1

    # Progress message every 1000 products
    if inserted % 1000 == 0:
        print(f"Processed {inserted} products...")


# ============================================================
# SAVE
# ============================================================

connection.commit()
connection.close()


# ============================================================
# RESULT
# ============================================================

print()
print("Import completed successfully!")
print("Rows inserted:", inserted)
print("ML predictions generated:", inserted)