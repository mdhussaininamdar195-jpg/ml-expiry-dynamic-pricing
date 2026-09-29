from fastapi import FastAPI, HTTPException, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import json
import re
import sqlite3
from io import BytesIO
from datetime import datetime, timedelta

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
    get_current_user,
    get_current_admin
)

from ml.src.predict import predict_price

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.graphics.shapes import Drawing, String
from reportlab.graphics.charts.lineplots import LinePlot


# ============================================================
# CREATE FASTAPI APP
# ============================================================

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    # Allow the Vite development server whether the browser is opened
    # through localhost or 127.0.0.1, including when Vite moves to another
    # local development port.
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
    ],
    allow_origin_regex=r"^https?://(localhost|127\\.0\\.0\\.1)(:\\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

create_table()
create_users_table()
create_purchases_table()


# ============================================================
# PRODUCT FAMILY / BATCH MIGRATION
# ============================================================

def _looks_like_batch_name(product_name: str) -> bool:
    """
    Detect only explicitly batch-formatted names.

    Legacy products such as "Product 1" are NOT automatically considered
    batches. Supported implicit batch forms are:
      - batch 1 chicken
      - batch 2 chicken
      - chicken batch 1
    """
    value = (product_name or "").strip()

    if not value:
        return False

    return bool(
        re.match(r"^batch\s*\d+\s+", value, flags=re.IGNORECASE)
        or re.search(r"\s+batch\s*\d+\s*$", value, flags=re.IGNORECASE)
    )


def _legacy_product_family(product_name: str) -> str:
    """
    Derive a family only from an explicitly batch-formatted name.

    Ordinary legacy/non-batch products remain their own family.
    """
    value = (product_name or "").strip()

    if not value:
        return ""

    if not _looks_like_batch_name(value):
        return value

    cleaned = re.sub(
        r"^batch\s*\d+\s+",
        "",
        value,
        flags=re.IGNORECASE,
    )

    cleaned = re.sub(
        r"\s+batch\s*\d+\s*$",
        "",
        cleaned,
        flags=re.IGNORECASE,
    )

    return cleaned.strip() or value


def _normalize_product_family(
    product_name: str,
    product_family: str | None = None,
) -> str:
    name = (product_name or "").strip()
    family = (product_family or "").strip()

    if not family:
        return _legacy_product_family(name)

    # If the old UI stored the product name as the default family, only
    # derive a family when the name is explicitly batch-formatted.
    if family.casefold() == name.casefold():
        return _legacy_product_family(name)

    return family

def _ensure_product_family_column():
    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute("PRAGMA table_info(products)")
    columns = {
        row["name"] if isinstance(row, dict) else row[1]
        for row in cursor.fetchall()
    }

    if "product_family" not in columns:
        cursor.execute(
            "ALTER TABLE products ADD COLUMN product_family TEXT"
        )

    cursor.execute("""
        SELECT id, product_name, product_family
        FROM products
    """)

    rows = cursor.fetchall()

    for row in rows:
        current_family = (row["product_family"] or "").strip()
        product_name = (row["product_name"] or "").strip()
        normalized_name_family = _legacy_product_family(product_name)

        # Repair empty/implicit families while preserving ordinary legacy
        # products as individual products.
        if (
            not current_family
            or current_family.casefold() == product_name.casefold()
            or re.match(
                r"^batch\s*\d+\s+",
                current_family,
                re.IGNORECASE,
            )
            or re.search(
                r"\s+batch\s*\d+\s*$",
                current_family,
                re.IGNORECASE,
            )
        ):
            current_family = normalized_name_family

        cursor.execute(
            """
            UPDATE products
            SET product_family = ?
            WHERE id = ?
            """,
            (current_family, row["id"]),
        )

    connection.commit()
    connection.close()


_ensure_product_family_column()


def _ensure_product_gallery_column():
    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute("PRAGMA table_info(products)")
    columns = {
        row["name"] if isinstance(row, dict) else row[1]
        for row in cursor.fetchall()
    }

    if "product_images" not in columns:
        cursor.execute(
            "ALTER TABLE products ADD COLUMN product_images TEXT"
        )

    connection.commit()
    connection.close()


_ensure_product_gallery_column()


def _ensure_product_source_column():
    """Track whether a product was added manually by an admin."""
    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute("PRAGMA table_info(products)")
    columns = {
        row["name"] if isinstance(row, dict) else row[1]
        for row in cursor.fetchall()
    }

    if "is_admin_added" not in columns:
        cursor.execute(
            "ALTER TABLE products ADD COLUMN is_admin_added INTEGER NOT NULL DEFAULT 0"
        )

        # The current imported dataset contains 26,000 rows. Existing rows
        # after that point were added through the admin UI.
        cursor.execute(
            "UPDATE products SET is_admin_added = 1 WHERE id > 26000"
        )

    connection.commit()
    connection.close()


_ensure_product_source_column()


# ============================================================
# DERIVED SALES / DEMAND METRICS
# ============================================================

def _derive_sales_metrics(
    stock_date: str | None,
    expiry_date: str | None,
    historical_sales: int,
):
    """
    Derive simple operational sales metrics from actual sales history.

    A brand-new product has no sales history, so all three derived demand
    metrics start at zero. As purchases happen, the values are recalculated
    from actual historical sales rather than asking the retailer to guess.
    """
    historical_sales = max(int(historical_sales or 0), 0)

    stock_text = str(stock_date or "").strip()
    expiry_text = str(expiry_date or "").strip()

    def parse_date(value: str):
        for fmt in (
            "%Y-%m-%d",
            "%Y-%m-%d %H:%M:%S",
            "%Y-%m-%d %H:%M",
            "%d-%m-%Y",
            "%d/%m/%Y",
            "%m/%d/%Y",
            "%Y/%m/%d",
        ):
            try:
                return datetime.strptime(value, fmt)
            except ValueError:
                continue

        try:
            return datetime.fromisoformat(
                value.replace("Z", "+00:00")
            ).replace(tzinfo=None)
        except ValueError:
            return None

    stock_dt = parse_date(stock_text) if stock_text else None
    expiry_dt = parse_date(expiry_text) if expiry_text else None

    if historical_sales <= 0 or stock_dt is None:
        return {
            "demand_rate": 0.0,
            "sales_velocity": 0,
            "expected_demand": 0,
        }

    today = datetime.now().date()
    elapsed_days = max((today - stock_dt.date()).days + 1, 1)

    # Average units sold per day.
    demand_rate = round(historical_sales / elapsed_days, 2)

    # Keep the existing INTEGER database field.
    sales_velocity = max(0, round(demand_rate))

    if expiry_dt is None:
        days_remaining = 0
    else:
        days_remaining = max((expiry_dt.date() - today).days, 0)

    expected_demand = max(
        0,
        round(demand_rate * days_remaining),
    )

    return {
        "demand_rate": demand_rate,
        "sales_velocity": sales_velocity,
        "expected_demand": expected_demand,
    }


