import sqlite3
import pandas as pd

# ============================================================
# PATHS
# ============================================================

CSV_PATH = "ml/datasets/raw/synthetic_expiry_pricing_dataset.csv"
DB_PATH = "products.db"


# ============================================================
# LOAD DATASET
# ============================================================

df = pd.read_csv(CSV_PATH)

print("Dataset loaded successfully")
print("Total rows:", len(df))


# ============================================================
# CONNECT TO SQLITE
# ============================================================

connection = sqlite3.connect(DB_PATH)
cursor = connection.cursor()


# ============================================================
# IMPORT DATA
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
            expected_demand,
            dataset_product_id,
            discount,
            final_price,
            wastage_quantity,
            expiry_risk,
            waste_risk,
            recommended_discount
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
        row["Product_ID"],
        float(row["Discount"]),
        float(row["Final_Price"]),
        int(row["Wastage_Quantity"]),
        float(row["Expiry_Risk"]),
        row["Waste_Risk"],
        float(row["Recommended_Discount"])
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