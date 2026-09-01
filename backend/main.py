from fastapi import FastAPI, HTTPException, Depends
from pydantic import BaseModel
import json

from fastapi.security import OAuth2PasswordRequestForm

from backend.database import (
    create_table,
    create_users_table,
    create_purchases_table,
    get_connection
)

from backend.auth import (
    get_password_hash,
    verify_password,
    create_access_token,
    get_current_user
)

from ml.src.predict import predict_price


# ============================================================
# CREATE FASTAPI APP
# ============================================================

app = FastAPI()

create_table()
create_users_table()
create_purchases_table()


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
# USER REGISTRATION MODEL
# ============================================================

class UserRegister(BaseModel):

    username: str
    email: str | None = None
    password: str
# ============================================================
# PURCHASE INPUT MODEL
# ============================================================

class PurchaseRequest(BaseModel):

    quantity: int


# ============================================================
# HOME ROUTE - PUBLIC
# ============================================================

@app.get("/")
def root():

    return {
        "message": "Expiry Dynamic Pricing Backend is running"
    }


# ============================================================
# USER REGISTRATION - PUBLIC
# ============================================================

@app.post("/register")
def register_user(user: UserRegister):

    connection = get_connection()
    cursor = connection.cursor()

    # Check whether username already exists
    cursor.execute(
        "SELECT id FROM users WHERE username = ?",
        (user.username,)
    )

    existing_user = cursor.fetchone()

    if existing_user:

        connection.close()

        raise HTTPException(
            status_code=400,
            detail="Username already registered"
        )

    # Hash password before storing it
    hashed_password = get_password_hash(
        user.password
    )

    cursor.execute("""
        INSERT INTO users (
            username,
            email,
            hashed_password
        )
        VALUES (?, ?, ?)
    """, (
        user.username,
        user.email,
        hashed_password
    ))

    connection.commit()

    user_id = cursor.lastrowid

    connection.close()

    return {
        "message": "User registered successfully",
        "user_id": user_id,
        "username": user.username
    }


# ============================================================
# LOGIN + JWT TOKEN - PUBLIC
# ============================================================

@app.post("/token")
def login(
    form_data: OAuth2PasswordRequestForm = Depends()
):

    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute("""
        SELECT id, username, hashed_password, is_active
        FROM users
        WHERE username = ?
    """, (
        form_data.username,
    ))

    user = cursor.fetchone()

    connection.close()

    if user is None:

        raise HTTPException(
            status_code=401,
            detail="Incorrect username or password"
        )

    if not verify_password(
        form_data.password,
        user["hashed_password"]
    ):

        raise HTTPException(
            status_code=401,
            detail="Incorrect username or password"
        )

    if not user["is_active"]:

        raise HTTPException(
            status_code=400,
            detail="Inactive user"
        )

    access_token = create_access_token(
        data={
            "sub": user["username"]
        }
    )

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }


# ============================================================
# CURRENT USER - PROTECTED
# ============================================================

@app.get("/auth/me")
def read_current_user(
    current_user: dict = Depends(get_current_user)
):

    return {
        "message": "Authentication successful",
        "user": current_user
    }


# ============================================================
# PRODUCT + ML PREDICTION - PROTECTED
# ============================================================

@app.post("/predict")
def predict_product(
    product: Product,
    current_user: dict = Depends(get_current_user)
):

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
# CREATE PRODUCT + AUTOMATIC ML PREDICTION - PROTECTED
# ============================================================

@app.post("/products")
def create_product(
    product: Product,
    current_user: dict = Depends(get_current_user)
):

    # 1. Prepare product data for ML model

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

    # 2. Run ML prediction automatically

    prediction = predict_price(product_data)

    # Convert prediction dictionary to JSON
    prediction_json = json.dumps(prediction)

    # 3. Save product + prediction to database

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
            expected_demand,
            prediction
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
        product.expected_demand,
        prediction_json
    ))

    connection.commit()

    product_id = cursor.lastrowid

    connection.close()

    return {
        "message": "Product added successfully",
        "product_id": product_id,
        "prediction": prediction
    }


# ============================================================
# GET ALL PRODUCTS - PROTECTED
# ============================================================

@app.get("/products")
def get_products(
    limit: int = 20,
    offset: int = 0,
    current_user: dict = Depends(get_current_user)
):

    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute(
        "SELECT * FROM products LIMIT ? OFFSET ?",
        (limit, offset)
    )

    products = cursor.fetchall()

    connection.close()

    result = []

    for product in products:

        product_data = dict(product)

        if product_data["prediction"]:

            product_data["prediction"] = json.loads(
                product_data["prediction"]
            )

        result.append(product_data)

    return result


# ============================================================
# SEARCH PRODUCTS - PROTECTED
# ============================================================