# ============================================================
# PRODUCT INPUT MODEL
# ============================================================

class Product(BaseModel):

    product_id: int | None = None

    product_name: str
    category: str
    product_family: str | None = None

    stock_date: str
    expiry_date: str

    current_stock: int
    # These metrics are derived by the system. A new product starts with
    # no historical sales, so they default to zero.
    historical_sales: int = 0

    selling_price: float

    demand_rate: float = 0.0
    sales_velocity: int = 0

    days_left: int = 0
    expected_demand: int = 0

    image_data: str | None = None
    images: list[str] | None = None


# ============================================================
# USER REGISTRATION MODEL
# ============================================================

class UserRegister(BaseModel):

    username: str
    email: str
    password: str


# ============================================================
# PURCHASE INPUT MODEL
# ============================================================

class PurchaseRequest(BaseModel):

    quantity: int


# ============================================================
# PRODUCT / BATCH HELPERS
# ============================================================

def _decode_prediction(product_data: dict) -> dict:
    prediction = product_data.get("prediction")

    if prediction:
        try:
            product_data["prediction"] = json.loads(prediction)
        except (TypeError, json.JSONDecodeError):
            product_data["prediction"] = {}

    return product_data


def _calculate_shelf_life_days(product_data: dict):
    """Return total shelf life in days: Expiry Date - Stock Date.

    This is a customer-facing informational value only. It is deliberately
    different from remaining shelf life and does not expose either date.
    """
    stock_text = str(product_data.get("stock_date") or "").strip()
    expiry_text = str(product_data.get("expiry_date") or "").strip()

    if not stock_text or not expiry_text:
        return None

    def parse_date(value: str):
        for fmt in (
            "%Y-%m-%d",
            "%Y-%m-%d %H:%M:%S",
            "%Y-%m-%d %H:%M",
            "%d-%m-%Y",
            "%d/%m/%Y",
            "%m/%d/%Y",
            "%Y/%m/%d",
        ):
            try:
                return datetime.strptime(value, fmt)
            except ValueError:
                continue

        try:
            return datetime.fromisoformat(
                value.replace("Z", "+00:00")
            ).replace(tzinfo=None)
        except ValueError:
            return None

    stock_date = parse_date(stock_text)
    expiry_date = parse_date(expiry_text)

    if stock_date is None or expiry_date is None:
        return None

    return max(0, (expiry_date.date() - stock_date.date()).days)


def _parse_product_images(product_data: dict) -> list[str]:
    raw_images = product_data.get("product_images")

    if isinstance(raw_images, list):
        return [str(image) for image in raw_images if image]

    if isinstance(raw_images, str) and raw_images.strip():
        try:
            parsed = json.loads(raw_images)
            if isinstance(parsed, list):
                return [str(image) for image in parsed if image]
        except json.JSONDecodeError:
            pass

    image_data = product_data.get("image_data")
    return [image_data] if image_data else []


def _customer_product(product_data: dict) -> dict:
    product_data = _decode_prediction(dict(product_data))
    prediction = product_data.get("prediction") or {}

    return {
        "id": product_data["id"],
        # Customer UI must always show the actual product name.
        # product_family is only used internally for FEFO grouping.
        "product_name": product_data["product_name"],
        "category": product_data["category"],
        "current_stock": int(product_data.get("current_stock") or 0),
        "selling_price": float(product_data.get("selling_price") or 0),
        "final_price": float(
            prediction.get(
                "final_price",
                product_data.get("final_price")
                or product_data.get("selling_price")
                or 0,
            )
        ),
        "recommended_discount": float(
            prediction.get(
                "recommended_discount",
                product_data.get("recommended_discount") or 0,
            )
        ),
        # Customer details show TOTAL shelf life only.
        # Expiry date and remaining shelf life are intentionally not returned.
        "shelf_life_days": _calculate_shelf_life_days(product_data),
        "waste_risk": product_data.get("waste_risk"),
        "image_data": product_data.get("image_data"),
        "images": _parse_product_images(product_data),
        "prediction": prediction,
    }


# ============================================================
# HOME ROUTE
# ============================================================

@app.get("/")
def root():

    return {
        "message": "Expiry Dynamic Pricing Backend is running"
    }


# ============================================================
# USER REGISTRATION
# ============================================================

@app.post("/register")
def register_user(user: UserRegister):

    username = user.username.strip()
    email = user.email.strip().lower()
    password = user.password

    # Basic validation
    if not username:
        raise HTTPException(
            status_code=400,
            detail="Username is required"
        )

    if len(username) < 3:
        raise HTTPException(
            status_code=400,
            detail="Username must be at least 3 characters"
        )

    if not email:
        raise HTTPException(
            status_code=400,
            detail="Email is required"
        )

    if len(password) < 6:
        raise HTTPException(
            status_code=400,
            detail="Password must be at least 6 characters"
        )

    connection = get_connection()

    try:
        cursor = connection.cursor()

        # Username is NOT unique.
        # Only email must be unique.
        cursor.execute(
            """
            SELECT id
            FROM users
            WHERE LOWER(email) = LOWER(?)
            """,
            (email,)
        )

        if cursor.fetchone():
            raise HTTPException(
                status_code=400,
                detail="Email already registered"
            )

        hashed_password = get_password_hash(password)

        cursor.execute(
            """
            INSERT INTO users (
                username,
                email,
                hashed_password,
                is_active,
                role
            )
            VALUES (?, ?, ?, 1, 'customer')
            """,
            (
                username,
                email,
                hashed_password
            )
        )

        connection.commit()

        user_id = cursor.lastrowid

        return {
            "message": "User registered successfully",
            "user_id": user_id,
            "username": username,
            "email": email
        }

    except HTTPException:
        connection.rollback()
        raise

    except sqlite3.IntegrityError as e:
        connection.rollback()

        if "email" in str(e).lower():
            raise HTTPException(
                status_code=400,
                detail="Email already registered"
            )

        raise HTTPException(
            status_code=400,
            detail="Could not create account"
        )

    except Exception as e:
        connection.rollback()

        print("Registration error:", repr(e))

        raise HTTPException(
            status_code=500,
            detail="Registration failed"
        )

    finally:
        connection.close()


