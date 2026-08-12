import pandas as pd

df = pd.read_csv("ml/datasets/raw/perishable_goods_management.csv")

print("Dataset shape:")
print(df.shape)

print("\nColumns:")
print(df.columns.tolist())

print("\nFirst 5 rows:")
print(df.head())

print("\nMissing values:")
print(df.isnull().sum())
print("\nData Types:")
print(df.dtypes.to_string())
print("\nUnique Values:")
print(df.nunique().to_string())
print("\nWaste Risk Distribution:")
print(df["was_spoiled"].value_counts())

print("\nSpoilage Risk Distribution:")
print(df["spoilage_risk"].describe())

print("\nDiscount Distribution:")
print(df["discount_pct"].describe())

print("\nMarkdown Applied:")
print(df["markdown_applied"].value_counts())

print("\nWaste Percentage:")
print(df["waste_pct"].describe())

print("\nSpoilage Risk vs Was Spoiled:")
print(pd.crosstab(df["was_spoiled"], df["spoilage_risk"].round(2)))

print("\nUnique Discount Values:")
print(sorted(df["discount_pct"].unique()))

print("\nDiscount Values Count:")
print(df["discount_pct"].value_counts().sort_index())

print("\nCorrelation with was_spoiled:")

numeric_cols = df.select_dtypes(include=["int64", "float64"])

print(
    numeric_cols.corr()["was_spoiled"]
    .sort_values(ascending=False)
)

print("\n--- Expiry Date Verification ---")

# Convert date columns to actual datetime
df["transaction_date"] = pd.to_datetime(df["transaction_date"])
df["expiration_date"] = pd.to_datetime(df["expiration_date"])

# Calculate days until expiry ourselves
df["calculated_days_until_expiry"] = (
    df["expiration_date"] - df["transaction_date"]
).dt.days

# Compare with the dataset's existing value
df["expiry_difference"] = (
    df["calculated_days_until_expiry"] - df["days_until_expiry"]
)

print("\nSample comparison:")
print(
    df[
        [
            "transaction_date",
            "expiration_date",
            "days_until_expiry",
            "calculated_days_until_expiry",
            "expiry_difference"
        ]
    ].head(10)
)

# Count matches and mismatches
matches = (df["expiry_difference"] == 0).sum()
mismatches = (df["expiry_difference"] != 0).sum()

print("\nExpiry verification results:")
print("Matching rows:", matches)
print("Mismatching rows:", mismatches)
print("Total rows:", len(df))

print("\nMaximum difference:", df["expiry_difference"].abs().max())

print("\nExpiry Difference Distribution:")
print(df["expiry_difference"].value_counts().sort_index())

print("\nDays Remaining At Purchase:")
print(df["days_remaining_at_purchase"].describe())

print("\nCompare days_remaining_at_purchase with calculated expiry:")
print(
    (
        df["days_remaining_at_purchase"]
        - df["calculated_days_until_expiry"]
    ).value_counts().sort_index()
)

print("\nNegative days_remaining_at_purchase:")
print((df["days_remaining_at_purchase"] < 0).sum())