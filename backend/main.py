from fastapi import FastAPI
from pydantic import BaseModel
import sys
from pathlib import Path
import json

from backend.database import create_table, get_connection


# ============================================================
# ADD PROJECT ROOT TO PYTHON PATH
# ============================================================

BASE_DIR = Path(__file__).resolve().parents[1]

sys.path.append(
    str(BASE_DIR / "ml" / "src")
)


# ============================================================
# IMPORT ML PREDICTION FUNCTION
# ============================================================

from predict import predict_price


# ============================================================
# CREATE FASTAPI APP
# ============================================================

app = FastAPI()

create_table()


# ============================================================
# PRODUCT INPUT MODEL
# ============================================================

class Product(BaseModel):

    product_id: int | None = None

    product_name: str
    category: str

    stock_date: str
    expiry_date: str

    current_stock: int
    historical_sales: int

    selling_price: float

    demand_rate: float
    sales_velocity: int

    days_left: int
    expected_demand: int


# ============================================================
# HOME ROUTE
# ============================================================

@app.get("/")
def root():

    return {
        "message": "Expiry Dynamic Pricing Backend is running"
    }


# ============================================================
# PRODUCT + ML PREDICTION
# ============================================================

@app.post("/predict")
def predict_product(product: Product):

    product_data = {

        "Product_Name": product.product_name,
        "Category": product.category,

        "Stock_Date": product.stock_date,
        "Expiry_Date": product.expiry_date,

        "Current_Stock": product.current_stock,
        "Historical_Sales": product.historical_sales,

        "Selling_Price": product.selling_price,

        "Demand_Rate": product.demand_rate,
        "Sales_Velocity": product.sales_velocity,

        "Days_Left": product.days_left,
        "Expected_Demand": product.expected_demand
    }

    # Run ML prediction
    result = predict_price(product_data)

    # Save prediction to database
    if product.product_id is not None:

        connection = get_connection()
        cursor = connection.cursor()

        cursor.execute("""
            UPDATE products
            SET prediction = ?
            WHERE id = ?
        """, (
            json.dumps(result),
            product.product_id
        ))

        connection.commit()
        connection.close()

    return result


# ============================================================
# CREATE PRODUCT
# ============================================================

@app.post("/products")
def create_product(product: Product):

    connection = get_connection()
    cursor = connection.cursor()

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
        product.product_name,
        product.category,
        product.stock_date,
        product.expiry_date,
        product.current_stock,
        product.historical_sales,
        product.selling_price,
        product.demand_rate,
        product.sales_velocity,
        product.days_left,
        product.expected_demand
    ))

    connection.commit()

    product_id = cursor.lastrowid

    connection.close()

    return {
        "message": "Product added successfully",
        "product_id": product_id
    }


# ============================================================
# GET ALL PRODUCTS
# ============================================================

@app.get("/products")
def get_products():

    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute("SELECT * FROM products")

    products = cursor.fetchall()

    connection.close()

    return [dict(product) for product in products]