# ============================================================
# LOGIN
# ============================================================

@app.post("/token")
def login(
    form_data: OAuth2PasswordRequestForm = Depends()
):

    # The OAuth2 form field is still named "username" for FastAPI
    # compatibility, but the user must enter their EMAIL here.
    login_email = form_data.username.strip().lower()

    connection = get_connection()

    try:
        cursor = connection.cursor()

        cursor.execute(
            """
            SELECT id, username, email, hashed_password, is_active, role
            FROM users
            WHERE LOWER(email) = LOWER(?)
            """,
            (login_email,)
        )

        user = cursor.fetchone()

        # Backward compatibility for an existing admin account that
        # may not have an email yet. This only works when the username
        # is unique. Normal users should log in with their email.
        if user is None:
            cursor.execute(
                """
                SELECT id, username, email, hashed_password, is_active, role
                FROM users
                WHERE username = ?
                """,
                (form_data.username.strip(),)
            )

            matching_users = cursor.fetchall()

            if len(matching_users) == 1:
                user = matching_users[0]

            elif len(matching_users) > 1:
                raise HTTPException(
                    status_code=400,
                    detail="Multiple accounts use this username. Please login using your email."
                )

    finally:
        connection.close()

    if user is None:

        raise HTTPException(
            status_code=401,
            detail="Incorrect email or password"
        )

    if not verify_password(
        form_data.password,
        user["hashed_password"]
    ):

        raise HTTPException(
            status_code=401,
            detail="Incorrect email or password"
        )

    if not user["is_active"]:

        raise HTTPException(
            status_code=400,
            detail="Inactive user"
        )

    # IMPORTANT:
    # JWT stores the unique user ID, NOT the username.
    # This keeps authentication correct even when usernames are duplicated.
    access_token = create_access_token(
        data={
            "sub": str(user["id"])
        }
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user["role"]
    }


