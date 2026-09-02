from fastapi import FastAPI, HTTPException, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import json
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

# Allow the React frontend running on Vite to call this API.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
        SELECT id, username, hashed_password, is_active, role
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
        "token_type": "bearer",
        "role": user["role"]
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
    current_user: dict = Depends(get_current_admin)
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
            prediction,
            waste_risk,
            recommended_discount,
            final_price
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
        prediction.get("waste_risk_category"),
        prediction.get("recommended_discount"),
        prediction.get("final_price")
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
# GET PRODUCTS - PUBLIC, SERVER-SIDE PAGINATION
# ============================================================

@app.get("/products")
def get_products(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: str | None = None,
    category: str | None = None,
    risk: str | None = None
):
    """Return one page of products from the shared database."""

    connection = get_connection()
    cursor = connection.cursor()

    where_clauses = []
    parameters = []

    if search and search.strip():
        where_clauses.append("LOWER(product_name) LIKE LOWER(?)")
        parameters.append(f"%{search.strip()}%")

    if category and category.lower() != "all":
        where_clauses.append("LOWER(category) = LOWER(?)")
        parameters.append(category.strip())

    if risk and risk.lower() not in {"all", "all-risk"}:
        where_clauses.append("LOWER(waste_risk) = LOWER(?)")
        parameters.append(risk.replace("-risk", "").strip())

    where_sql = ""
    if where_clauses:
        where_sql = " WHERE " + " AND ".join(where_clauses)

    cursor.execute(
        f"SELECT COUNT(*) FROM products{where_sql}",
        parameters
    )
    total = cursor.fetchone()[0]

    total_pages = max(1, (total + page_size - 1) // page_size)
    page = min(page, total_pages)
    offset = (page - 1) * page_size

    cursor.execute(
        f"""
        SELECT *
        FROM products
        {where_sql}
        ORDER BY id DESC
        LIMIT ? OFFSET ?
        """,
        parameters + [page_size, offset]
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
    current_user: dict = Depends(get_current_admin)
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
            prediction = ?,
            waste_risk = ?,
            recommended_discount = ?,
            final_price = ?
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
        prediction.get("waste_risk_category"),
        prediction.get("recommended_discount"),
        prediction.get("final_price"),
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
# PURCHASE PRODUCT - PUBLIC CUSTOMER CHECKOUT
# ============================================================

@app.post("/products/{product_id}/purchase")
def purchase_product(
    product_id: int,
    purchase: PurchaseRequest
):

    if purchase.quantity <= 0:
        raise HTTPException(
            status_code=400,
            detail="Quantity must be greater than 0"
        )

    connection = get_connection()
    cursor = connection.cursor()

    try:
        # Read the complete product because the ML model needs all features.
        cursor.execute("""
            SELECT
                id,
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
                waste_risk
            FROM products
            WHERE id = ?
        """, (product_id,))

        product = cursor.fetchone()

        if product is None:
            raise HTTPException(
                status_code=404,
                detail="Product not found"
            )

        if product["current_stock"] < purchase.quantity:
            raise HTTPException(
                status_code=400,
                detail="Not enough stock available"
            )

        # Charge the price currently shown to the customer.
        current_price = float(product["selling_price"])

        if product["prediction"]:
            current_prediction = json.loads(product["prediction"])
            current_price = float(
                current_prediction.get(
                    "final_price",
                    current_price
                )
            )

        current_price = round(current_price, 2)
        total_amount = round(
            current_price * purchase.quantity,
            2
        )

        # Purchase reduces stock.
        new_stock = product["current_stock"] - purchase.quantity

        # Treat the purchase as new sales history for the next prediction.
        new_historical_sales = (
            product["historical_sales"] + purchase.quantity
        )

        # Recalculate the ML price using the new stock level.
        ml_input = {
            "Product_Name": product["product_name"],
            "Category": product["category"],
            "Stock_Date": product["stock_date"],
            "Expiry_Date": product["expiry_date"],
            "Current_Stock": new_stock,
            "Historical_Sales": new_historical_sales,
            "Selling_Price": product["selling_price"],
            "Demand_Rate": product["demand_rate"],
            "Sales_Velocity": product["sales_velocity"],
            "Days_Left": product["days_left"],
            "Expected_Demand": product["expected_demand"]
        }

        prediction = predict_price(ml_input)
        prediction["recommended_discount"] = round(
            float(prediction["recommended_discount"]),
            2
        )
        prediction["final_price"] = round(
            float(prediction["final_price"]),
            2
        )

        prediction_json = json.dumps(prediction)

        # Update inventory and the latest ML prediction together.
        cursor.execute("""
            UPDATE products
            SET
                current_stock = ?,
                historical_sales = ?,
                prediction = ?,
                waste_risk = ?,
                recommended_discount = ?,
                final_price = ?
            WHERE id = ?
        """, (
            new_stock,
            new_historical_sales,
            prediction_json,
            prediction.get("waste_risk_category"),
            prediction.get("recommended_discount"),
            prediction.get("final_price"),
            product_id
        ))

        # Record the completed purchase using the price actually paid.
        cursor.execute("""
            INSERT INTO purchases (
                product_id,
                quantity,
                price_per_unit,
                total_amount,
                purchased_at,
                days_left_at_purchase,
                waste_risk_at_purchase
            )
            VALUES (?, ?, ?, ?, datetime('now', 'localtime'), ?, ?)
        """, (
            product_id,
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
            "product_id": product_id,
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
# DASHBOARD STATISTICS - PROTECTED
# ============================================================

# ============================================================
# DASHBOARD STATISTICS - PROTECTED
# ============================================================

@app.get("/dashboard/stats")
def dashboard_stats(
    current_user: dict = Depends(get_current_admin)
):

    connection = get_connection()
    cursor = connection.cursor()

    # Total number of products purchased
    cursor.execute("""
        SELECT COALESCE(SUM(quantity), 0)
        FROM purchases
    """)

    total_products_purchased = cursor.fetchone()[0]

    # Total amount recouped from purchases
    cursor.execute("""
        SELECT COALESCE(SUM(total_amount), 0)
        FROM purchases
    """)

    total_amount_recouped = cursor.fetchone()[0]

    # Number of purchase transactions
    cursor.execute("""
        SELECT COUNT(*)
        FROM purchases
    """)

    total_purchases = cursor.fetchone()[0]

    # Products purchased while close to expiry.
    # We define close to expiry as 3 days or less remaining.
    cursor.execute("""
        SELECT COALESCE(SUM(quantity), 0)
        FROM purchases
        WHERE days_left_at_purchase <= 3
    """)

    products_saved_from_waste = cursor.fetchone()[0]

    # Revenue recovered from products that were close to expiry.
    # This is intentionally different from total purchase revenue.
    cursor.execute("""
        SELECT COALESCE(SUM(total_amount), 0)
        FROM purchases
        WHERE days_left_at_purchase <= 3
    """)

    amount_recouped_from_waste = cursor.fetchone()[0]

    # Calculate sustainability rate
    if total_products_purchased > 0:

        sustainability_rate = (
            products_saved_from_waste
            / total_products_purchased
        ) * 100

    else:

        sustainability_rate = 0

    connection.close()

    return {
        "total_purchases": total_purchases,
        "total_products_purchased": total_products_purchased,
        "products_saved_from_waste": products_saved_from_waste,
        "amount_recouped_from_waste": round(
            float(amount_recouped_from_waste or 0),
            2
        ),
        "sustainability_rate": round(sustainability_rate, 2),
        "total_amount_recouped": round(
            total_amount_recouped,
            2
        )
    }

# ============================================================
# DASHBOARD CHART DATA - PROTECTED
# ============================================================

@app.get("/dashboard/chart-data")
def dashboard_chart_data(
    current_user: dict = Depends(get_current_admin)
):
    connection = get_connection()
    cursor = connection.cursor()

    # Use the backend machine's local calendar date so a purchase made
    # shortly after midnight is shown under the correct local day.
    # Use the backend machine's local calendar date so a purchase made
    # shortly after midnight is shown under the correct local day.
    end_date = datetime.now().date()
    start_date = end_date - timedelta(days=13)

    cursor.execute("""
        SELECT
            DATE(purchased_at, 'localtime') AS purchase_date,
            COALESCE(SUM(total_amount), 0),
            COALESCE(SUM(quantity), 0),
            COALESCE(SUM(
                CASE
                    WHEN days_left_at_purchase <= 3 THEN quantity
                    ELSE 0
                END
            ), 0)
        FROM purchases
        WHERE DATE(purchased_at, 'localtime') BETWEEN ? AND ?
        GROUP BY DATE(purchased_at, 'localtime')
        ORDER BY DATE(purchased_at, 'localtime')
    """, (start_date.isoformat(), end_date.isoformat()))

    rows = cursor.fetchall()
    connection.close()

    by_date = {
        row[0]: {
            "revenue": float(row[1] or 0),
            "units": int(row[2] or 0),
            "saved_units": int(row[3] or 0),
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
        current_date = start_date + timedelta(days=offset)
        row = by_date.get(current_date.isoformat(), {
            "revenue": 0.0,
            "units": 0,
            "saved_units": 0,
        })

        running_revenue += row["revenue"]
        rate = (
            row["saved_units"] / row["units"] * 100
            if row["units"] > 0 else 0
        )

        days.append(current_date.strftime("%d %b"))
        revenue.append(round(row["revenue"], 2))
        cumulative_revenue.append(round(running_revenue, 2))
        sustainability_rate.append(round(rate, 2))
        saved_units.append(row["saved_units"])

    return {
        "days": days,
        "revenue": revenue,
        "cumulative_revenue": cumulative_revenue,
        "sustainability_rate": sustainability_rate,
        "saved_units": saved_units,
    }


# ============================================================
# DASHBOARD PDF REPORT - PROTECTED
# ============================================================

@app.get("/dashboard/report/pdf")
def dashboard_report_pdf(
    current_user: dict = Depends(get_current_admin)
):
    connection = get_connection()
    cursor = connection.cursor()

    cursor.execute("SELECT COUNT(*) FROM purchases")
    total_purchases = cursor.fetchone()[0]

    cursor.execute("SELECT COALESCE(SUM(quantity), 0) FROM purchases")
    total_products_purchased = cursor.fetchone()[0]

    cursor.execute("SELECT COALESCE(SUM(total_amount), 0) FROM purchases")
    total_amount_recouped = float(cursor.fetchone()[0] or 0)

    cursor.execute("""
        SELECT COALESCE(SUM(quantity), 0)
        FROM purchases
        WHERE days_left_at_purchase <= 3
    """)
    products_saved_from_waste = cursor.fetchone()[0]

    cursor.execute("""
        SELECT COALESCE(SUM(total_amount), 0)
        FROM purchases
        WHERE days_left_at_purchase <= 3
    """)
    amount_recouped_from_waste = float(cursor.fetchone()[0] or 0)

    end_date = datetime.now().date()
    start_date = end_date - timedelta(days=13)

    cursor.execute("""
        SELECT
            DATE(purchased_at, 'localtime'),
            COALESCE(SUM(total_amount), 0),
            COALESCE(SUM(quantity), 0),
            COALESCE(SUM(
                CASE
                    WHEN days_left_at_purchase <= 3 THEN quantity
                    ELSE 0
                END
            ), 0)
        FROM purchases
        WHERE DATE(purchased_at, 'localtime') BETWEEN ? AND ?
        GROUP BY DATE(purchased_at, 'localtime')
        ORDER BY DATE(purchased_at, 'localtime')
    """, (start_date.isoformat(), end_date.isoformat()))

    rows = cursor.fetchall()
    connection.close()

    by_date = {
        row[0]: {
            "revenue": float(row[1] or 0),
            "units": int(row[2] or 0),
            "saved_units": int(row[3] or 0),
        }
        for row in rows
    }

    sustainability_rate = (
        products_saved_from_waste / total_products_purchased * 100
        if total_products_purchased > 0 else 0
    )

    report_rows = [["Date", "Revenue", "Units", "Saved", "Sustainability"]]
    revenue_points = []
    sustainability_points = []
    cumulative = 0.0

    for offset in range(14):
        current_date = start_date + timedelta(days=offset)
        row = by_date.get(current_date.isoformat(), {
            "revenue": 0.0,
            "units": 0,
            "saved_units": 0,
        })
        cumulative += row["revenue"]
        rate = row["saved_units"] / row["units"] * 100 if row["units"] else 0
        label = current_date.strftime("%d %b")

        report_rows.append([
            label,
            f"Rs. {row['revenue']:,.2f}",
            str(row["units"]),
            str(row["saved_units"]),
            f"{rate:.2f}%",
        ])
        revenue_points.append((offset + 1, cumulative))
        sustainability_points.append((offset + 1, rate))

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
        Paragraph("FreshFlow Dashboard Report", title_style),
        Paragraph(
            f"Generated on {datetime.now().strftime('%d %b %Y, %H:%M')}",
            styles["Normal"],
        ),
        Spacer(1, 10),
    ]

    summary = [
        ["Metric", "Value"],
        ["Total purchases", str(total_purchases)],
        ["Total products purchased", str(total_products_purchased)],
        ["Total purchase amount", f"Rs. {total_amount_recouped:,.2f}"],
        ["Products saved from waste", str(products_saved_from_waste)],
        ["Amount recouped from near-expiry products", f"Rs. {amount_recouped_from_waste:,.2f}"],
        ["Sustainability rate", f"{sustainability_rate:.2f}%"],
    ]

    summary_table = Table(summary, colWidths=[95 * mm, 75 * mm])
    summary_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#eaf2ed")),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#cfd8d2")),
        ("PADDING", (0, 0), (-1, -1), 7),
    ]))
    story += [summary_table, Spacer(1, 14)]

    def make_chart(points, y_max, title):
        drawing = Drawing(500, 220)
        drawing.add(String(250, 205, title, textAnchor="middle", fontSize=12))
        plot = LinePlot()
        plot.x = 45
        plot.y = 25
        plot.width = 430
        plot.height = 160
        plot.data = [points]
        plot.xValueAxis.valueMin = 1
        plot.xValueAxis.valueMax = 14
        plot.yValueAxis.valueMin = 0
        plot.yValueAxis.valueMax = max(y_max, 1)
        drawing.add(plot)
        return drawing

    max_revenue = max([p[1] for p in revenue_points] or [1])
    story.append(make_chart(revenue_points, max_revenue, "Cumulative Revenue - Last 14 Days"))
    story.append(Spacer(1, 10))
    story.append(make_chart(sustainability_points, 100, "Daily Sustainability Rate - Last 14 Days"))
    story.append(Spacer(1, 10))

    daily_table = Table(report_rows, repeatRows=1, colWidths=[30*mm, 38*mm, 25*mm, 25*mm, 42*mm])
    daily_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#eaf2ed")),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#cfd8d2")),
        ("PADDING", (0, 0), (-1, -1), 5),
        ("FONTSIZE", (0, 0), (-1, -1), 8),
    ]))
    story += [
        Paragraph("14-Day Daily Breakdown", styles["Heading2"]),
        daily_table,
    ]

    doc.build(story)
    buffer.seek(0)

    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={
            "Content-Disposition": "attachment; filename=freshflow_dashboard_report.pdf"
        },
    )


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