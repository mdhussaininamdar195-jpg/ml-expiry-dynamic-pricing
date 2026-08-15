import pandas as pd

# Load dataset
df = pd.read_csv("ml/datasets/raw/synthetic_expiry_pricing_dataset.csv")

print("\n========== DATASET SHAPE ==========")
print(df.shape)

print("\n========== COLUMNS ==========")
print(df.columns.tolist())

print("\n========== DATA TYPES ==========")
print(df.dtypes)

print("\n========== MISSING VALUES ==========")
print(df.isnull().sum())

print("\n========== DUPLICATES ==========")
print("Duplicate rows:", df.duplicated().sum())

print("\n========== TARGET: WASTE RISK ==========")
print(df["Waste_Risk"].value_counts())
print(df["Waste_Risk"].value_counts(normalize=True) * 100)

print("\n========== TARGET: RECOMMENDED DISCOUNT ==========")
print(df["Recommended_Discount"].describe())

print("\n========== NUMERICAL SUMMARY ==========")
print(df.describe())

print("\n========== CATEGORICAL VALUES ==========")
for column in ["Product_Name", "Category", "Waste_Risk"]:
    print(f"\n{column}:")
    print(df[column].value_counts())

print("\n========== DATE CHECK ==========")
df["Stock_Date"] = pd.to_datetime(df["Stock_Date"])
df["Expiry_Date"] = pd.to_datetime(df["Expiry_Date"])

print("Invalid expiry dates:", (df["Expiry_Date"] < df["Stock_Date"]).sum())

print("\n========== SAMPLE DATA ==========")
print(df.head(5))