# ============================================================
# CURRENT USER
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
# PRODUCT + ML PREDICTION
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

    result = predict_price(product_data)

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
def create_product(
    product: Product,
    current_user: dict = Depends(get_current_admin)
):

    # A newly added product has no historical sales yet. Do not make the
    # retailer invent ML metrics. The values are initialized from the server.
    initial_historical_sales = 0
    initial_metrics = _derive_sales_metrics(
        product.stock_date,
        product.expiry_date,
        initial_historical_sales,
    )

    product_data = {

        "Product_Name": product.product_name,
        "Category": product.category,

        "Stock_Date": product.stock_date,
        "Expiry_Date": product.expiry_date,

        "Current_Stock": product.current_stock,
        "Historical_Sales": initial_historical_sales,

        "Selling_Price": product.selling_price,

        "Demand_Rate": initial_metrics["demand_rate"],
        "Sales_Velocity": initial_metrics["sales_velocity"],

        "Days_Left": product.days_left,
        "Expected_Demand": initial_metrics["expected_demand"]
    }

    prediction = predict_price(product_data)

    prediction_json = json.dumps(prediction)

    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute("""
        INSERT INTO products (
            product_name,
            product_family,
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
            waste_risk,
            recommended_discount,
            final_price,
            image_data,
            product_images,
            is_admin_added
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        product.product_name,
        (
            _normalize_product_family(
                product.product_name,
                product.product_family,
            )
        ),
        product.category,
        product.stock_date,
        product.expiry_date,
        product.current_stock,
        product_data["Historical_Sales"],
        product.selling_price,
        product_data["Demand_Rate"],
        product_data["Sales_Velocity"],
        product.days_left,
        product_data["Expected_Demand"],
        prediction_json,
        prediction.get("waste_risk_category"),
        prediction.get("recommended_discount"),
        prediction.get("final_price"),
        product.image_data,
        json.dumps(
            product.images
            if product.images is not None
            else ([product.image_data] if product.image_data else [])
        ),
        1
    ))

    connection.commit()

    product_id = cursor.lastrowid

    connection.close()

    return {
        "message": "Product added successfully",
        "product_id": product_id,
        "prediction": prediction,
        "historical_sales": product_data["Historical_Sales"],
        "demand_rate": product_data["Demand_Rate"],
        "sales_velocity": product_data["Sales_Velocity"],
        "expected_demand": product_data["Expected_Demand"],
    }


# ============================================================
# GET PRODUCTS
# 20 PRODUCTS PER PAGE
# ALL DATABASE ROWS ARE AVAILABLE THROUGH PAGINATION
# ============================================================

@app.get("/products")
def get_products(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: str | None = None,
    category: str | None = None,
    risk: str | None = None
):

    connection = get_connection()
    cursor = connection.cursor()

    where_clauses = []
    parameters = []

    if search and search.strip():

        where_clauses.append(
            "LOWER(product_name) LIKE LOWER(?)"
        )

        parameters.append(
            f"%{search.strip()}%"
        )

    if category and category.lower() != "all":

        where_clauses.append(
            "LOWER(category) = LOWER(?)"
        )

        parameters.append(
            category.strip()
        )

    if risk and risk.lower() not in {
        "all",
        "all-risk"
    }:

        where_clauses.append(
            "LOWER(waste_risk) = LOWER(?)"
        )

        parameters.append(
            risk.replace("-risk", "").strip()
        )

    where_sql = ""

    if where_clauses:

        where_sql = (
            " WHERE "
            + " AND ".join(where_clauses)
        )

    cursor.execute(
        f"SELECT COUNT(*) FROM products{where_sql}",
        parameters
    )

    total = cursor.fetchone()[0]

    total_pages = max(
        1,
        (total + page_size - 1) // page_size
    )

    page = min(page, total_pages)

    offset = (
        (page - 1)
        * page_size
    )

    cursor.execute(
        f"""
        SELECT *
        FROM products
        {where_sql}
        ORDER BY id DESC
        LIMIT ? OFFSET ?
        """,
        parameters + [
            page_size,
            offset
        ]
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

    return {
        "products": result,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages
    }


# ============================================================
# CUSTOMER PRODUCTS - FEFO VIEW
# ============================================================

@app.get("/products/customer")
def get_customer_products(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: str | None = None,
    category: str | None = None,
):
    """
    Customer catalogue.

    Legacy products:
      - In-stock legacy/non-batch inventory rows are eligible.
      - Multiple inventory rows for the same product name/category are grouped
        into one customer-facing product card.
      - The earliest-expiring valid row is used for that card.
      - Their historical/missing expiry does not make the old catalogue
        disappear.

    New batch products:
      - A product is treated as a batch when it has an explicit
        product_family different from its product_name, or an explicit
        "batch N" name.
      - Only non-expired, in-stock batches are eligible.
      - One earliest-expiring batch is shown per family.

    Pagination happens after the visible-product selection.
    """

    def normalize_category(value):
        return re.sub(
            r"[_\-\s]+",
            " ",
            str(value or ""),
        ).strip().casefold()

    def normalize_family(value):
        return re.sub(
            r"[_\-\s]+",
            " ",
            str(value or ""),
        ).strip().casefold()

    def parse_expiry(value):
        if value is None:
            return None

        text = str(value).strip()

        if not text:
            return None

        formats = (
            "%Y-%m-%d",
            "%Y-%m-%d %H:%M:%S",
            "%Y-%m-%d %H:%M",
            "%d-%m-%Y",
            "%d/%m/%Y",
            "%m/%d/%Y",
            "%Y/%m/%d",
        )

        for fmt in formats:
            try:
                return datetime.strptime(text, fmt)
            except ValueError:
                continue

        try:
            return datetime.fromisoformat(
                text.replace("Z", "+00:00")
            ).replace(tzinfo=None)
        except ValueError:
            return None

    def is_batch_row(product_data):
        product_name = str(
            product_data.get("product_name") or ""
        ).strip()

        stored_family = str(
            product_data.get("product_family") or ""
        ).strip()

        # New batch products have an explicit family different from their
        # displayed product name.
        if stored_family and (
            normalize_family(stored_family)
            != normalize_family(product_name)
        ):
            return True

        # Also support explicit "batch N ..." / "... batch N" names.
        return _looks_like_batch_name(product_name)

    def category_matches(row_category, requested_category):
        row_key = normalize_category(row_category)
        requested_key = normalize_category(requested_category)

        if not requested_key or requested_key == "all":
            return True

        if row_key == requested_key:
            return True

        # Backward compatibility for the older database category "Produce".
        # The old catalogue used one Produce category while the newer UI
        # exposes Fruits and Vegetables separately. We keep Produce visible
        # under both filters rather than hiding those legacy products.
        if row_key == "produce" and requested_key in {
            "fruits",
            "vegetables",
        }:
            return True

        return False

    today = datetime.now().date()
    normalized_search = (search or "").strip().casefold()

    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute("""
        SELECT *
        FROM products
        WHERE COALESCE(current_stock, 0) > 0
        ORDER BY id ASC
    """)

    rows = cursor.fetchall()
    connection.close()

    selected = {}

    for row in rows:
        product_data = dict(row)

        product_name = str(
            product_data.get("product_name") or ""
        ).strip()

        row_category = str(
            product_data.get("category") or ""
        ).strip()

        if normalized_search and (
            normalized_search not in product_name.casefold()
        ):
            continue

        if not category_matches(
            row_category,
            category,
        ):
            continue

        batch_row = is_batch_row(product_data)

        expiry = parse_expiry(
            product_data.get("expiry_date")
        )

        if batch_row:
            # New FEFO batches must still be genuinely sellable.
            if expiry is None or expiry.date() < today:
                continue

            stored_family = str(
                product_data.get("product_family") or ""
            ).strip()

            family = (
                stored_family
                if stored_family
                and normalize_family(stored_family)
                != normalize_family(product_name)
                else _legacy_product_family(product_name)
            )

            family_key = (
                "batch::"
                + normalize_family(family)
                + "::"
                + normalize_category(row_category)
            )

            existing = selected.get(family_key)

            if existing is None:
                selected[family_key] = product_data
                continue

            existing_expiry = parse_expiry(
                existing.get("expiry_date")
            )

            if (
                existing_expiry is None
                or expiry < existing_expiry
                or (
                    expiry == existing_expiry
                    and int(product_data.get("id") or 0)
                    < int(existing.get("id") or 0)
                )
            ):
                selected[family_key] = product_data

        else:
            # Legacy/non-batch products may have many inventory rows for the
            # same real-world product (for example, many Apple rows with
            # different stock, prices, and expiry dates).
            #
            # The customer catalogue should show ONE card per unique
            # product-name/category combination. We keep the earliest-expiring
            # in-stock row so the customer-facing catalogue follows FEFO while
            # preserving that row's actual price, stock and ML prediction.
            product_key = (
                "legacy::"
                + normalize_family(product_name)
                + "::"
                + normalize_category(row_category)
            )

            existing = selected.get(product_key)

            if existing is None:
                selected[product_key] = product_data
                continue

            existing_expiry = parse_expiry(
                existing.get("expiry_date")
            )

            # Prefer the row with the earliest valid expiry.
            # If either expiry is missing, prefer the row that has a valid
            # expiry. If both are missing/equal, use the lower database id.
            replace_existing = False

            if existing_expiry is None and expiry is not None:
                replace_existing = True
            elif existing_expiry is not None and expiry is not None:
                if expiry < existing_expiry:
                    replace_existing = True
                elif (
                    expiry == existing_expiry
                    and int(product_data.get("id") or 0)
                    < int(existing.get("id") or 0)
                ):
                    replace_existing = True
            elif existing_expiry is None and expiry is None:
                if (
                    int(product_data.get("id") or 0)
                    < int(existing.get("id") or 0)
                ):
                    replace_existing = True

            if replace_existing:
                selected[product_key] = product_data

    # Sort the selected database rows BEFORE converting them to the
    # customer-facing response, because is_admin_added is an internal field.
    #
    # Admin-added products come first. Imported products then retain the
    # original database/dataset order (ascending database id).
    # There is intentionally no alphabetical sorting here.
    ordered_products = sorted(
        selected.values(),
        key=lambda product_data: (
            0 if int(product_data.get("is_admin_added") or 0) == 1 else 1,
            int(product_data.get("id") or 0),
        )
    )

    customer_products = [
        _customer_product(product_data)
        for product_data in ordered_products
    ]

    total = len(customer_products)

    total_pages = max(
        1,
        (total + page_size - 1) // page_size,
    )

    safe_page = min(page, total_pages)
    offset = (safe_page - 1) * page_size

    return {
        "products": customer_products[
            offset:offset + page_size
        ],
        "total": total,
        "page": safe_page,
        "page_size": page_size,
        "total_pages": total_pages,
    }


# ============================================================
# SEARCH PRODUCTS
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

    query = """
        SELECT *
        FROM products
        WHERE 1=1
    """

    parameters = []

    if product_name:

        query += """
            AND product_name LIKE ?
        """

        parameters.append(
            f"%{product_name}%"
        )

    if category:

        query += """
            AND category LIKE ?
        """

        parameters.append(
            f"%{category}%"
        )

    query += """
        LIMIT ? OFFSET ?
    """

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
# GET PRODUCT BY ID
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
# UPDATE PRODUCT
# ============================================================

@app.put("/products/{product_id}")
def update_product(
    product_id: int,
    product: Product,
    current_user: dict = Depends(get_current_admin)
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

    prediction = predict_price(
        product_data
    )

    prediction_json = json.dumps(
        prediction
    )

    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute("""
        UPDATE products
        SET
            product_name = ?,
            product_family = COALESCE(?, product_family),
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
            prediction = ?,
            waste_risk = ?,
            recommended_discount = ?,
            final_price = ?,
            image_data = ?,
            product_images = ?
        WHERE id = ?
    """, (
        product.product_name,
        (
            product.product_family.strip()
            if product.product_family and product.product_family.strip()
            else None
        ),
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
        prediction.get(
            "waste_risk_category"
        ),
        prediction.get(
            "recommended_discount"
        ),
        prediction.get(
            "final_price"
        ),
        product.image_data,
        json.dumps(
            product.images
            if product.images is not None
            else ([product.image_data] if product.image_data else [])
        ),
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
# PURCHASE PRODUCT - FEFO
# ============================================================

@app.post("/products/{product_id}/purchase")
def purchase_product(
    product_id: int,
    purchase: PurchaseRequest,
    current_user: dict = Depends(get_current_user),
):

    if purchase.quantity <= 0:

        raise HTTPException(
            status_code=400,
            detail="Quantity must be greater than 0"
        )

    connection = get_connection()
    cursor = connection.cursor()

    try:

        cursor.execute("""
            SELECT
                id,
                product_name,
                product_family,
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
                waste_risk
            FROM products
            WHERE id = ?
        """, (
            product_id,
        ))

        requested_product = cursor.fetchone()

        if requested_product is None:

            raise HTTPException(
                status_code=404,
                detail="Product not found"
            )

        requested_name = str(
            requested_product["product_name"] or ""
        ).strip()

        requested_stored_family = str(
            requested_product["product_family"] or ""
        ).strip()

        requested_is_batch = (
            (
                requested_stored_family
                and requested_stored_family.casefold()
                != requested_name.casefold()
            )
            or _looks_like_batch_name(requested_name)
        )

        if not requested_is_batch:
            # Legacy/non-batch product: purchase exactly the row the customer
            # selected. Never substitute another old product.
            product = requested_product
        else:
            requested_family = _normalize_product_family(
                requested_name,
                requested_stored_family,
            )

            cursor.execute("""
                SELECT
                    id,
                    product_name,
                    product_family,
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
                    waste_risk
                FROM products
                WHERE LOWER(TRIM(category))
                        = LOWER(TRIM(?))
                  AND current_stock > 0
                  AND expiry_date IS NOT NULL
                ORDER BY
                    id ASC
            """, (
                requested_product["category"],
            ))

            eligible_batches = cursor.fetchall()

            product = None

            today = datetime.now().date()

            for candidate in eligible_batches:
                candidate_name = str(
                    candidate["product_name"] or ""
                ).strip()

                candidate_family_value = str(
                    candidate["product_family"] or ""
                ).strip()

                candidate_is_batch = (
                    (
                        candidate_family_value
                        and candidate_family_value.casefold()
                        != candidate_name.casefold()
                    )
                    or _looks_like_batch_name(candidate_name)
                )

                if not candidate_is_batch:
                    continue

                candidate_family = _normalize_product_family(
                    candidate_name,
                    candidate_family_value,
                )

                if candidate_family.casefold() != requested_family.casefold():
                    continue

                expiry_text = str(
                    candidate["expiry_date"] or ""
                ).strip()

                candidate_expiry = None

                for fmt in (
                    "%Y-%m-%d",
                    "%Y-%m-%d %H:%M:%S",
                    "%Y-%m-%d %H:%M",
                    "%d-%m-%Y",
                    "%d/%m/%Y",
                    "%m/%d/%Y",
                    "%Y/%m/%d",
                ):
                    try:
                        candidate_expiry = datetime.strptime(
                            expiry_text,
                            fmt,
                        )
                        break
                    except ValueError:
                        pass

                if candidate_expiry is None:
                    try:
                        candidate_expiry = datetime.fromisoformat(
                            expiry_text.replace("Z", "+00:00")
                        ).replace(tzinfo=None)
                    except ValueError:
                        continue

                if candidate_expiry.date() < today:
                    continue

                if product is None:
                    product = candidate
                    continue

                current_expiry_text = str(
                    product["expiry_date"] or ""
                ).strip()

                current_expiry = None

                for fmt in (
                    "%Y-%m-%d",
                    "%Y-%m-%d %H:%M:%S",
                    "%Y-%m-%d %H:%M",
                    "%d-%m-%Y",
                    "%d/%m/%Y",
                    "%m/%d/%Y",
                    "%Y/%m/%d",
                ):
                    try:
                        current_expiry = datetime.strptime(
                            current_expiry_text,
                            fmt,
                        )
                        break
                    except ValueError:
                        pass

                if current_expiry is None:
                    try:
                        current_expiry = datetime.fromisoformat(
                            current_expiry_text.replace("Z", "+00:00")
                        ).replace(tzinfo=None)
                    except ValueError:
                        current_expiry = None

                if (
                    current_expiry is None
                    or candidate_expiry < current_expiry
                    or (
                        candidate_expiry == current_expiry
                        and int(candidate["id"] or 0)
                        < int(product["id"] or 0)
                    )
                ):
                    product = candidate


        if product is None:

            raise HTTPException(
                status_code=400,
                detail="This product is currently out of stock"
            )

        if product["current_stock"] < purchase.quantity:

            raise HTTPException(
                status_code=400,
                detail="Not enough stock available"
            )

        current_price = float(
            product["selling_price"]
        )

        if product["prediction"]:

            current_prediction = json.loads(
                product["prediction"]
            )

            current_price = float(
                current_prediction.get(
                    "final_price",
                    current_price
                )
            )

        current_price = round(
            current_price,
            2
        )

        total_amount = round(
            current_price
            * purchase.quantity,
            2
        )

        new_stock = (
            product["current_stock"]
            - purchase.quantity
        )

        new_historical_sales = (
            product["historical_sales"]
            + purchase.quantity
        )

        # Recalculate demand metrics from actual purchases. The retailer
        # never has to manually enter these values.
        derived_metrics = _derive_sales_metrics(
            product["stock_date"],
            product["expiry_date"],
            new_historical_sales,
        )

        ml_input = {

            "Product_Name":
                product["product_name"],

            "Category":
                product["category"],

            "Stock_Date":
                product["stock_date"],

            "Expiry_Date":
                product["expiry_date"],

            "Current_Stock":
                new_stock,

            "Historical_Sales":
                new_historical_sales,

            "Selling_Price":
                product["selling_price"],

            "Demand_Rate":
                derived_metrics["demand_rate"],

            "Sales_Velocity":
                derived_metrics["sales_velocity"],

            "Days_Left":
                product["days_left"],

            "Expected_Demand":
                derived_metrics["expected_demand"]
        }

        prediction = predict_price(
            ml_input
        )

        prediction["recommended_discount"] = round(
            float(
                prediction["recommended_discount"]
            ),
            2
        )

        prediction["final_price"] = round(
            float(
                prediction["final_price"]
            ),
            2
        )

        prediction_json = json.dumps(
            prediction
        )

        cursor.execute("""
            UPDATE products
            SET
                current_stock = ?,
                historical_sales = ?,
                demand_rate = ?,
                sales_velocity = ?,
                expected_demand = ?,
                prediction = ?,
                waste_risk = ?,
                recommended_discount = ?,
                final_price = ?
            WHERE id = ?
        """, (
            new_stock,
            new_historical_sales,
            derived_metrics["demand_rate"],
            derived_metrics["sales_velocity"],
            derived_metrics["expected_demand"],
            prediction_json,
            prediction.get(
                "waste_risk_category"
            ),
            prediction.get(
                "recommended_discount"
            ),
            prediction.get(
                "final_price"
            ),
            product["id"]
        ))

        cursor.execute("""
            INSERT INTO purchases (
                product_id,
                user_id,
                quantity,
                price_per_unit,
                total_amount,
                purchased_at,
                days_left_at_purchase,
                waste_risk_at_purchase
            )
            VALUES (
                ?,
                ?,
                ?,
                ?,
                ?,
                datetime('now', 'localtime'),
                ?,
                ?
            )
        """, (
            product["id"],
            current_user["id"],
            purchase.quantity,
            current_price,
            total_amount,
            product["days_left"],
            product["waste_risk"]
        ))

        connection.commit()

        purchase_id = cursor.lastrowid

        return {
            "message": "Purchase successful",
            "purchase_id": purchase_id,
            "product_id": product["id"],
            "product_name": product["product_name"],
            "quantity": purchase.quantity,
            "price_per_unit": current_price,
            "total_amount": total_amount,
            "remaining_stock": new_stock,
            "prediction": prediction
        }

    except HTTPException:

        connection.rollback()
        raise

    except Exception:

        connection.rollback()
        raise

    finally:

        connection.close()


# ============================================================
# CUSTOMER ACCOUNT
# ============================================================

@app.get("/account")
def get_account(current_user: dict = Depends(get_current_user)):
    return {"user": current_user}


@app.get("/account/orders")
def get_account_orders(current_user: dict = Depends(get_current_user)):
    connection = get_connection()
    cursor = connection.cursor()
    cursor.execute("""
        SELECT p.id AS purchase_id, p.product_id, p.quantity,
               p.price_per_unit, p.total_amount, p.purchased_at,
               p.days_left_at_purchase, p.waste_risk_at_purchase,
               pr.product_name, pr.category, pr.image_data
        FROM purchases p
        LEFT JOIN products pr ON pr.id = p.product_id
        WHERE p.user_id = ?
        ORDER BY p.id DESC
    """, (current_user["id"],))
    orders = [dict(row) for row in cursor.fetchall()]
    connection.close()
    return {
        "orders": orders,
        "total_orders": len(orders),
        "total_spent": round(sum(float(o.get("total_amount") or 0) for o in orders), 2),
    }


# ============================================================
# DASHBOARD STATISTICS
# ============================================================

@app.get("/dashboard/stats")
def dashboard_stats(
    current_user: dict = Depends(get_current_admin)
):

    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute("""
        SELECT COALESCE(SUM(quantity), 0)
        FROM purchases
    """)

    total_products_purchased = (
        cursor.fetchone()[0]
    )

    cursor.execute("""
        SELECT COALESCE(SUM(total_amount), 0)
        FROM purchases
    """)

    total_amount_recouped = (
        cursor.fetchone()[0]
    )

    cursor.execute("""
        SELECT COUNT(*)
        FROM purchases
    """)

    total_purchases = (
        cursor.fetchone()[0]
    )

    cursor.execute("""
        SELECT COALESCE(SUM(quantity), 0)
        FROM purchases
        WHERE days_left_at_purchase <= 3
    """)

    products_saved_from_waste = (
        cursor.fetchone()[0]
    )

    cursor.execute("""
        SELECT COALESCE(SUM(total_amount), 0)
        FROM purchases
        WHERE days_left_at_purchase <= 3
    """)

    amount_recouped_from_waste = (
        cursor.fetchone()[0]
    )

    if total_products_purchased > 0:

        sustainability_rate = (
            products_saved_from_waste
            / total_products_purchased
        ) * 100

    else:

        sustainability_rate = 0

    connection.close()

    return {
        "total_purchases":
            total_purchases,

        "total_products_purchased":
            total_products_purchased,

        "products_saved_from_waste":
            products_saved_from_waste,

        "amount_recouped_from_waste":
            round(
                float(
                    amount_recouped_from_waste
                    or 0
                ),
                2
            ),

        "sustainability_rate":
            round(
                sustainability_rate,
                2
            ),

        "total_amount_recouped":
            round(
                total_amount_recouped,
                2
            )
    }


# ============================================================
# DASHBOARD CHART DATA
# ============================================================

@app.get("/dashboard/chart-data")
def dashboard_chart_data(
    current_user: dict = Depends(get_current_admin)
):

    connection = get_connection()
    cursor = connection.cursor()

    end_date = datetime.now().date()

    start_date = (
        end_date
        - timedelta(days=13)
    )

    cursor.execute("""
        SELECT
            DATE(
                purchased_at,
                'localtime'
            ) AS purchase_date,

            COALESCE(
                SUM(total_amount),
                0
            ),

            COALESCE(
                SUM(quantity),
                0
            ),

            COALESCE(
                SUM(
                    CASE
                        WHEN days_left_at_purchase <= 3
                        THEN quantity
                        ELSE 0
                    END
                ),
                0
            )

        FROM purchases

        WHERE DATE(
            purchased_at,
            'localtime'
        )
        BETWEEN ? AND ?

        GROUP BY DATE(
            purchased_at,
            'localtime'
        )

        ORDER BY DATE(
            purchased_at,
            'localtime'
        )
    """, (
        start_date.isoformat(),
        end_date.isoformat()
    ))

    rows = cursor.fetchall()

    connection.close()

    by_date = {

        row[0]: {
            "revenue":
                float(row[1] or 0),

            "units":
                int(row[2] or 0),

            "saved_units":
                int(row[3] or 0),
        }

        for row in rows
    }

    days = []
    revenue = []
    cumulative_revenue = []
    sustainability_rate = []
    saved_units = []

    running_revenue = 0.0

    for offset in range(14):

        current_date = (
            start_date
            + timedelta(days=offset)
        )

        row = by_date.get(
            current_date.isoformat(),
            {
                "revenue": 0.0,
                "units": 0,
                "saved_units": 0,
            }
        )

        running_revenue += (
            row["revenue"]
        )

        rate = (
            row["saved_units"]
            / row["units"]
            * 100
            if row["units"] > 0
            else 0
        )

        days.append(
            current_date.strftime(
                "%d %b"
            )
        )

        revenue.append(
            round(
                row["revenue"],
                2
            )
        )

        cumulative_revenue.append(
            round(
                running_revenue,
                2
            )
        )

        sustainability_rate.append(
            round(
                rate,
                2
            )
        )

        saved_units.append(
            row["saved_units"]
        )

    return {
        "days": days,
        "revenue": revenue,
        "cumulative_revenue":
            cumulative_revenue,
        "sustainability_rate":
            sustainability_rate,
        "saved_units":
            saved_units,
    }


# ============================================================
# DASHBOARD PDF REPORT
# ============================================================

@app.get("/dashboard/report/pdf")
def dashboard_report_pdf(
    current_user: dict = Depends(get_current_admin)
):

    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute(
        "SELECT COUNT(*) FROM purchases"
    )

    total_purchases = (
        cursor.fetchone()[0]
    )

    cursor.execute("""
        SELECT COALESCE(
            SUM(quantity),
            0
        )
        FROM purchases
    """)

    total_products_purchased = (
        cursor.fetchone()[0]
    )

    cursor.execute("""
        SELECT COALESCE(
            SUM(total_amount),
            0
        )
        FROM purchases
    """)

    total_amount_recouped = float(
        cursor.fetchone()[0] or 0
    )

    cursor.execute("""
        SELECT COALESCE(
            SUM(quantity),
            0
        )
        FROM purchases
        WHERE days_left_at_purchase <= 3
    """)

    products_saved_from_waste = (
        cursor.fetchone()[0]
    )

    cursor.execute("""
        SELECT COALESCE(
            SUM(total_amount),
            0
        )
        FROM purchases
        WHERE days_left_at_purchase <= 3
    """)

    amount_recouped_from_waste = float(
        cursor.fetchone()[0] or 0
    )

    end_date = datetime.now().date()

    start_date = (
        end_date
        - timedelta(days=13)
    )

    cursor.execute("""
        SELECT
            DATE(purchased_at, 'localtime'),
            COALESCE(
                SUM(total_amount),
                0
            ),
            COALESCE(
                SUM(quantity),
                0
            ),
            COALESCE(
                SUM(
                    CASE
                        WHEN days_left_at_purchase <= 3
                        THEN quantity
                        ELSE 0
                    END
                ),
                0
            )

        FROM purchases

        WHERE DATE(
            purchased_at,
            'localtime'
        )
        BETWEEN ? AND ?

        GROUP BY DATE(
            purchased_at,
            'localtime'
        )

        ORDER BY DATE(
            purchased_at,
            'localtime'
        )
    """, (
        start_date.isoformat(),
        end_date.isoformat()
    ))

    rows = cursor.fetchall()

    connection.close()

    by_date = {

        row[0]: {
            "revenue":
                float(row[1] or 0),

            "units":
                int(row[2] or 0),

            "saved_units":
                int(row[3] or 0),
        }

        for row in rows
    }

    sustainability_rate = (
        products_saved_from_waste
        / total_products_purchased
        * 100
        if total_products_purchased > 0
        else 0
    )

    report_rows = [[
        "Date",
        "Revenue",
        "Units",
        "Saved",
        "Sustainability"
    ]]

    revenue_points = []
    sustainability_points = []

    cumulative = 0.0

    for offset in range(14):

        current_date = (
            start_date
            + timedelta(days=offset)
        )

        row = by_date.get(
            current_date.isoformat(),
            {
                "revenue": 0.0,
                "units": 0,
                "saved_units": 0,
            }
        )

        cumulative += (
            row["revenue"]
        )

        rate = (
            row["saved_units"]
            / row["units"]
            * 100
            if row["units"]
            else 0
        )

        label = current_date.strftime(
            "%d %b"
        )

        report_rows.append([
            label,
            f"Rs. {row['revenue']:,.2f}",
            str(row["units"]),
            str(row["saved_units"]),
            f"{rate:.2f}%",
        ])

        revenue_points.append(
            (
                offset + 1,
                cumulative
            )
        )

        sustainability_points.append(
            (
                offset + 1,
                rate
            )
        )

    buffer = BytesIO()

    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=14 * mm,
        leftMargin=14 * mm,
        topMargin=14 * mm,
        bottomMargin=14 * mm,
    )

    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        "DashboardTitle",
        parent=styles["Title"],
        fontSize=20,
        spaceAfter=8,
    )

    story = [

        Paragraph(
            "FreshFlow Dashboard Report",
            title_style
        ),

        Paragraph(
            (
                f"Generated on "
                f"{datetime.now().strftime('%d %b %Y, %H:%M')}"
            ),
            styles["Normal"],
        ),

        Spacer(1, 10),
    ]

    summary = [

        [
            "Metric",
            "Value"
        ],

        [
            "Total purchases",
            str(total_purchases)
        ],

        [
            "Total products purchased",
            str(total_products_purchased)
        ],

        [
            "Total purchase amount",
            f"Rs. {total_amount_recouped:,.2f}"
        ],

        [
            "Products saved from waste",
            str(products_saved_from_waste)
        ],

        [
            "Amount recouped from near-expiry products",
            f"Rs. {amount_recouped_from_waste:,.2f}"
        ],

        [
            "Sustainability rate",
            f"{sustainability_rate:.2f}%"
        ],
    ]

    summary_table = Table(
        summary,
        colWidths=[
            95 * mm,
            75 * mm
        ]
    )

    summary_table.setStyle(
        TableStyle([
            (
                "BACKGROUND",
                (0, 0),
                (-1, 0),
                colors.HexColor(
                    "#eaf2ed"
                )
            ),

            (
                "FONTNAME",
                (0, 0),
                (-1, 0),
                "Helvetica-Bold"
            ),

            (
                "GRID",
                (0, 0),
                (-1, -1),
                0.5,
                colors.HexColor(
                    "#cfd8d2"
                )
            ),

            (
                "PADDING",
                (0, 0),
                (-1, -1),
                7
            ),
        ])
    )

    story += [
        summary_table,
        Spacer(1, 14)
    ]

    def make_chart(
        points,
        y_max,
        title
    ):

        drawing = Drawing(
            500,
            220
        )

        drawing.add(
            String(
                250,
                205,
                title,
                textAnchor="middle",
                fontSize=12
            )
        )

        plot = LinePlot()

        plot.x = 45
        plot.y = 25
        plot.width = 430
        plot.height = 160

        plot.data = [points]

        plot.xValueAxis.valueMin = 1
        plot.xValueAxis.valueMax = 14

        plot.yValueAxis.valueMin = 0
        plot.yValueAxis.valueMax = max(
            y_max,
            1
        )

        drawing.add(plot)

        return drawing

    max_revenue = max(
        [
            p[1]
            for p in revenue_points
        ]
        or [1]
    )

    story.append(
        make_chart(
            revenue_points,
            max_revenue,
            "Cumulative Revenue - Last 14 Days"
        )
    )

    story.append(
        Spacer(1, 10)
    )

    story.append(
        make_chart(
            sustainability_points,
            100,
            "Daily Sustainability Rate - Last 14 Days"
        )
    )

    story.append(
        Spacer(1, 10)
    )

    daily_table = Table(
        report_rows,
        repeatRows=1,
        colWidths=[
            30 * mm,
            38 * mm,
            25 * mm,
            25 * mm,
            42 * mm
        ]
    )

    daily_table.setStyle(
        TableStyle([
            (
                "BACKGROUND",
                (0, 0),
                (-1, 0),
                colors.HexColor(
                    "#eaf2ed"
                )
            ),

            (
                "FONTNAME",
                (0, 0),
                (-1, 0),
                "Helvetica-Bold"
            ),

            (
                "GRID",
                (0, 0),
                (-1, -1),
                0.4,
                colors.HexColor(
                    "#cfd8d2"
                )
            ),

            (
                "PADDING",
                (0, 0),
                (-1, -1),
                5
            ),

            (
                "FONTSIZE",
                (0, 0),
                (-1, -1),
                8
            ),
        ])
    )

    story += [

        Paragraph(
            "14-Day Daily Breakdown",
            styles["Heading2"]
        ),

        daily_table,
    ]

    doc.build(story)

    buffer.seek(0)

    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={
            "Content-Disposition":
                "attachment; "
                "filename=freshflow_dashboard_report.pdf"
        },
    )


# ============================================================
# DELETE PRODUCT
# ============================================================

@app.delete("/products/{product_id}")
def delete_product(
    product_id: int,
    current_user: dict = Depends(get_current_admin)
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
        "message":
            "Product deleted successfully",

        "product_id":
            product_id
    }


# ============================================================
# DATABASE HEALTH CHECK
# ============================================================

@app.get("/database/status")
def database_status():

    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute(
        "SELECT COUNT(*) FROM products"
    )

    product_count = (
        cursor.fetchone()[0]
    )

    connection.close()

    return {
        "database": "SQLite",
        "status": "connected",
        "product_count": product_count
    }