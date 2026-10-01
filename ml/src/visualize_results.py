import os
import json
import joblib
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns

from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    confusion_matrix,
    classification_report,
    roc_curve,
    auc,
    precision_recall_curve,
    average_precision_score,
    mean_absolute_error,
    mean_squared_error,
    r2_score
)

from sklearn.preprocessing import label_binarize


# ============================================================
# 1. PATHS
# ============================================================

BASE_DIR = "ml"

DATASET_PATH = os.path.join(
    BASE_DIR,
    "datasets",
    "raw",
    "synthetic_expiry_pricing_dataset.csv"
)

RESULTS_DIR = os.path.join(
    BASE_DIR,
    "results"
)

DATASET_RESULTS = os.path.join(
    RESULTS_DIR,
    "dataset"
)

MODEL1_RESULTS = os.path.join(
    RESULTS_DIR,
    "model1_waste_risk"
)

MODEL2_RESULTS = os.path.join(
    RESULTS_DIR,
    "model2_discount"
)

for folder in [
    RESULTS_DIR,
    DATASET_RESULTS,
    MODEL1_RESULTS,
    MODEL2_RESULTS
]:
    os.makedirs(folder, exist_ok=True)


# ============================================================
# 2. GLOBAL PLOT SETTINGS
# ============================================================

plt.rcParams["figure.dpi"] = 120
plt.rcParams["savefig.dpi"] = 300
plt.rcParams["font.size"] = 11
plt.rcParams["axes.titlesize"] = 16
plt.rcParams["axes.labelsize"] = 12


# ============================================================
# 3. HELPER FUNCTION
# ============================================================

def save_plot(filename):
    plt.tight_layout()

    plt.savefig(
        filename,
        dpi=300,
        bbox_inches="tight"
    )

    plt.close()

    print("Saved:", filename)


# ============================================================
# 4. LOAD DATASET
# ============================================================

print("\n========================================")
print("LOADING DATASET")
print("========================================")

df = pd.read_csv(DATASET_PATH)

print("Dataset shape:", df.shape)

print("Columns:")
print(df.columns.tolist())


# ============================================================
# 5. DATASET VISUALIZATIONS
# ============================================================

print("\n========================================")
print("DATASET VISUALIZATIONS")
print("========================================")


# ------------------------------------------------------------
# 5.1 WASTE RISK DISTRIBUTION
# ------------------------------------------------------------

plt.figure(figsize=(8, 5))

risk_order = [
    "Low",
    "Medium",
    "High"
]

sns.countplot(
    data=df,
    x="Waste_Risk",
    order=risk_order
)

plt.title(
    "Distribution of Waste Risk Classes"
)

plt.xlabel(
    "Waste Risk Class"
)

plt.ylabel(
    "Number of Products"
)

save_plot(
    os.path.join(
        DATASET_RESULTS,
        "waste_risk_distribution.png"
    )
)


# ------------------------------------------------------------
# 5.2 DAYS REMAINING DISTRIBUTION
# ------------------------------------------------------------

plt.figure(figsize=(9, 5))

sns.histplot(
    df["Days_Left"],
    bins=40,
    kde=True
)

plt.title(
    "Distribution of Days Remaining Until Expiry"
)

plt.xlabel(
    "Days Remaining"
)

plt.ylabel(
    "Number of Products"
)

save_plot(
    os.path.join(
        DATASET_RESULTS,
        "days_remaining_distribution.png"
    )
)


# ------------------------------------------------------------
# 5.3 CORRELATION HEATMAP
# ------------------------------------------------------------

numeric_columns = df.select_dtypes(
    include=np.number
).columns

correlation = df[numeric_columns].corr()

plt.figure(
    figsize=(12, 9)
)

sns.heatmap(
    correlation,
    cmap="coolwarm",
    center=0,
    annot=False
)

plt.title(
    "Feature Correlation Heatmap"
)

save_plot(
    os.path.join(
        DATASET_RESULTS,
        "correlation_heatmap.png"
    )
)


# ------------------------------------------------------------
# 5.4 DAYS LEFT VS WASTE RISK
# ------------------------------------------------------------

plt.figure(
    figsize=(9, 5)
)

sns.boxplot(
    data=df,
    x="Waste_Risk",
    y="Days_Left",
    order=risk_order
)

