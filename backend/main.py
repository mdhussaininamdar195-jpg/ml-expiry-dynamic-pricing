from fastapi import FastAPI
from pydantic import BaseModel
import sys
from pathlib import Path


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


# ============================================================
# PRODUCT INPUT MODEL
# ============================================================

class Product(BaseModel):

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


    result = predict_price(product_data)


    return result