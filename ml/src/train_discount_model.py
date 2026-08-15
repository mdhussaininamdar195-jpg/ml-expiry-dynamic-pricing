import pandas as pd
import joblib
import os

from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.ensemble import RandomForestRegressor
from xgboost import XGBRegressor


# ============================================================
# 1. LOAD DATA
# ============================================================

X_train = pd.read_csv(
    "ml/datasets/processed/discount_X_train.csv"
)

X_val = pd.read_csv(
    "ml/datasets/processed/discount_X_val.csv"
)

X_test = pd.read_csv(
    "ml/datasets/processed/discount_X_test.csv"
)

y_train = pd.read_csv(
    "ml/datasets/processed/discount_y_train.csv"
).squeeze()

y_val = pd.read_csv(
    "ml/datasets/processed/discount_y_val.csv"
).squeeze()

y_test = pd.read_csv(
    "ml/datasets/processed/discount_y_test.csv"
).squeeze()


# ============================================================
# 2. FEATURES
# ============================================================

numeric_features = [
    "Waste_Risk_Score",
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


# ============================================================
# 3. PREPROCESSING
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


X_train_processed = preprocessor.fit_transform(X_train)

X_val_processed = preprocessor.transform(X_val)

X_test_processed = preprocessor.transform(X_test)


print("Processed training shape:", X_train_processed.shape)
print("Processed validation shape:", X_val_processed.shape)
print("Processed test shape:", X_test_processed.shape)


# ============================================================
# 4. XGBOOST REGRESSOR
# ============================================================

xgb_model = XGBRegressor(
    n_estimators=300,
    max_depth=5,
    learning_rate=0.05,
    subsample=0.8,
    colsample_bytree=0.8,
    objective="reg:squarederror",
    eval_metric="rmse",
    random_state=42,
    n_jobs=-1,
    tree_method="hist"
)


print("\nTraining XGBoost Regressor...")

xgb_model.fit(
    X_train_processed,
    y_train
)

print("XGBoost training completed.")


# ============================================================
# 5. XGBOOST VALIDATION
# ============================================================

xgb_val_pred = xgb_model.predict(X_val_processed)

xgb_val_mae = mean_absolute_error(
    y_val,
    xgb_val_pred
)

xgb_val_rmse = mean_squared_error(
    y_val,
    xgb_val_pred
) ** 0.5

xgb_val_r2 = r2_score(
    y_val,
    xgb_val_pred
)


print("\n========== XGBOOST VALIDATION ==========")

print(f"MAE : {xgb_val_mae:.4f}")
print(f"RMSE: {xgb_val_rmse:.4f}")
print(f"R²  : {xgb_val_r2:.4f}")


# ============================================================
# 6. RANDOM FOREST REGRESSOR
# ============================================================

rf_model = RandomForestRegressor(
    n_estimators=300,
    max_depth=12,
    random_state=42,
    n_jobs=-1
)


print("\nTraining Random Forest Regressor...")

rf_model.fit(
    X_train_processed,
    y_train
)

print("Random Forest training completed.")


# ============================================================
# 7. RANDOM FOREST VALIDATION
# ============================================================

rf_val_pred = rf_model.predict(X_val_processed)

rf_val_mae = mean_absolute_error(
    y_val,
    rf_val_pred
)

rf_val_rmse = mean_squared_error(
    y_val,
    rf_val_pred
) ** 0.5

rf_val_r2 = r2_score(
    y_val,
    rf_val_pred
)


print("\n========== RANDOM FOREST VALIDATION ==========")

print(f"MAE : {rf_val_mae:.4f}")
print(f"RMSE: {rf_val_rmse:.4f}")
print(f"R²  : {rf_val_r2:.4f}")


# ============================================================
# 8. SELECT BETTER MODEL
# ============================================================

if xgb_val_rmse <= rf_val_rmse:
    best_model = xgb_model
    best_name = "XGBoost"
else:
    best_model = rf_model
    best_name = "Random Forest"


print("\n========== MODEL SELECTION ==========")
print("Selected model:", best_name)


# ============================================================
# 9. FINAL TEST EVALUATION
# ============================================================

test_pred = best_model.predict(X_test_processed)

test_mae = mean_absolute_error(
    y_test,
    test_pred
)

test_rmse = mean_squared_error(
    y_test,
    test_pred
) ** 0.5

test_r2 = r2_score(
    y_test,
    test_pred
)


print("\n========== FINAL TEST RESULTS ==========")

print(f"MAE : {test_mae:.4f}")
print(f"RMSE: {test_rmse:.4f}")
print(f"R²  : {test_r2:.4f}")


# ============================================================
# 10. SAVE MODEL
# ============================================================

os.makedirs(
    "ml/models",
    exist_ok=True
)

joblib.dump(
    best_model,
    "ml/models/discount_model.pkl"
)

joblib.dump(
    preprocessor,
    "ml/models/discount_preprocessor.pkl"
)


print("\nModel 2 saved successfully.")

print("ml/models/discount_model.pkl")
print("ml/models/discount_preprocessor.pkl")