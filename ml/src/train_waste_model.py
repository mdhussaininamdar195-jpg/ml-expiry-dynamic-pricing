import joblib
import os

from xgboost import XGBClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    classification_report,
    confusion_matrix
)


# ============================================================
# 1. LOAD PROCESSED DATA
# ============================================================

X_train = joblib.load(
    "ml/datasets/processed/X_train.pkl"
)

X_val = joblib.load(
    "ml/datasets/processed/X_val.pkl"
)

X_test = joblib.load(
    "ml/datasets/processed/X_test.pkl"
)

y_train = joblib.load(
    "ml/datasets/processed/y_train.pkl"
)

y_val = joblib.load(
    "ml/datasets/processed/y_val.pkl"
)

y_test = joblib.load(
    "ml/datasets/processed/y_test.pkl"
)


# ============================================================
# 2. ENCODE TARGET
# ============================================================

label_encoder = LabelEncoder()

y_train_encoded = label_encoder.fit_transform(y_train)

y_val_encoded = label_encoder.transform(y_val)

y_test_encoded = label_encoder.transform(y_test)

print("Target classes:")
print(label_encoder.classes_)

print("\nEncoded classes:")
for i, label in enumerate(label_encoder.classes_):
    print(i, "=", label)


# ============================================================
# 3. CREATE XGBOOST MODEL
# ============================================================

model = XGBClassifier(
    n_estimators=300,
    max_depth=5,
    learning_rate=0.05,
    subsample=0.8,
    colsample_bytree=0.8,
    objective="multi:softprob",
    num_class=3,
    eval_metric="mlogloss",
    random_state=42,
    n_jobs=-1,
    tree_method="hist"
)


# ============================================================
# 4. TRAIN
# ============================================================

print("\nTraining XGBoost Model...")

model.fit(
    X_train,
    y_train_encoded
)

print("Training completed.")


# ============================================================
# 5. VALIDATION PREDICTION
# ============================================================

y_val_pred = model.predict(X_val)


print("\n========== VALIDATION RESULTS ==========")

print(
    classification_report(
        y_val_encoded,
        y_val_pred,
        target_names=label_encoder.classes_
    )
)


# ============================================================
# 6. TEST PREDICTION
# ============================================================

y_test_pred = model.predict(X_test)

y_test_proba = model.predict_proba(X_test)


# ============================================================
# 7. TEST METRICS
# ============================================================

accuracy = accuracy_score(
    y_test_encoded,
    y_test_pred
)

precision = precision_score(
    y_test_encoded,
    y_test_pred,
    average="weighted"
)

recall = recall_score(
    y_test_encoded,
    y_test_pred,
    average="weighted"
)

f1 = f1_score(
    y_test_encoded,
    y_test_pred,
    average="weighted"
)

roc_auc = roc_auc_score(
    y_test_encoded,
    y_test_proba,
    multi_class="ovr",
    average="weighted"
)


print("\n========== FINAL TEST RESULTS ==========")

print(f"Accuracy : {accuracy:.4f}")
print(f"Precision: {precision:.4f}")
print(f"Recall   : {recall:.4f}")
print(f"F1 Score : {f1:.4f}")
print(f"ROC-AUC  : {roc_auc:.4f}")


# ============================================================
# 8. CONFUSION MATRIX
# ============================================================

print("\n========== CONFUSION MATRIX ==========")

cm = confusion_matrix(
    y_test_encoded,
    y_test_pred
)

print(cm)


# ============================================================
# 9. DETAILED CLASSIFICATION REPORT
# ============================================================

print("\n========== DETAILED CLASSIFICATION REPORT ==========")

print(
    classification_report(
        y_test_encoded,
        y_test_pred,
        target_names=label_encoder.classes_
    )
)


# ============================================================
# 10. SAVE MODEL
# ============================================================

os.makedirs(
    "ml/models",
    exist_ok=True
)

joblib.dump(
    model,
    "ml/models/waste_risk_xgb.pkl"
)

joblib.dump(
    label_encoder,
    "ml/models/waste_risk_label_encoder.pkl"
)


print("\nModel saved successfully.")

print(
    "ml/models/waste_risk_xgb.pkl"
)

print(
    "ml/models/waste_risk_label_encoder.pkl"
)