import { useState } from "react";
import "./EditProduct.css";
import { apiRequest } from "../services/api";

const CATEGORIES = [
  "Dairy",
  "Bakery",
  "Fruits",
  "Vegetables",
  "Beverages",
  "Snacks",
  "Ready_to_Eat",
  "Meat",
  "Seafood",
  "Deli",
  "Frozen_Meals",
  "Personal_Care",
  "Produce",
];

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () =>
      reject(new Error("Could not read the selected image."));
    reader.readAsDataURL(file);
  });
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
    productFamily: "",
    category: "Dairy",
    stockDate: "",
    expiryDate: "",
    price: "",
    stock: "",
  });

  const [imagePreviews, setImagePreviews] = useState([]);
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

  async function handleImageChange(event) {
    const files = Array.from(event.target.files || []);

    if (!files.length) {
      return;
    }

    const remainingSlots = 3 - imagePreviews.length;

    if (remainingSlots <= 0) {
      setError("You can add up to 3 product images.");
      setImageInputKey((current) => current + 1);
      return;
    }

    const selectedFiles = files.slice(0, remainingSlots);

    if (files.length > remainingSlots) {
      setError("Only 3 product images are allowed.");
    } else {
      setError("");
    }

    const oversized = selectedFiles.find(
      (file) => file.size > 2 * 1024 * 1024
    );

    if (oversized) {
      setError("Each image must be 2 MB or smaller.");
      setImageInputKey((current) => current + 1);
      return;
    }

    try {
      const imageData = await Promise.all(
        selectedFiles.map((file) => fileToDataUrl(file))
      );

      setImagePreviews((current) => [
        ...current,
        ...imageData,
      ].slice(0, 3));

      setImageInputKey((current) => current + 1);
    } catch (err) {
      setError(
        err.message || "Could not load the selected image(s)."
      );
      setImageInputKey((current) => current + 1);
    }
  }

  function handleRemoveImage(index) {
    setImagePreviews((current) =>
      current.filter((_, imageIndex) => imageIndex !== index)
    );
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

    if (sellingPrice <= 0) {
      setError("Selling price must be greater than 0.");
      return;
    }

    if (currentStock < 0) {
      setError("Current stock cannot be negative.");
      return;
    }

    setIsSaving(true);

    try {
      const productData = {
        product_name: formData.name.trim(),
        product_family:
          formData.productFamily.trim() ||
          formData.name.trim(),
        category: formData.category,
        stock_date: formData.stockDate,
        expiry_date: formData.expiryDate,
        current_stock: currentStock,
        // A brand-new product has no sales history yet.
        // The backend initializes derived demand metrics automatically.
        historical_sales: 0,
        selling_price: Number(sellingPrice.toFixed(2)),
        demand_rate: 0,
        sales_velocity: 0,
        days_left: daysLeft,
        expected_demand: 0,
        image_data: imagePreviews[0] || null,
        images: imagePreviews,
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
        historicalSales: response.historical_sales ?? 0,
        demandRate: response.demand_rate ?? 0,
        salesVelocity: response.sales_velocity ?? 0,
        expectedDemand: response.expected_demand ?? 0,
        productFamily: productData.product_family,

        imagePreview: imagePreviews[0] || null,
        imageData: imagePreviews[0] || null,
        images: imagePreviews,
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
              Enter the product and inventory information you know. Sales and
              demand metrics are initialized automatically.
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
                required
              >
                {CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category === "Ready_to_Eat"
                      ? "Ready to Eat"
                      : category === "Frozen_Meals"
                        ? "Frozen Meals"
                        : category === "Personal_Care"
                          ? "Personal Care"
                          : category}
                  </option>
                ))}
              </select>
            </label>

            <label className="form-field">
              <span>Product family</span>

              <input
                type="text"
                name="productFamily"
                value={formData.productFamily}
                onChange={handleChange}
                placeholder="Example: Chicken"
              />

              <small>
                Use the same family for batches that should follow FEFO.
              </small>
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

          <div className="image-upload-area image-upload-gallery-area">
            <div className="image-slot-grid">
              {[0, 1, 2].map((slotIndex) => {
                const image = imagePreviews[slotIndex];
                const isFirst = slotIndex === 0;

                return (
                  <div
                    className={`image-slot ${image ? "has-image" : "empty"}`}
                    key={slotIndex}
                  >
                    {image ? (
                      <>
                        <img
                          src={image}
                          alt={`Product image ${slotIndex + 1}`}
                        />

                        {isFirst && (
                          <span className="image-slot-main">Main image</span>
                        )}

                        <button
                          type="button"
                          className="image-slot-remove"
                          onClick={() => handleRemoveImage(slotIndex)}
                          disabled={isSaving}
                          aria-label={`Remove product image ${slotIndex + 1}`}
                        >
                          ×
                        </button>
                      </>
                    ) : (
                      <label className="image-slot-add">
                        <span className="image-slot-plus">+</span>
                        <strong>{isFirst ? "Add image" : "Add another image"}</strong>
                        <small>Image {slotIndex + 1} of 3</small>
                        <input
                          key={`${imageInputKey}-${slotIndex}`}
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          onChange={handleImageChange}
                          disabled={isSaving}
                        />
                      </label>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="image-upload-content image-gallery-help">
              <strong>Product images</strong>

              <span>
                Add up to 3 images for the same product. Use the same product
                across all three slots; customers can slide through them after
                opening the product. JPG, PNG or WebP, up to 2 MB each.
              </span>

              {imagePreviews.length < 3 && (
                <label className="add-another-image-button">
                  + Add another image
                  <input
                    key={`additional-${imageInputKey}`}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleImageChange}
                    disabled={isSaving}
                  />
                </label>
              )}

              {imagePreviews.length > 0 && (
                <button
                  type="button"
                  className="remove-image-button"
                  onClick={() => {
                    setImagePreviews([]);
                    setImageInputKey((current) => current + 1);
                  }}
                  disabled={isSaving}
                >
                  Remove all images
                </button>
              )}
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