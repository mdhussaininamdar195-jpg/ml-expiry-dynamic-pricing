# DailyCart

## ML-Driven Expiry-Based Dynamic Pricing System for Retail Waste Reduction

DailyCart is a full-stack retail inventory and dynamic pricing system that uses machine learning to estimate product waste risk and recommend discounts for products approaching expiry.

The system combines inventory management, expiry-related risk prediction, dynamic pricing, customer purchasing, and administration features into a single web application.

## Authors

- Shafin Inamdar
- Mohammed Hussain Inamdar

---

## Overview

Perishable products can lose their value as they approach their expiry dates. If these products are not sold in time, they may contribute to inventory waste and financial loss.

DailyCart addresses this problem by using product inventory, sales, demand, and expiry-related information to estimate waste risk and generate a recommended discount.

The system follows a two-stage machine learning pipeline:

```text
  Product and Inventory Data
            |
            v
    Waste Risk Prediction
            |
            v
      Waste Risk Score
            |
            v
 Dynamic Discount Prediction
            |
            v
   Recommended Discount
            |
            v
     Final Selling Price                                                                                                                                                                                                                             The machine learning models are integrated into a FastAPI backend and used by the web application to provide pricing-related predictions.

Key Features
Machine Learning
Multi-class waste risk prediction
Waste risk score generation
Dynamic discount prediction
Recommended discount generation
Final selling price calculation
Feature engineering using inventory, sales, demand, and expiry-related attributes
XGBoost-based waste risk classification
Regression-based dynamic discount prediction
Saved preprocessing and trained model artifacts
Backend integration for prediction
Product and Inventory Management
Product catalogue management
Product categories
Product stock management
Selling price management
Stock date and expiry date management
Product family information
Product image management
Add products
Edit products
Delete products
Product search
Category filtering
Risk-level filtering
Inventory information display
Customer Features
Customer registration
Customer login
Product catalogue
Product search
Product category browsing
Product details
Shelf-life information
Dynamic pricing and discount display
Shopping cart
Product purchasing
Purchase history
Customer account settings
Account logout
Administration Features
Administrator authentication
Product catalogue management
Add products
Edit products
Delete products
Product search and filtering
Inventory monitoring
Waste-risk information
Purchase statistics
Revenue information
Waste recovery statistics
Sustainability-related metrics
Dashboard visualizations
Machine Learning Dataset

DailyCart uses a synthetic expiry-pricing dataset containing 26,000 records and 18 columns.

The dataset contains the following attributes:

Product_ID
Product_Name
Category
Stock_Date
Expiry_Date
Current_Stock
Historical_Sales
Selling_Price
Discount
Final_Price
Demand_Rate
Sales_Velocity
Days_Left
Expected_Demand
Wastage_Quantity
Expiry_Risk
Waste_Risk
Recommended_Discount

The dataset is synthetic and is used for developing and evaluating the machine learning components of the project.

Machine Learning Pipeline

The machine learning system consists of two main models.

Model 1: Waste Risk Prediction

The first model predicts the waste-risk category of a product.

The model classifies products into three categories:

Low
Medium
High

The implementation uses an XGBoost classifier with multi-class probability prediction.

The model uses inventory, sales, demand, product, and expiry-related information.

Model 1 Test Results
Metric	Result
Accuracy	87.31%
Weighted Precision	87.89%
Weighted Recall	87.31%
Weighted F1-Score	87.38%
Weighted ROC-AUC	96.89%
Model 2: Dynamic Discount Prediction

The second model predicts a recommended discount using the waste risk score along with inventory, sales, demand, pricing, and expiry-related features.

The model compares implemented regression approaches using validation performance and saves the selected model for inference.

Model 2 Test Results
Metric	Result
MAE	3.7972
RMSE	4.7910
R²	0.9326

The discount prediction output is used as part of the application's dynamic pricing workflow.

Feature Engineering

The machine learning pipeline performs preprocessing and feature engineering before model training.

Features used in the prediction pipeline include:

Current Stock
Historical Sales
Selling Price
Demand Rate
Sales Velocity
Days Left
Expected Demand
Stock Duration
Stock Demand Ratio
Product Name
Category

The preprocessing components are fitted during model preparation and saved as reusable artifacts.    

                         DailyCart
                             |
              +--------------+--------------+
              |                             |
              v                             v
       React Frontend                 FastAPI Backend
              |                             |
              |                 +-----------+-----------+
              |                 |                       |
              |                 v                       v
              |              SQLite              ML Prediction
              |                                         |
              |                           +-------------+-------------+
              |                           |                           |
              |                           v                           v
              |                  Waste Risk Model             Discount Model
              |                           |                           |
              |                           +-------------+-------------+
              |                                         |
              +-------------------+---------------------+
                                  |
                         Customer / Admin UI
Technology Stack:
Frontend
React
Vite
JavaScript
CSS
Backend
Python
FastAPI
SQLite
JWT-based authentication
Machine Learning
Python
XGBoost
Scikit-learn
Pandas
NumPy
Matplotlib
Seaborn
Version Control
Git
GitHub

ml-expiry-dynamic-pricing/
│
├── backend/
│   ├── auth.py
│   ├── database.py
│   ├── import_dataset.py
│   └── main.py
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── assets/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   └── index.css
│   ├── package.json
│   └── vite.config.js
│
├── ml/
│   ├── datasets/
│   │   └── raw/
│   │       └── synthetic_expiry_pricing_dataset.csv
│   │
│   ├── models/
│   │   ├── discount_model.pkl
│   │   ├── discount_preprocessor.pkl
│   │   ├── waste_preprocessor.pkl
│   │   ├── waste_risk_label_encoder.pkl
│   │   └── waste_risk_xgb.pkl
│   │
│   ├── results/
│   │   ├── dataset/
│   │   ├── model1_waste_risk/
│   │   └── model2_discount/
│   │
│   └── src/
│       ├── feature_analysis.py
│       ├── inspect_dataset.py
│       ├── predict.py
│       ├── prepare_discount_data.py
│       ├── preprocessing_new.py
│       ├── test_predictions.py
│       ├── train_discount_model.py
│       ├── train_waste_model.py
│       └── visualize_results.py
│
├── .gitignore
└── README.md
Machine Learning Results and Visualizations

The repository contains the visualizations generated during dataset analysis and model evaluation.

Dataset Analysis
Correlation Heatmap
Waste Risk Distribution
Days Remaining Distribution
Risk vs. Days Remaining
Model 1: Waste Risk Prediction
Confusion Matrix
Classification Performance
ROC Curve
Precision-Recall Curve
Feature Importance
Model 2: Dynamic Discount Prediction
Actual vs. Predicted Values
Residual Plot
Error Distribution
Regression Metrics
Application Screenshots
Customer Product Details

The customer interface displays the product category, shelf-life information, current price, original price, discount, savings, and the option to add the product to the cart.

Admin Dashboard

The administration dashboard provides information about purchases, products purchased, products purchased near expiry, amount recouped, purchase revenue, store revenue growth, and sustainability-related statistics.

Admin Product Catalogue

The product management interface allows administrators to search and filter products and manage product information including category, price, stock, expiry, risk level, editing, and deletion.

Add Product

The administration interface allows a new product to be added with product name, category, product family, selling price, stock date, expiry date, current stock, and product images.

Customer Account Settings

The customer settings interface provides account information, appearance preferences, account-related options, FAQ access, logout, and purchase summary.

Customer Login

Customers can sign in using their registered email and password.

Admin Login

Administrators have a separate authentication interface for accessing product management, pricing, inventory, and store analytics.

Running the Project
Clone the Repository
git clone <repository-url>
cd ml-expiry-dynamic-pricing
Backend Setup

Create a Python virtual environment:

python -m venv .venv

Activate the virtual environment on Windows:

.venv\Scripts\activate

Install the required Python packages used by the backend and machine learning components.

Start the FastAPI backend with:

uvicorn backend.main:app --reload

The FastAPI API documentation is available at:

http://127.0.0.1:8000/docs

The backend loads the trained machine learning artifacts from:

ml/models/
Frontend Setup

Navigate to the frontend directory:

cd frontend

Install the frontend dependencies:

npm install

Start the development server:

npm run dev

The frontend can then be accessed through the local development URL provided by Vite.

Database

DailyCart uses SQLite for application data storage.

The local database is:

products.db

The database is created and managed locally by the backend and is excluded from version control.

The repository does not include the local SQLite database.

Model Artifacts

The trained machine learning artifacts are stored in:

ml/models/

The repository contains:

discount_model.pkl
discount_preprocessor.pkl
waste_preprocessor.pkl
waste_risk_label_encoder.pkl
waste_risk_xgb.pkl

These artifacts allow the backend to load the trained models and preprocessing components for prediction.
rediction Workflow

When product information is processed by the prediction system, the application follows the following workflow:

```text
Product Information
        |
        v
Feature Engineering
        |
        v
Preprocessing
        |
        v
Waste Risk Classification
        |
        v
Waste Risk Score
        |
        v
Discount Prediction
        |
        v
Recommended Discount
        |
        v
Dynamic Price

The resulting pricing information is made available through the application's product interface.

Repository Contents

The repository contains:

React frontend source code
FastAPI backend source code
SQLite database integration
Synthetic machine learning dataset
Trained machine learning models
Preprocessing artifacts
Machine learning evaluation results
Data analysis visualizations
Model evaluation visualizations
Product and inventory management functionality
Customer purchasing functionality
Administration dashboard

Local environment files, the local SQLite database, processed datasets, virtual environments, and other development-specific generated files are excluded from version control.

Project Objective

The objective of DailyCart is to demonstrate an end-to-end machine learning and full-stack approach for expiry-based dynamic pricing in retail.

The system uses inventory, sales, demand, and expiry-related information to estimate product waste risk and generate discount recommendations for products approaching expiry.

DailyCart integrates the machine learning pipeline with a web-based retail application containing customer, product management, inventory, purchasing, and administration functionality.


### Screenshot filenames to use

Create this folder in your repo:

```text
screenshots/
