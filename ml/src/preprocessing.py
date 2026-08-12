import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import OneHotEncoder
import numpy as np
import joblib
import os

DATA_PATH = "ml/datasets/raw/perishable_goods_management.csv"

df = pd.read_csv(DATA_PATH)

print("Original shape:", df.shape)

df["transaction_date"] = pd.to_datetime(df["transaction_date"])
df["expiration_date"] = pd.to_datetime(df["expiration_date"])

print(df[["transaction_date", "expiration_date"]].dtypes)

columns_to_drop = [
    "record_id",
    "days_until_expiry",
    "units_wasted",
    "waste_pct",
    "waste_cost",
    "profit",
    "profit_margin_pct"
]

df = df.drop(columns=columns_to_drop)

print("Shape after removing unwanted columns:", df.shape)

# Features for Waste Risk Model
waste_features = [
    "product_name",
    "category",
    "store_id",
    "region",
    "shelf_life_days",
    "days_remaining_at_purchase",
    "storage_temp",
    "temp_deviation",
    "initial_quantity",
    "spoilage_sensitivity",
    "day_of_week",
    "is_weekend",
    "month",
    "daily_demand",
    "demand_variability",
    "temp_abuse_events",
    "distribution_hours",
    "handling_score",
    "packaging_score",
    "quality_grade",
    "supplier_score"
]

waste_target = "was_spoiled"


# Features for Discount Prediction Model
discount_features = [
    "product_name",
    "category",
    "store_id",
    "region",
    "shelf_life_days",
    "days_remaining_at_purchase",
    "base_price",
    "cost_price",
    "initial_quantity",
    "day_of_week",
    "is_weekend",
    "month",
    "daily_demand",
    "demand_variability",
    "quality_grade",
    "is_promoted"
]

discount_target = "discount_pct"


print("\nWaste model features:", len(waste_features))
print("Discount model features:", len(discount_features))

print("\nChecking Waste Model Features:")
print(set(waste_features) - set(df.columns))

print("\nChecking Discount Model Features:")
print(set(discount_features) - set(df.columns))

# Create data for Waste Risk Model
X_waste = df[waste_features]
y_waste = df[waste_target]

# Create data for Discount Model
X_discount = df[discount_features]
y_discount = df[discount_target]

print("\nWaste model data:")
print("X:", X_waste.shape)
print("y:", y_waste.shape)

print("\nDiscount model data:")
print("X:", X_discount.shape)
print("y:", y_discount.shape)

print("\nWaste model categorical columns:")
print(X_waste.select_dtypes(include=["object"]).columns.tolist())

print("\nDiscount model categorical columns:")
print(X_discount.select_dtypes(include=["object"]).columns.tolist())

# Categorical columns
categorical_columns = [
    "product_name",
    "category",
    "store_id",
    "region",
    "quality_grade"
]

# Split Waste Risk data
X_waste_train, X_waste_test, y_waste_train, y_waste_test = train_test_split(
    X_waste,
    y_waste,
    test_size=0.2,
    random_state=42,
    stratify=y_waste
)

# Split Discount data
X_discount_train, X_discount_test, y_discount_train, y_discount_test = train_test_split(
    X_discount,
    y_discount,
    test_size=0.2,
    random_state=42
)

print("\nWaste training data:", X_waste_train.shape)
print("Waste testing data:", X_waste_test.shape)

print("\nDiscount training data:", X_discount_train.shape)
print("Discount testing data:", X_discount_test.shape)

encoder = OneHotEncoder(handle_unknown="ignore", sparse_output=False)

X_waste_train_encoded = encoder.fit_transform(
    X_waste_train[categorical_columns]
)

X_waste_test_encoded = encoder.transform(
    X_waste_test[categorical_columns]
)

X_discount_train_encoded = encoder.transform(
    X_discount_train[categorical_columns]
)

X_discount_test_encoded = encoder.transform(
    X_discount_test[categorical_columns]
)

print("\nEncoded Waste training shape:", X_waste_train_encoded.shape)
print("Encoded Waste testing shape:", X_waste_test_encoded.shape)

print("\nEncoded Discount training shape:", X_discount_train_encoded.shape)
print("Encoded Discount testing shape:", X_discount_test_encoded.shape)

# Get numerical columns for each model
waste_numeric_columns = X_waste_train.select_dtypes(
    include=["int64", "float64"]
).columns.tolist()

discount_numeric_columns = X_discount_train.select_dtypes(
    include=["int64", "float64"]
).columns.tolist()

print("\nWaste numerical features:", waste_numeric_columns)
print("\nDiscount numerical features:", discount_numeric_columns)

# Numerical data
X_waste_train_numeric = X_waste_train[waste_numeric_columns].to_numpy()
X_waste_test_numeric = X_waste_test[waste_numeric_columns].to_numpy()

X_discount_train_numeric = X_discount_train[discount_numeric_columns].to_numpy()
X_discount_test_numeric = X_discount_test[discount_numeric_columns].to_numpy()


# Combine numerical + categorical features
X_waste_train_final = np.hstack([
    X_waste_train_numeric,
    X_waste_train_encoded
])

X_waste_test_final = np.hstack([
    X_waste_test_numeric,
    X_waste_test_encoded
])

X_discount_train_final = np.hstack([
    X_discount_train_numeric,
    X_discount_train_encoded
])

X_discount_test_final = np.hstack([
    X_discount_test_numeric,
    X_discount_test_encoded
])


print("\nFinal Waste Model:")
print("Training:", X_waste_train_final.shape)
print("Testing:", X_waste_test_final.shape)

print("\nFinal Discount Model:")
print("Training:", X_discount_train_final.shape)
print("Testing:", X_discount_test_final.shape)


# Create processed-data folder if it doesn't exist
os.makedirs("ml/datasets/processed", exist_ok=True)
os.makedirs("ml/models", exist_ok=True)

# Save the encoder
joblib.dump(encoder, "ml/models/encoder.pkl")

# Save processed datasets
np.save("ml/datasets/processed/X_waste_train.npy", X_waste_train_final)
np.save("ml/datasets/processed/X_waste_test.npy", X_waste_test_final)
np.save("ml/datasets/processed/y_waste_train.npy", y_waste_train.to_numpy())
np.save("ml/datasets/processed/y_waste_test.npy", y_waste_test.to_numpy())

np.save("ml/datasets/processed/X_discount_train.npy", X_discount_train_final)
np.save("ml/datasets/processed/X_discount_test.npy", X_discount_test_final)
np.save("ml/datasets/processed/y_discount_train.npy", y_discount_train.to_numpy())
np.save("ml/datasets/processed/y_discount_test.npy", y_discount_test.to_numpy())

print("\nPreprocessing files saved successfully!")