plt.title(
    "Days Remaining Across Waste Risk Classes"
)

plt.xlabel(
    "Waste Risk Class"
)

plt.ylabel(
    "Days Remaining"
)

save_plot(
    os.path.join(
        DATASET_RESULTS,
        "risk_vs_days_remaining.png"
    )
)


# ============================================================
# 6. MODEL 1 — WASTE RISK CLASSIFICATION
# ============================================================

print("\n========================================")
print("MODEL 1 — WASTE RISK")
print("========================================")


# ------------------------------------------------------------
# 6.1 LOAD MODEL
# ------------------------------------------------------------

waste_model = joblib.load(
    os.path.join(
        BASE_DIR,
        "models",
        "waste_risk_xgb.pkl"
    )
)

waste_label_encoder = joblib.load(
    os.path.join(
        BASE_DIR,
        "models",
        "waste_risk_label_encoder.pkl"
    )
)

waste_preprocessor = joblib.load(
    os.path.join(
        BASE_DIR,
        "models",
        "waste_preprocessor.pkl"
    )
)


# ------------------------------------------------------------
# 6.2 LOAD TEST DATA
# ------------------------------------------------------------

X_test = joblib.load(
    os.path.join(
        BASE_DIR,
        "datasets",
        "processed",
        "X_test.pkl"
    )
)

y_test = joblib.load(
    os.path.join(
        BASE_DIR,
        "datasets",
        "processed",
        "y_test.pkl"
    )
)

y_test_encoded = waste_label_encoder.transform(
    y_test
)


# ------------------------------------------------------------
# 6.3 PREDICTIONS
# ------------------------------------------------------------

y_pred = waste_model.predict(
    X_test
)

y_proba = waste_model.predict_proba(
    X_test
)


# ------------------------------------------------------------
# 6.4 CLASSIFICATION METRICS
# ------------------------------------------------------------

accuracy = accuracy_score(
    y_test_encoded,
    y_pred
)

precision = precision_score(
    y_test_encoded,
    y_pred,
    average="weighted"
)

recall = recall_score(
    y_test_encoded,
    y_pred,
    average="weighted"
)

f1 = f1_score(
    y_test_encoded,
    y_pred,
    average="weighted"
)

roc_auc = roc_auc_score(
    y_test_encoded,
    y_proba,
    multi_class="ovr",
    average="weighted"
)


print("\nModel 1 Test Results")

print(
    f"Accuracy : {accuracy:.4f}"
)

print(
    f"Precision: {precision:.4f}"
)

print(
    f"Recall   : {recall:.4f}"
)

print(
    f"F1 Score : {f1:.4f}"
)

print(
    f"ROC-AUC  : {roc_auc:.4f}"
)


# ------------------------------------------------------------
# 6.5 SAVE MODEL 1 METRICS
# ------------------------------------------------------------

model1_metrics = {
    "accuracy": float(accuracy),
    "precision_weighted": float(precision),
    "recall_weighted": float(recall),
    "f1_weighted": float(f1),
    "roc_auc_weighted_ovr": float(roc_auc)
}

with open(
    os.path.join(
        MODEL1_RESULTS,
        "model1_metrics.json"
    ),
    "w"
) as f:

    json.dump(
        model1_metrics,
        f,
        indent=4
    )


# ============================================================
# 7. MODEL 1 — CONFUSION MATRIX
# ============================================================

print("\nGenerating confusion matrix...")


# Original class order from LabelEncoder
original_class_names = list(
    waste_label_encoder.classes_
)


# Desired report order
desired_class_order = [
    "Low",
    "Medium",
    "High"
]


# Find indices needed to reorder matrix
reorder_indices = [
    original_class_names.index(
        class_name
    )
    for class_name in desired_class_order
]


cm_original = confusion_matrix(
    y_test_encoded,
    y_pred
)


# Reorder rows and columns
cm = cm_original[
    np.ix_(
        reorder_indices,
        reorder_indices
    )
]


plt.figure(
    figsize=(8, 7)
)

sns.heatmap(
    cm,
    annot=True,
    fmt="d",
    cmap="Blues",
    xticklabels=desired_class_order,
    yticklabels=desired_class_order,
    annot_kws={
        "fontsize": 14
    }
)

