import { useState } from "react";
import "./EditProduct.css";
import { apiRequest } from "../services/api";

function ImageIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="8.5" cy="9" r="1.5" />
      <path d="m4 17 5-5 3.5 3.5 2.5-2.5 5 5" />
    </svg>
  );
}

function calculateDaysLeft(stockDate, expiryDate) {
  if (!stockDate || !expiryDate) {
    return 0;
  }

  const stock = new Date(`${stockDate}T00:00:00`);
  const expiry = new Date(`${expiryDate}T00:00:00`);

  const difference = expiry.getTime() - stock.getTime();

  return Math.floor(difference / (1000 * 60 * 60 * 24));
}

function AddProduct({ onBack, onSave }) {
  const [formData, setFormData] = useState({
    name: "",
    category: "Dairy",
    stockDate: "",
    expiryDate: "",
    price: "",
    stock: "",
    historicalSales: "",
    demandRate: "",
    salesVelocity: "",
    expectedDemand: "",
  });

  const [imagePreview, setImagePreview] = useState(null);
  const [imageInputKey, setImageInputKey] = useState(0);

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));

    if (error) {
      setError("");
    }
  }

  function handleImageChange(event) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const imageUrl = URL.createObjectURL(file);
    setImagePreview(imageUrl);
  }

  function handleRemoveImage() {
    setImagePreview(null);
    setImageInputKey((current) => current + 1);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");

    if (!formData.stockDate || !formData.expiryDate) {
      setError("Please select both stock date and expiry date.");
      return;
    }

    const daysLeft = calculateDaysLeft(
      formData.stockDate,
      formData.expiryDate
    );

    if (daysLeft < 0) {
      setError("Expiry date cannot be before the stock date.");
      return;
    }

    const sellingPrice = Number(formData.price);
    const currentStock = Number(formData.stock);
    const historicalSales = Number(formData.historicalSales);
    const demandRate = Number(formData.demandRate);
    const salesVelocity = Number(formData.salesVelocity);
    const expectedDemand = Number(formData.expectedDemand);

    if (sellingPrice <= 0) {
      setError("Selling price must be greater than 0.");
      return;
    }

    if (currentStock < 0) {
      setError("Current stock cannot be negative.");
      return;
    }

    if (historicalSales < 0) {
      setError("Historical sales cannot be negative.");
      return;
    }

    if (demandRate < 0) {
      setError("Demand rate cannot be negative.");
      return;
    }

    if (salesVelocity < 0) {
      setError("Sales velocity cannot be negative.");
      return;
    }

    if (expectedDemand < 0) {
      setError("Expected demand cannot be negative.");
      return;
    }

    setIsSaving(true);

    try {
      const productData = {
        product_name: formData.name.trim(),
        category: formData.category,
        stock_date: formData.stockDate,
        expiry_date: formData.expiryDate,
        current_stock: currentStock,
        historical_sales: historicalSales,
        selling_price: Number(sellingPrice.toFixed(2)),
        demand_rate: demandRate,
        sales_velocity: salesVelocity,
        days_left: daysLeft,
        expected_demand: expectedDemand,
      };

      const response = await apiRequest("/products", {
        method: "POST",
        body: JSON.stringify(productData),
      });

      const prediction = response.prediction;

      const newProduct = {
        id: response.product_id,

        name: productData.product_name,
        category: productData.category,

        price: prediction?.final_price ?? sellingPrice,
        originalPrice: sellingPrice,

        stock: productData.current_stock,
        daysLeft: productData.days_left,

        risk: prediction?.waste_risk_category ?? "Unknown",
        wasteRiskScore: prediction?.waste_risk_score ?? null,
        recommendedDiscount:
          prediction?.recommended_discount ?? 0,
        finalPrice: prediction?.final_price ?? sellingPrice,

        stockDate: productData.stock_date,
        expiryDate: productData.expiry_date,
        historicalSales: productData.historical_sales,
        demandRate: productData.demand_rate,
        salesVelocity: productData.sales_velocity,
        expectedDemand: productData.expected_demand,

        imagePreview,
      };

      if (onSave) {
        onSave(newProduct);
      }
    } catch (err) {
      console.error("Failed to add product:", err);

      setError(
        err.message || "Failed to add product. Please try again."
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="edit-product-page">
      <div className="edit-product-header">
        <div>
          <button
            type="button"
            className="back-button"
            onClick={onBack}
            disabled={isSaving}
          >
            ← Back to products
          </button>

          <span className="edit-eyebrow">
            Product management
          </span>

          <h1>Add product</h1>

          <p>
            Add a new product and let the pricing model calculate
            its recommended price.
          </p>
        </div>
      </div>

      <form
        className="edit-product-form"
        onSubmit={handleSubmit}
      >
        <section className="edit-section">
          <div className="section-heading">
            <h2>Product information</h2>

            <p>
              Enter the information required by the pricing model.
            </p>
          </div>

          <div className="form-grid">
            <label className="form-field form-field-wide">
              <span>Product name</span>

              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter product name"
                required
              />
            </label>

            <label className="form-field">
              <span>Category</span>

              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
              >
                <option value="Dairy">Dairy</option>
                <option value="Bakery">Bakery</option>
                <option value="Produce">Produce</option>
                <option value="Beverages">Beverages</option>
              </select>
            </label>

            <label className="form-field">
              <span>Selling price</span>

              <div className="price-input">
                <span>₹</span>

                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  min="0.01"
                  step="0.01"
                  placeholder="0.00"
                  required
                />
              </div>
            </label>

            <label className="form-field">
              <span>Stock date</span>

              <input
                type="date"
                name="stockDate"
                value={formData.stockDate}
                onChange={handleChange}
                required
              />
            </label>

            <label className="form-field">
              <span>Expiry date</span>

              <input
                type="date"
                name="expiryDate"
                value={formData.expiryDate}
                onChange={handleChange}
                min={formData.stockDate || undefined}
                required
              />
            </label>

            <label className="form-field">
              <span>Current stock</span>

              <input
                type="number"
                name="stock"
                value={formData.stock}
                onChange={handleChange}
                min="0"
                step="1"
                placeholder="Example: 50"
                required
              />
            </label>

            <label className="form-field">
              <span>Historical sales</span>

              <input
                type="number"
                name="historicalSales"
                value={formData.historicalSales}
                onChange={handleChange}
                min="0"
                step="1"
                placeholder="Example: 120"
                required
              />
            </label>

            <label className="form-field">
              <span>Demand rate</span>

              <input
                type="number"
                name="demandRate"
                value={formData.demandRate}
                onChange={handleChange}
                min="0"
                step="0.01"
                placeholder="Example: 4.5"
                required
              />
            </label>

            <label className="form-field">
              <span>Sales velocity</span>

              <input
                type="number"
                name="salesVelocity"
                value={formData.salesVelocity}
                onChange={handleChange}
                min="0"
                step="1"
                placeholder="Example: 5"
                required
              />
            </label>

            <label className="form-field">
              <span>Expected demand</span>

              <input
                type="number"
                name="expectedDemand"
                value={formData.expectedDemand}
                onChange={handleChange}
                min="0"
                step="1"
                placeholder="Example: 40"
                required
              />
            </label>
          </div>

          {error && (
            <div className="form-error" role="alert">
              {error}
            </div>
          )}
        </section>

        <section className="edit-section">
          <div className="section-heading">
            <h2>Product image</h2>

            <p>
              Add an image for customers to identify the product.
            </p>
          </div>

          <div className="image-upload-area">
            <div className="image-preview">
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Product preview"
                />
              ) : (
                <ImageIcon />
              )}
            </div>

            <div className="image-upload-content">
              <strong>Product image</strong>

              <span>
                JPG, PNG or WebP. Image preview is available
                locally for now.
              </span>

              <div className="image-actions">
                <label className="upload-button">
                  Choose image

                  <input
                    key={imageInputKey}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleImageChange}
                  />
                </label>

                {imagePreview && (
                  <button
                    type="button"
                    className="remove-image-button"
                    onClick={handleRemoveImage}
                    disabled={isSaving}
                  >
                    Remove image
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>

        <div className="form-actions">
          <button
            type="button"
            className="cancel-button"
            onClick={onBack}
            disabled={isSaving}
          >
            Cancel
          </button>

          <button
            type="submit"
            className="save-product-button"
            disabled={isSaving}
          >
            {isSaving ? "Adding product..." : "Add product"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default AddProduct;