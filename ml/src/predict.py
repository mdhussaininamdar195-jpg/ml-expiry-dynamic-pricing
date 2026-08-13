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
# 2. PREDICTION FUNCTION
# ============================================================

def predict_price(product):

    df = pd.DataFrame([product])

    # Convert dates
    df["Stock_Date"] = pd.to_datetime(
        df["Stock_Date"]
    )

    df["Expiry_Date"] = pd.to_datetime(
        df["Expiry_Date"]
    )


    # ========================================================
    # MODEL 1 FEATURE ENGINEERING
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
        waste_preprocessor.transform(
            X_model1
        )
    )

    probabilities = (
        waste_model.predict_proba(
            X_model1_processed
        )
    )

    predicted_class = (
        waste_label_encoder.inverse_transform(
            [waste_model.predict(
                X_model1_processed
            )[0]]
        )[0]
    )


    # ========================================================
    # CONVERT MODEL 1 PROBABILITY
    # INTO WASTE RISK SCORE
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

    df["Waste_Risk_Score"] = (
        waste_risk_score
    )

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
        discount_preprocessor.transform(
            X_model2
        )
    )

    recommended_discount = (
        discount_model.predict(
            X_model2_processed
        )[0]
    )


    # Keep discount between 0% and 70%
    recommended_discount = max(
        0,
        min(70, recommended_discount)
    )


    # ========================================================
    # FINAL PRICE
    # ========================================================

    current_price = product["Selling_Price"]

    final_price = (
        current_price *
        (1 - recommended_discount / 100)
    )


    # ========================================================
    # RETURN RESULT
    # ========================================================

    return {
        "product_name": product["Product_Name"],
        "category": product["Category"],
        "current_price": current_price,
        "waste_risk_category": predicted_class,
        "waste_risk_score": waste_risk_score,
        "recommended_discount": recommended_discount,
        "final_price": final_price
    }


# ============================================================
# 3. TEST ONE PRODUCT
# ============================================================

product = {
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
}


result = predict_price(product)


print("\n======================================")
print("       DYNAMIC PRICING RESULT")
print("======================================")

print(
    f"Product             : "
    f"{result['product_name']}"
)

print(
    f"Category            : "
    f"{result['category']}"
)

print(
    f"Current Price       : "
    f"₹{result['current_price']:.2f}"
)

print(
    f"Waste Risk Category : "
    f"{result['waste_risk_category']}"
)

print(
    f"Waste Risk Score    : "
    f"{result['waste_risk_score']:.2f}%"
)

print(
    f"Recommended Discount: "
    f"{result['recommended_discount']:.2f}%"
)

print(
    f"Final Selling Price : "
    f"₹{result['final_price']:.2f}"
)

print("======================================")