plt.title(
    "Confusion Matrix — XGBoost Waste Risk Classifier",
    pad=15
)

plt.xlabel(
    "Predicted Class"
)

plt.ylabel(
    "Actual Class"
)

save_plot(
    os.path.join(
        MODEL1_RESULTS,
        "confusion_matrix.png"
    )
)


# ============================================================
# 8. MODEL 1 — CLASSIFICATION METRICS
# ============================================================

print(
    "\nGenerating classification metrics..."
)


metric_names = [
    "Accuracy",
    "Precision",
    "Recall",
    "F1 Score",
    "ROC-AUC"
]

metric_values = [
    accuracy,
    precision,
    recall,
    f1,
    roc_auc
]


# Convert to percentage
metric_percentages = [
    value * 100
    for value in metric_values
]


plt.figure(
    figsize=(10, 6)
)

bars = plt.bar(
    metric_names,
    metric_percentages
)

plt.ylim(
    0,
    105
)

plt.title(
    "XGBoost Waste Risk Classification Performance"
)

plt.ylabel(
    "Score (%)"
)

plt.xlabel(
    "Evaluation Metric"
)


for bar, value in zip(
    bars,
    metric_percentages
):

    plt.text(
        bar.get_x()
        + bar.get_width() / 2,
        value + 1.2,
        f"{value:.2f}%",
        ha="center",
        va="bottom",
        fontsize=11,
        fontweight="bold"
    )


save_plot(
    os.path.join(
        MODEL1_RESULTS,
        "classification_metrics.png"
    )
)


# ============================================================
# 9. MODEL 1 — ROC CURVE
# ============================================================

print(
    "\nGenerating ROC curve..."
)


y_test_binary = label_binarize(
    y_test_encoded,
    classes=np.arange(
        len(original_class_names)
    )
)


plt.figure(
    figsize=(9, 7)
)


for i, class_name in enumerate(
    original_class_names
):

    fpr, tpr, _ = roc_curve(
        y_test_binary[:, i],
        y_proba[:, i]
    )

    roc_auc_class = auc(
        fpr,
        tpr
    )

    plt.plot(
        fpr,
        tpr,
        linewidth=2,
        label=(
            f"{class_name} "
            f"(AUC = {roc_auc_class:.3f})"
        )
    )


plt.plot(
    [0, 1],
    [0, 1],
    linestyle="--"
)


plt.title(
    "Multiclass ROC Curve — XGBoost Waste Risk Classifier"
)

plt.xlabel(
    "False Positive Rate"
)

plt.ylabel(
    "True Positive Rate"
)

plt.legend(
    loc="lower right"
)

save_plot(
    os.path.join(
        MODEL1_RESULTS,
        "roc_curve.png"
    )
)


# ============================================================
# 10. MODEL 1 — PRECISION-RECALL CURVE
# ============================================================

print(
    "\nGenerating Precision-Recall curve..."
)


plt.figure(
    figsize=(9, 7)
)


for i, class_name in enumerate(
    original_class_names
):

    precision_curve, recall_curve, _ = (
        precision_recall_curve(
            y_test_binary[:, i],
            y_proba[:, i]
        )
    )

    ap = average_precision_score(
        y_test_binary[:, i],
        y_proba[:, i]
    )

    plt.plot(
        recall_curve,
        precision_curve,
        linewidth=2,
        label=(
            f"{class_name} "
            f"(AP = {ap:.3f})"
        )
    )


plt.title(
    "Multiclass Precision-Recall Curve"
)

plt.xlabel(
    "Recall"
)

plt.ylabel(
    "Precision"
)

plt.legend(
    loc="lower left"
)

save_plot(
    os.path.join(
        MODEL1_RESULTS,
        "precision_recall_curve.png"
    )
)


# ============================================================
# 11. MODEL 1 — FEATURE IMPORTANCE
# ============================================================

print(
    "\nGenerating feature importance..."
)


