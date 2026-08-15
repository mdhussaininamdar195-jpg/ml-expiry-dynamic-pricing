import pandas as pd
import joblib


# ============================================================
# 1. LOAD SAVED MODELS
# ============================================================

waste_model = joblib.load(
    "ml/models/waste_risk_xgb.pkl"
)

waste_preprocessor = joblib.load(
    "ml/models/waste_preprocessor.pkl"
)

waste_label_encoder = joblib.load(
    "ml/models/waste_risk_label_encoder.pkl"
)

discount_model = joblib.load(
    "ml/models/discount_model.pkl"
)

discount_preprocessor = joblib.load(
    "ml/models/discount_preprocessor.pkl"
)


# ============================================================
# 2. TEST PRODUCTS
# ============================================================

products = [

    # HIGH-RISK SCENARIO
    {
        "Product_Name": "Yogurt Cup",
        "Category": "Dairy",
        "Stock_Date": "2026-08-10",
        "Expiry_Date": "2026-08-13",
        "Current_Stock": 50,
        "Historical_Sales": 20,
        "Selling_Price": 200.0,
        "Demand_Rate": 5.0,
        "Sales_Velocity": 4,
        "Days_Left": 3,
        "Expected_Demand": 15
    },

    # LOW-RISK SCENARIO
    {
        "Product_Name": "Biscuits Pack",
        "Category": "Snacks",
        "Stock_Date": "2026-08-01",
        "Expiry_Date": "2026-08-25",
        "Current_Stock": 10,
        "Historical_Sales": 90,
        "Selling_Price": 100.0,
        "Demand_Rate": 8.0,
        "Sales_Velocity": 8,
        "Days_Left": 24,
        "Expected_Demand": 80
    },

    # HIGH-DEMAND / LOW-STOCK SCENARIO
    {
        "Product_Name": "Banana",
        "Category": "Fruits",
        "Stock_Date": "2026-08-01",
        "Expiry_Date": "2026-08-03",
        "Current_Stock": 5,
        "Historical_Sales": 100,
        "Selling_Price": 60.0,
        "Demand_Rate": 30.0,
        "Sales_Velocity": 30,
        "Days_Left": 2,
        "Expected_Demand": 60
    }
]


# ============================================================
# 3. PROCESS EACH PRODUCT
# ============================================================

for product in products:

    df = pd.DataFrame([product])

    df["Stock_Date"] = pd.to_datetime(
        df["Stock_Date"]
    )

    df["Expiry_Date"] = pd.to_datetime(
        df["Expiry_Date"]
    )


    # ========================================================
    # MODEL 1 FEATURES
    # ========================================================

    df["Stock_Duration_Days"] = (
        df["Expiry_Date"] -
        df["Stock_Date"]
    ).dt.days

    df["Stock_Demand_Ratio"] = (
        df["Current_Stock"] /
        (df["Expected_Demand"] + 1)
    )


    model1_features = [
        "Current_Stock",
        "Historical_Sales",
        "Selling_Price",
        "Demand_Rate",
        "Sales_Velocity",
        "Days_Left",
        "Expected_Demand",
        "Stock_Duration_Days",
        "Stock_Demand_Ratio",
        "Product_Name",
        "Category"
    ]


    X_model1 = df[model1_features]


    # ========================================================
    # MODEL 1 — WASTE RISK
    # ========================================================

    X_model1_processed = (
        waste_preprocessor.transform(X_model1)
    )

    probabilities = waste_model.predict_proba(
        X_model1_processed
    )

    predicted_class = waste_label_encoder.inverse_transform(
        [waste_model.predict(X_model1_processed)[0]]
    )[0]


    # ========================================================
    # RISK SCORE
    # ========================================================

    class_scores = {
        "Low": 0.0,
        "Medium": 0.5,
        "High": 1.0
    }

    risk_score = 0

    for i, class_name in enumerate(
        waste_label_encoder.classes_
    ):
        risk_score += (
            probabilities[0][i] *
            class_scores[class_name]
        )

    waste_risk_score = risk_score * 100


    # ========================================================
    # MODEL 2 INPUT
    # ========================================================

    df["Waste_Risk_Score"] = waste_risk_score

    model2_features = [
        "Waste_Risk_Score",
        "Current_Stock",
        "Historical_Sales",
        "Selling_Price",
        "Demand_Rate",
        "Sales_Velocity",
        "Days_Left",
        "Expected_Demand",
        "Stock_Duration_Days",
        "Stock_Demand_Ratio",
        "Product_Name",
        "Category"
    ]

    X_model2 = df[model2_features]


    # ========================================================
    # MODEL 2 — DISCOUNT
    # ========================================================

    X_model2_processed = (
        discount_preprocessor.transform(X_model2)
    )

    recommended_discount = (
        discount_model.predict(
            X_model2_processed
        )[0]
    )


    recommended_discount = max(
        0,
        min(70, recommended_discount)
    )


    # ========================================================
    # FINAL PRICE
    # ========================================================

    current_price = product["Selling_Price"]

    final_price = current_price * (
        1 - recommended_discount / 100
    )


    # ========================================================
    # RESULT
    # ========================================================

    print("\n======================================")
    print("       DYNAMIC PRICING RESULT")
    print("======================================")

    print(
        f"Product             : "
        f"{product['Product_Name']}"
    )

    print(
        f"Category            : "
        f"{product['Category']}"
    )

    print(
        f"Current Price       : "
        f"₹{current_price:.2f}"
    )

    print(
        f"Days Left           : "
        f"{product['Days_Left']}"
    )

    print(
        f"Current Stock       : "
        f"{product['Current_Stock']}"
    )

    print(
        f"Expected Demand     : "
        f"{product['Expected_Demand']}"
    )

    print(
        f"Waste Risk Category : "
        f"{predicted_class}"
    )

    print(
        f"Waste Risk Score    : "
        f"{waste_risk_score:.2f}%"
    )

    print(
        f"Recommended Discount: "
        f"{recommended_discount:.2f}%"
    )

    print(
        f"Final Selling Price : "
        f"₹{final_price:.2f}"
    )

    print("======================================")