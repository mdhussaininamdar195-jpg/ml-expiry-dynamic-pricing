from fastapi import FastAPI, HTTPException, Depends, Query
from pydantic import BaseModel, Field, field_validator
import json
from datetime import datetime

from fastapi.security import OAuth2PasswordRequestForm

from backend.database import (
    create_table,
    create_users_table,
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

app = FastAPI(
    title="Expiry Dynamic Pricing API",
    description="Backend API for expiry-aware dynamic pricing and ML prediction",
    version="1.0.0"
)

create_table()
create_users_table()


# ============================================================
# PRODUCT INPUT MODEL
# ============================================================

class Product(BaseModel):

    product_id: int | None = None

    product_name: str = Field(
        min_length=1,
        max_length=200
    )

    category: str = Field(
        min_length=1,
        max_length=100
    )

    stock_date: str
    expiry_date: str

    current_stock: int = Field(
        ge=0
    )

    historical_sales: int = Field(
        ge=0
    )

    selling_price: float = Field(
        gt=0
    )

    demand_rate: float = Field(
        ge=0
    )

    sales_velocity: int = Field(
        ge=0
    )

    days_left: int = Field(
        ge=0
    )

    expected_demand: int = Field(
        ge=0
    )

    # --------------------------------------------------------
    # DATE VALIDATION
    # --------------------------------------------------------

    @field_validator("stock_date", "expiry_date")
    @classmethod
    def validate_date_format(cls, value: str) -> str:

        try:
            datetime.strptime(value, "%Y-%m-%d")
        except ValueError:

            raise ValueError(
                "Date must be in YYYY-MM-DD format"
            )

        return value

    # --------------------------------------------------------
    # EXPIRY DATE VALIDATION
    # --------------------------------------------------------

    @field_validator("expiry_date")
    @classmethod
    def validate_expiry_date(
        cls,
        value: str,
        info
    ) -> str:

        stock_date = info.data.get("stock_date")

        if stock_date:

            stock = datetime.strptime(
                stock_date,
                "%Y-%m-%d"
            )

            expiry = datetime.strptime(
                value,
                "%Y-%m-%d"
            )

            if expiry < stock:

                raise ValueError(
                    "expiry_date cannot be earlier than stock_date"
                )

        return value


# ============================================================
# USER REGISTRATION MODEL
# ============================================================

class UserRegister(BaseModel):

    username: str = Field(
        min_length=3,
        max_length=50
    )

    email: str | None = None

    password: str = Field(
        min_length=6,
        max_length=128
    )


# ============================================================
# HELPER - CONVERT PRODUCT TO ML INPUT
# ============================================================

def prepare_product_data(product: Product) -> dict:

    return {

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


# ============================================================
# HELPER - CONVERT DATABASE PRODUCT
# ============================================================

def format_product(product) -> dict:

    product_data = dict(product)

    if product_data.get("prediction"):

        try:

            product_data["prediction"] = json.loads(
                product_data["prediction"]
            )

        except json.JSONDecodeError:

            product_data["prediction"] = None

    return product_data


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

    product_data = prepare_product_data(product)

    result = predict_price(product_data)

    # If product_id was supplied, update its prediction
    if product.product_id is not None:

        connection = get_connection()
        cursor = connection.cursor()

        cursor.execute(
            "SELECT id FROM products WHERE id = ?",
            (product.product_id,)
        )

        existing_product = cursor.fetchone()

        if existing_product is None:

            connection.close()

            raise HTTPException(
                status_code=404,
                detail="Product not found"
            )

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

    product_data = prepare_product_data(product)

    prediction = predict_price(product_data)

    prediction_json = json.dumps(prediction)

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
    limit: int = Query(
        default=20,
        ge=1,
        le=100
    ),
    offset: int = Query(
        default=0,
        ge=0
    ),
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

    return [
        format_product(product)
        for product in products
    ]


# ============================================================
# SEARCH PRODUCTS - PROTECTED
# ============================================================

@app.get("/products/search")
def search_products(
    product_name: str | None = None,
    category: str | None = None,
    limit: int = Query(
        default=20,
        ge=1,
        le=100
    ),
    offset: int = Query(
        default=0,
        ge=0
    ),
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

    return [
        format_product(product)
        for product in products
    ]


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

    return format_product(product)


# ============================================================
# UPDATE PRODUCT + RECALCULATE PREDICTION - PROTECTED
# ============================================================

@app.put("/products/{product_id}")
def update_product(
    product_id: int,
    product: Product,
    current_user: dict = Depends(get_current_user)
):

    connection = get_connection()
    cursor = connection.cursor()

    # Check whether product exists
    cursor.execute(
        "SELECT id FROM products WHERE id = ?",
        (product_id,)
    )

    existing_product = cursor.fetchone()

    if existing_product is None:

        connection.close()

        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )

    # Prepare ML input
    product_data = prepare_product_data(product)

    # Recalculate prediction
    prediction = predict_price(product_data)

    # Update product + prediction
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
        json.dumps(prediction),
        product_id
    ))

    connection.commit()
    connection.close()

    return {
        "message": "Product updated successfully",
        "product_id": product_id,
        "prediction": prediction
    }


# ============================================================
# DELETE PRODUCT - PROTECTED
# ============================================================

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