try:

    feature_names = (
        waste_preprocessor
        .get_feature_names_out()
    )

    importance = (
        waste_model
        .feature_importances_
    )


    importance_df = pd.DataFrame({
        "Feature": feature_names,
        "Importance": importance
    })


    # --------------------------------------------------------
    # Clean preprocessing prefixes
    # --------------------------------------------------------

    def clean_feature_name(name):

        name = name.replace(
            "num__",
            ""
        )

        name = name.replace(
            "cat__",
            ""
        )


        if name.startswith(
            "Category_"
        ):

            category = name.replace(
                "Category_",
                ""
            )

            return (
                "Category: "
                + category.replace(
                    "_",
                    " "
                )
            )


        if name.startswith(
            "Product_Name_"
        ):

            product = name.replace(
                "Product_Name_",
                ""
            )

            return (
                "Product: "
                + product.replace(
                    "_",
                    " "
                )
            )


        name = name.replace(
            "_",
            " "
        )

        return name


    importance_df[
        "Feature"
    ] = importance_df[
        "Feature"
    ].apply(
        clean_feature_name
    )


    # Sort and keep top 15
    importance_df = (
        importance_df
        .sort_values(
            "Importance",
            ascending=False
        )
        .head(15)
        .sort_values(
            "Importance",
            ascending=True
        )
    )


    plt.figure(
        figsize=(10, 8)
    )


    bars = plt.barh(
        importance_df["Feature"],
        importance_df["Importance"]
    )


    plt.title(
        "Top 15 Feature Importances — XGBoost Waste Risk Model"
    )

    plt.xlabel(
        "Feature Importance"
    )

    plt.ylabel(
        "Feature"
    )


    for bar, value in zip(
        bars,
        importance_df["Importance"]
    ):

        plt.text(
            value + 0.002,
            bar.get_y()
            + bar.get_height() / 2,
            f"{value:.3f}",
            va="center",
            fontsize=9
        )


    save_plot(
        os.path.join(
            MODEL1_RESULTS,
            "feature_importance.png"
        )
    )


    # Also save the values as CSV
    importance_df.sort_values(
        "Importance",
        ascending=False
    ).to_csv(
        os.path.join(
            MODEL1_RESULTS,
            "feature_importance.csv"
        ),
        index=False
    )


except Exception as e:

    print(
        "\nCould not generate feature importance:"
    )

    print(e)


# ============================================================
# 12. MODEL 1 — CLASSIFICATION REPORT
# ============================================================

report = classification_report(
    y_test_encoded,
    y_pred,
    target_names=original_class_names,
    output_dict=True
)


report_df = pd.DataFrame(
    report
).transpose()


report_df.to_csv(
    os.path.join(
        MODEL1_RESULTS,
        "classification_report.csv"
    )
)


print(
    "\nClassification report saved."
)


# ============================================================
# 13. MODEL 2 — DYNAMIC DISCOUNT
# ============================================================

print("\n========================================")
print("MODEL 2 — DYNAMIC DISCOUNT")
print("========================================")


discount_model = joblib.load(
    os.path.join(
        BASE_DIR,
        "models",
        "discount_model.pkl"
    )
)

discount_preprocessor = joblib.load(
    os.path.join(
        BASE_DIR,
        "models",
        "discount_preprocessor.pkl"
    )
)


# ------------------------------------------------------------
# 13.1 LOAD TEST DATA
# ------------------------------------------------------------

discount_X_test = pd.read_csv(
    os.path.join(
        BASE_DIR,
        "datasets",
        "processed",
        "discount_X_test.csv"
    )
)

discount_y_test = pd.read_csv(
    os.path.join(
        BASE_DIR,
        "datasets",
        "processed",
        "discount_y_test.csv"
    )
).squeeze()


# ------------------------------------------------------------
# 13.2 PREPROCESS
# ------------------------------------------------------------

discount_X_test_processed = (
    discount_preprocessor.transform(
        discount_X_test
    )
)


# ------------------------------------------------------------
# 13.3 PREDICT
# ------------------------------------------------------------

discount_pred = discount_model.predict(
    discount_X_test_processed
)


# ------------------------------------------------------------
# 13.4 METRICS
# ------------------------------------------------------------

mae = mean_absolute_error(
    discount_y_test,
    discount_pred
)

rmse = mean_squared_error(
    discount_y_test,
    discount_pred
) ** 0.5

r2 = r2_score(
    discount_y_test,
    discount_pred
)


print(
    "\nModel 2 Test Results"
)

print(
    f"MAE : {mae:.4f}"
)

print(
    f"RMSE: {rmse:.4f}"
)

