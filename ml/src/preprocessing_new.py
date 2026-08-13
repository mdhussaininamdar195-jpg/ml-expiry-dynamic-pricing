import pandas as pd
import joblib
import os

from sklearn.model_selection import train_test_split
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder


# ============================================================
# 1. LOAD DATASET
# ============================================================

df = pd.read_csv(
    "ml/datasets/raw/synthetic_expiry_pricing_dataset.csv"
)

print("Original dataset shape:", df.shape)


# ============================================================
# 2. DATE CONVERSION
# ============================================================

df["Stock_Date"] = pd.to_datetime(df["Stock_Date"])
df["Expiry_Date"] = pd.to_datetime(df["Expiry_Date"])


# ============================================================
# 3. FEATURE ENGINEERING
# ============================================================

df["Stock_Duration_Days"] = (
    df["Expiry_Date"] - df["Stock_Date"]
).dt.days

df["Stock_Demand_Ratio"] = (
    df["Current_Stock"] /
    (df["Expected_Demand"] + 1)
)


# ============================================================
# 4. FEATURES
# ============================================================

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

features = numeric_features + categorical_features


# ============================================================
# 5. TARGET
# ============================================================

X = df[features]

y = df["Waste_Risk"]


# ============================================================
# 6. TRAIN / VALIDATION / TEST SPLIT
# ============================================================

# First: 70% train, 30% temporary
X_train, X_temp, y_train, y_temp = train_test_split(
    X,
    y,
    test_size=0.30,
    random_state=42,
    stratify=y
)

# Split remaining 30% into 15% validation + 15% test
X_val, X_test, y_val, y_test = train_test_split(
    X_temp,
    y_temp,
    test_size=0.50,
    random_state=42,
    stratify=y_temp
)


print("\n========== SPLIT SIZES ==========")
print("Training:", X_train.shape)
print("Validation:", X_val.shape)
print("Test:", X_test.shape)


# ============================================================
# 7. PREPROCESSING
# ============================================================

preprocessor = ColumnTransformer(
    transformers=[
        (
            "num",
            "passthrough",
            numeric_features
        ),
        (
            "cat",
            OneHotEncoder(
                handle_unknown="ignore",
                sparse_output=True
            ),
            categorical_features
        )
    ]
)


# Fit ONLY on training data
X_train_processed = preprocessor.fit_transform(X_train)

X_val_processed = preprocessor.transform(X_val)

X_test_processed = preprocessor.transform(X_test)


# ============================================================
# 8. SAVE PROCESSED DATA
# ============================================================

os.makedirs("ml/datasets/processed", exist_ok=True)

joblib.dump(
    X_train_processed,
    "ml/datasets/processed/X_train.pkl"
)

joblib.dump(
    X_val_processed,
    "ml/datasets/processed/X_val.pkl"
)

joblib.dump(
    X_test_processed,
    "ml/datasets/processed/X_test.pkl"
)

joblib.dump(
    y_train,
    "ml/datasets/processed/y_train.pkl"
)

joblib.dump(
    y_val,
    "ml/datasets/processed/y_val.pkl"
)

joblib.dump(
    y_test,
    "ml/datasets/processed/y_test.pkl"
)

joblib.dump(
    preprocessor,
    "ml/models/waste_preprocessor.pkl"
)


print("\nPreprocessing completed successfully.")

print("Processed training shape:", X_train_processed.shape)
print("Processed validation shape:", X_val_processed.shape)
print("Processed test shape:", X_test_processed.shape)

print("\nSaved preprocessing artifacts.")