@app.get("/products/search")
def search_products(
    product_name: str | None = None,
    category: str | None = None,
    limit: int = 20,
    offset: int = 0,
    current_user: dict = Depends(get_current_user)
):

    connection = get_connection()
    cursor = connection.cursor()

    query = "SELECT * FROM products WHERE 1=1"
    parameters = []

    if product_name:

        query += " AND product_name LIKE ?"

        parameters.append(
            f"%{product_name}%"
        )

    if category:

        query += " AND category LIKE ?"

        parameters.append(
            f"%{category}%"
        )

    query += " LIMIT ? OFFSET ?"

    parameters.extend([
        limit,
        offset
    ])

    cursor.execute(
        query,
        parameters
    )

    products = cursor.fetchall()

    connection.close()

    result = []

    for product in products:

        product_data = dict(product)

        if product_data["prediction"]:

            product_data["prediction"] = json.loads(
                product_data["prediction"]
            )

        result.append(product_data)

    return result


# ============================================================
# GET PRODUCT BY ID - PROTECTED
# ============================================================

@app.get("/products/{product_id}")
def get_product(
    product_id: int,
    current_user: dict = Depends(get_current_user)
):

    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute(
        "SELECT * FROM products WHERE id = ?",
        (product_id,)
    )

    product = cursor.fetchone()

    connection.close()

    if product is None:

        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )

    product_data = dict(product)

    if product_data["prediction"]:

        product_data["prediction"] = json.loads(
            product_data["prediction"]
        )

    return product_data


# ============================================================
# UPDATE PRODUCT - PROTECTED
# ============================================================

@app.put("/products/{product_id}")
def update_product(
    product_id: int,
    product: Product,
    current_user: dict = Depends(get_current_user)
):

    # Prepare updated product data for ML prediction
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

    # Recalculate prediction using updated values
    prediction = predict_price(product_data)

    # Convert prediction to JSON for SQLite
    prediction_json = json.dumps(prediction)

    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute("""
        UPDATE products
        SET
            product_name = ?,
            category = ?,
            stock_date = ?,
            expiry_date = ?,
            current_stock = ?,
            historical_sales = ?,
            selling_price = ?,
            demand_rate = ?,
            sales_velocity = ?,
            days_left = ?,
            expected_demand = ?,
            prediction = ?
        WHERE id = ?
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
        product.expected_demand,
        prediction_json,
        product_id
    ))

    connection.commit()

    if cursor.rowcount == 0:

        connection.close()

        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )

    connection.close()

    return {
        "message": "Product updated successfully",
        "product_id": product_id,
        "prediction": prediction
    }


# ============================================================
# DELETE PRODUCT - PROTECTED
# ============================================================

# ============================================================
# PURCHASE PRODUCT - PROTECTED
# ============================================================

@app.post("/products/{product_id}/purchase")
def purchase_product(
    product_id: int,
    purchase: PurchaseRequest,
    current_user: dict = Depends(get_current_user)
):

    if purchase.quantity <= 0:

        raise HTTPException(
            status_code=400,
            detail="Quantity must be greater than 0"
        )

    connection = get_connection()
    cursor = connection.cursor()

    # Get product
    cursor.execute("""
        SELECT id, product_name, current_stock, selling_price, prediction
        FROM products
        WHERE id = ?
    """, (product_id,))

    product = cursor.fetchone()

    if product is None:

        connection.close()

        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )

    # Check stock
    if product["current_stock"] < purchase.quantity:

        connection.close()

        raise HTTPException(
            status_code=400,
            detail="Not enough stock available"
        )

    # Determine actual selling price
    price_per_unit = product["selling_price"]

    if product["prediction"]:

        prediction = json.loads(product["prediction"])

        price_per_unit = prediction.get(
            "final_price",
            price_per_unit
        )

    total_amount = price_per_unit * purchase.quantity

    # Reduce stock
    new_stock = product["current_stock"] - purchase.quantity

    cursor.execute("""
        UPDATE products
        SET current_stock = ?
        WHERE id = ?
    """, (
        new_stock,
        product_id
    ))

    # Record purchase
    cursor.execute("""
        INSERT INTO purchases (
            product_id,
            quantity,
            price_per_unit,
            total_amount,
            purchased_at
        )
        VALUES (?, ?, ?, ?, datetime('now'))
    """, (
        product_id,
        purchase.quantity,
        price_per_unit,
        total_amount
    ))

    connection.commit()

    purchase_id = cursor.lastrowid

    connection.close()

    return {
        "message": "Purchase successful",
        "purchase_id": purchase_id,
        "product_id": product_id,
        "product_name": product["product_name"],
        "quantity": purchase.quantity,
        "price_per_unit": float(price_per_unit),
        "total_amount": float(total_amount),
        "remaining_stock": new_stock
    }

@app.delete("/products/{product_id}")
def delete_product(
    product_id: int,
    current_user: dict = Depends(get_current_user)
):

    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute(
        "DELETE FROM products WHERE id = ?",
        (product_id,)
    )

    connection.commit()

    if cursor.rowcount == 0:

        connection.close()

        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )

    connection.close()

    return {
        "message": "Product deleted successfully",
        "product_id": product_id
    }


# ============================================================
# DATABASE HEALTH CHECK - PUBLIC
# ============================================================

@app.get("/database/status")
def database_status():

    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute(
        "SELECT COUNT(*) FROM products"
    )

    product_count = cursor.fetchone()[0]

    connection.close()

    return {
        "database": "SQLite",
        "status": "connected",
        "product_count": product_count
    }