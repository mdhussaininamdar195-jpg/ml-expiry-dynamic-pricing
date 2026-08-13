import pandas as pd
import joblib
import os

from sklearn.model_selection import train_test_split


# ============================================================
# 1. LOAD DATASET
# ============================================================

df = pd.read_csv(
    "ml/datasets/raw/synthetic_expiry_pricing_dataset.csv"
)

print("Dataset shape:", df.shape)


# ============================================================
# 2. LOAD MODEL 1 ARTIFACTS
# ============================================================

waste_model = joblib.load(
    "ml/models/waste_risk_xgb.pkl"
)

preprocessor = joblib.load(
    "ml/models/waste_preprocessor.pkl"
)

label_encoder = joblib.load(
    "ml/models/waste_risk_label_encoder.pkl"
)


# ============================================================
# 3. DATE CONVERSION
# ============================================================

df["Stock_Date"] = pd.to_datetime(df["Stock_Date"])
df["Expiry_Date"] = pd.to_datetime(df["Expiry_Date"])


# ============================================================
# 4. CREATE SAME FEATURES USED BY MODEL 1
# ============================================================

df["Stock_Duration_Days"] = (
    df["Expiry_Date"] - df["Stock_Date"]
).dt.days

df["Stock_Demand_Ratio"] = (
    df["Current_Stock"] /
    (df["Expected_Demand"] + 1)
)


numeric_features = [
    "Current_Stock",
    "Historical_Sales",
    "Selling_Price",
    "Demand_Rate",
    "Sales_Velocity",
    "Days_Left",
    "Expected_Demand",
    "Stock_Duration_Days",
    "Stock_Demand_Ratio"
]

categorical_features = [
    "Product_Name",
    "Category"
]

model1_features = numeric_features + categorical_features


# ============================================================
# 5. PREPARE DATA FOR MODEL 1
# ============================================================

X_model1 = df[model1_features]

X_processed = preprocessor.transform(X_model1)


# ============================================================
# 6. GET MODEL 1 PROBABILITIES
# ============================================================

probabilities = waste_model.predict_proba(X_processed)

print("\nModel 1 probability shape:")
print(probabilities.shape)


# ============================================================
# 7. CONVERT PROBABILITIES INTO WASTE RISK SCORE
# ============================================================

# LabelEncoder order is checked instead of assuming it
print("\nModel 1 classes:")
print(label_encoder.classes_)

class_scores = {
    "Low": 0.0,
    "Medium": 0.5,
    "High": 1.0
}

risk_score = 0

for i, class_name in enumerate(label_encoder.classes_):
    risk_score += (
        probabilities[:, i] *
        class_scores[class_name]
    )

df["Waste_Risk_Score"] = risk_score * 100


# ============================================================
# 8. CREATE MODEL 2 DATASET
# ============================================================

discount_features = [
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

X_discount = df[discount_features]

y_discount = df["Recommended_Discount"]


# ============================================================
# 9. TRAIN / VALIDATION / TEST SPLIT
# ============================================================

X_train, X_temp, y_train, y_temp = train_test_split(
    X_discount,
    y_discount,
    test_size=0.30,
    random_state=42
)

X_val, X_test, y_val, y_test = train_test_split(
    X_temp,
    y_temp,
    test_size=0.50,
    random_state=42
)


# ============================================================
# 10. SAVE DATA
# ============================================================

os.makedirs(
    "ml/datasets/processed",
    exist_ok=True
)

X_train.to_csv(
    "ml/datasets/processed/discount_X_train.csv",
    index=False
)

X_val.to_csv(
    "ml/datasets/processed/discount_X_val.csv",
    index=False
)

X_test.to_csv(
    "ml/datasets/processed/discount_X_test.csv",
    index=False
)

y_train.to_csv(
    "ml/datasets/processed/discount_y_train.csv",
    index=False
)

y_val.to_csv(
    "ml/datasets/processed/discount_y_val.csv",
    index=False
)

y_test.to_csv(
    "ml/datasets/processed/discount_y_test.csv",
    index=False
)


# ============================================================
# 11. DISPLAY RESULTS
# ============================================================

print("\n========== MODEL 2 DATA ==========")

print("Training:", X_train.shape)
print("Validation:", X_val.shape)
print("Test:", X_test.shape)

print("\n========== WASTE RISK SCORE ==========")

print(
    df["Waste_Risk_Score"].describe().round(2)
)

print("\n========== SAMPLE MODEL 2 DATA ==========")

print(
    X_train.head()
)

print("\n========== DISCOUNT TARGET ==========")

print(
    y_train.describe().round(2)
)

print("\nModel 2 data preparation completed successfully.")