print(
    f"R²  : {r2:.4f}"
)


# ------------------------------------------------------------
# 13.5 SAVE METRICS
# ------------------------------------------------------------

model2_metrics = {
    "MAE": float(mae),
    "RMSE": float(rmse),
    "R2": float(r2)
}


with open(
    os.path.join(
        MODEL2_RESULTS,
        "model2_metrics.json"
    ),
    "w"
) as f:

    json.dump(
        model2_metrics,
        f,
        indent=4
    )


# ============================================================
# 14. MODEL 2 — REGRESSION METRICS TABLE IMAGE
# ============================================================

print(
    "\nGenerating regression metrics table..."
)


fig, ax = plt.subplots(
    figsize=(8, 4.5)
)

ax.axis("off")


table_data = [
    ["MAE", f"{mae:.4f} percentage points"],
    ["RMSE", f"{rmse:.4f} percentage points"],
    ["R²", f"{r2:.4f}"]
]


table = ax.table(
    cellText=table_data,
    colLabels=[
        "Evaluation Metric",
        "Test Result"
    ],
    cellLoc="center",
    loc="center",
    colWidths=[
        0.4,
        0.4
    ]
)


table.auto_set_font_size(
    False
)

table.set_fontsize(
    13
)

table.scale(
    1,
    2
)


plt.title(
    "Dynamic Discount Prediction — Test Performance",
    pad=20
)


save_plot(
    os.path.join(
        MODEL2_RESULTS,
        "regression_metrics.png"
    )
)


# ============================================================
# 15. MODEL 2 — ACTUAL VS PREDICTED
# ============================================================

print(
    "\nGenerating actual vs predicted plot..."
)


plt.figure(
    figsize=(9, 7)
)


plt.scatter(
    discount_y_test,
    discount_pred,
    alpha=0.45
)


minimum = min(
    discount_y_test.min(),
    discount_pred.min()
)

maximum = max(
    discount_y_test.max(),
    discount_pred.max()
)


plt.plot(
    [minimum, maximum],
    [minimum, maximum],
    linestyle="--",
    linewidth=2
)


plt.title(
    "Actual vs Predicted Recommended Discount"
)

plt.xlabel(
    "Actual Discount (%)"
)

plt.ylabel(
    "Predicted Discount (%)"
)


save_plot(
    os.path.join(
        MODEL2_RESULTS,
        "actual_vs_predicted.png"
    )
)


# ============================================================
# 16. MODEL 2 — RESIDUAL PLOT
# ============================================================

print(
    "\nGenerating residual plot..."
)


residuals = (
    discount_y_test -
    discount_pred
)


plt.figure(
    figsize=(9, 7)
)


plt.scatter(
    discount_pred,
    residuals,
    alpha=0.45
)


plt.axhline(
    0,
    linestyle="--",
    linewidth=2
)


plt.title(
    "Residual Plot — Dynamic Discount Model"
)

plt.xlabel(
    "Predicted Discount (%)"
)

plt.ylabel(
    "Residual (Actual − Predicted)"
)


save_plot(
    os.path.join(
        MODEL2_RESULTS,
        "residual_plot.png"
    )
)


# ============================================================
# 17. MODEL 2 — ERROR DISTRIBUTION
# ============================================================

print(
    "\nGenerating error distribution..."
)


plt.figure(
    figsize=(9, 6)
)


sns.histplot(
    residuals,
    bins=30,
    kde=True
)


plt.axvline(
    0,
    linestyle="--",
    linewidth=2
)


plt.title(
    "Distribution of Discount Prediction Errors"
)

plt.xlabel(
    "Prediction Error (Actual − Predicted)"
)

plt.ylabel(
    "Frequency"
)


save_plot(
    os.path.join(
        MODEL2_RESULTS,
        "error_distribution.png"
    )
)


# ============================================================
# 18. FINAL OUTPUT
# ============================================================

print("\n========================================")
print("VISUALIZATION COMPLETE")
print("========================================")

print(
    "\nDataset results:"
)

print(
    DATASET_RESULTS
)


print(
    "\nModel 1 results:"
)

print(
    MODEL1_RESULTS
)


print(
    "\nModel 2 results:"
)

print(
    MODEL2_RESULTS
)


print(
    "\nAll figures were saved at 300 DPI."
)