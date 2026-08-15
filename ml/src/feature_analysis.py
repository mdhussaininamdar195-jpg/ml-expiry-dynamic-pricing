import pandas as pd

# Load dataset
df = pd.read_csv("ml/datasets/raw/synthetic_expiry_pricing_dataset.csv")

# Convert dates
df["Stock_Date"] = pd.to_datetime(df["Stock_Date"])
df["Expiry_Date"] = pd.to_datetime(df["Expiry_Date"])

# Create date-based features
df["Stock_Duration_Days"] = (
    df["Expiry_Date"] - df["Stock_Date"]
).dt.days

df["Stock_Month"] = df["Stock_Date"].dt.month
df["Stock_DayOfWeek"] = df["Stock_Date"].dt.dayofweek

# Calculate stock pressure
df["Stock_Demand_Ratio"] = (
    df["Current_Stock"] / (df["Expected_Demand"] + 1)
)

# Candidate Model 1 features
features = [
    "Current_Stock",
    "Historical_Sales",
    "Selling_Price",
    "Demand_Rate",
    "Sales_Velocity",
    "Days_Left",
    "Expected_Demand",
    "Stock_Duration_Days",
    "Stock_Month",
    "Stock_DayOfWeek",
    "Stock_Demand_Ratio"
]

print("\n========== MODEL 1 CANDIDATE FEATURES ==========")
print(features)

print("\n========== CORRELATION WITH EXPIRY RISK ==========")

for feature in features:
    correlation = df[feature].corr(df["Expiry_Risk"])
    print(f"{feature:25s}: {correlation:.4f}")

print("\n========== AVERAGE FEATURES BY WASTE RISK ==========")

print(
    df.groupby("Waste_Risk")[features]
    .mean()
    .round(2)
)

print("\n========== WASTE RISK COUNTS ==========")

print(df["Waste_Risk"].value_counts())

print("\n========== DAYS LEFT BY WASTE RISK ==========")

print(
    df.groupby("Waste_Risk")["Days_Left"]
    .agg(["mean", "min", "max"])
    .round(2)
)

print("\n========== STOCK/DEMAND RATIO BY WASTE RISK ==========")

print(
    df.groupby("Waste_Risk")["Stock_Demand_Ratio"]
    .agg(["mean", "min", "max"])
    .round(2)
)