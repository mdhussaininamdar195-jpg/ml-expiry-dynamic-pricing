import { useState } from "react";
import "./EditProduct.css";
import { apiRequest } from "../services/api";

const BASE_CATEGORIES = [
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

  return Math.floor(
    (expiry.getTime() - stock.getTime()) /
      (1000 * 60 * 60 * 24)
  );
}

function EditProduct({ product, onBack, onSave }) {
  const currentCategory = product?.category || "Dairy";
  const categories = BASE_CATEGORIES.includes(currentCategory)
    ? BASE_CATEGORIES
    : [currentCategory, ...BASE_CATEGORIES];

  const [formData, setFormData] = useState({
    name: product?.name || "",
    category: currentCategory,
    stockDate: product?.stockDate || "",
    expiryDate: product?.expiryDate || "",
    // IMPORTANT: edit the original selling price, not the ML final price.
    price: Number(product?.originalPrice ?? 0).toFixed(2),
    stock: String(product?.stock ?? ""),
    historicalSales: String(product?.historicalSales ?? ""),
    demandRate: String(product?.demandRate ?? ""),
    salesVelocity: String(product?.salesVelocity ?? ""),
    expectedDemand: String(product?.expectedDemand ?? ""),
  });

  const initialImages = Array.isArray(product?.images)
    ? product.images.filter(Boolean).slice(0, 3)
    : product?.imageData || product?.imagePreview
      ? [product.imageData || product.imagePreview]
      : [];

  const [imagePreviews, setImagePreviews] = useState(initialImages);
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
    if (!files.length) return;

    const remainingSlots = 3 - imagePreviews.length;
    if (remainingSlots <= 0) {
      setError("You can add up to 3 product images.");
      setImageInputKey((current) => current + 1);
      return;
    }

    const selectedFiles = files.slice(0, remainingSlots);
    if (selectedFiles.some((file) => file.size > 2 * 1024 * 1024)) {
      setError("Each image must be 2 MB or smaller.");
      setImageInputKey((current) => current + 1);
      return;
    }

    try {
      const imageData = await Promise.all(selectedFiles.map(fileToDataUrl));
      setImagePreviews((current) => [...current, ...imageData].slice(0, 3));
      setError("");
    } catch (err) {
      setError(err.message || "Could not load the selected image(s).");
    } finally {
      setImageInputKey((current) => current + 1);
    }
  }

  function handleRemoveImage(index) {
    setImagePreviews((current) =>
      current.filter((_, imageIndex) => imageIndex !== index)
    );
    setImageInputKey((current) => current + 1);
  }

  function handleRemoveAllImages() {
    setImagePreviews([]);
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

    if (!Number.isFinite(sellingPrice) || sellingPrice <= 0) {
      setError("Selling price must be greater than 0.");
      return;
    }

    if (!Number.isInteger(currentStock) || currentStock < 0) {
      setError("Current stock must be a whole number and cannot be negative.");
      return;
    }

    if (!Number.isInteger(historicalSales) || historicalSales < 0) {
      setError("Historical sales must be a whole number and cannot be negative.");
      return;
    }

    if (!Number.isFinite(demandRate) || demandRate < 0) {
      setError("Demand rate cannot be negative.");
      return;
    }

    if (!Number.isInteger(salesVelocity) || salesVelocity < 0) {
      setError("Sales velocity must be a whole number and cannot be negative.");
      return;
    }

    if (!Number.isInteger(expectedDemand) || expectedDemand < 0) {
      setError("Expected demand must be a whole number and cannot be negative.");
      return;
    }

    setIsSaving(true);

    try {
      const productData = {
        product_name: formData.name.trim(),
        category: formData.category,
        product_family:
          product?.productFamily ||
          product?.product_family ||
          "",
        stock_date: formData.stockDate,
        expiry_date: formData.expiryDate,
        current_stock: currentStock,
        historical_sales: historicalSales,
        selling_price: Number(sellingPrice.toFixed(2)),
        demand_rate: demandRate,
        sales_velocity: salesVelocity,
        days_left: daysLeft,
        expected_demand: expectedDemand,
        image_data: imagePreviews[0] || null,
        images: imagePreviews,
      };

      const response = await apiRequest(
        `/products/${product.id}`,
        {
          method: "PUT",
          body: JSON.stringify(productData),
        }
      );

      const prediction = response.prediction ?? {};

      const updatedProduct = {
        ...product,
        id: response.product_id ?? product.id,
        name: productData.product_name,
        category: productData.category,
        productFamily: productData.product_family,
        price: Number(
          prediction.final_price ??
            productData.selling_price
        ),
        originalPrice: productData.selling_price,
        recommendedDiscount: Number(
          prediction.recommended_discount ?? 0
        ),
        finalPrice: Number(
          prediction.final_price ??
            productData.selling_price
        ),
        stock: currentStock,
        daysLeft,
        risk:
          prediction.waste_risk_category ??
          "Unknown",
        wasteRiskScore:
          prediction.waste_risk_score ?? null,
        stockDate: productData.stock_date,
        expiryDate: productData.expiry_date,
        historicalSales,
        demandRate,
        salesVelocity,
        expectedDemand,
        imagePreview: imagePreviews[0] || null,
        imageData: imagePreviews[0] || null,
        images: imagePreviews,
      };

      if (onSave) {
        onSave(updatedProduct);
      }
    } catch (err) {
      console.error("Failed to update product:", err);

      setError(
        err.message ||
          "Failed to update product. Please try again."
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

          <h1>Edit product</h1>

          <p>
            Update product information and recalculate its
            ML-based price.
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
              Use the same inputs required by the pricing model.
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
                {categories.map((category) => (
                  <option
                    key={category}
                    value={category}
                  >
                    {category}
                  </option>
                ))}
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

        <section className="edit-section edit-image-section">
          <div className="section-heading image-section-heading">
            <div>
              <h2>Product images</h2>
              <p>Use up to 3 images. The first image is the main customer-facing image.</p>
            </div>
            <span className="image-count-pill">{imagePreviews.length}/3 images</span>
          </div>

          <div className="image-upload-gallery-area">
            <div className="image-slot-grid">
              {[0, 1, 2].map((slotIndex) => {
                const image = imagePreviews[slotIndex];
                const label = slotIndex === 0 ? "Add main image" : "Add another image";
                return (
                  <div className={`image-slot ${image ? "has-image" : "empty"}`} key={slotIndex}>
                    {image ? (
                      <>
                        <img src={image} alt={`Product image ${slotIndex + 1}`} />
                        {slotIndex === 0 && <span className="image-slot-main">Main image</span>}
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
                        <strong>{label}</strong>
                        <small>Image {slotIndex + 1} of 3</small>
                        <input
                          key={`${imageInputKey}-${slotIndex}`}
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          onChange={handleImageChange}
                        />
                      </label>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="image-gallery-help">
              <span className="image-help-icon">▧</span>
              <strong>Product gallery</strong>
              <p>JPG, PNG or WebP, up to 2 MB each. Customers can slide through these images after opening the product.</p>
              {imagePreviews.length < 3 && (
                <label className="add-another-image-button">
                  + Add another image
                  <input
                    key={`additional-${imageInputKey}`}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleImageChange}
                  />
                </label>
              )}
              {imagePreviews.length > 0 && (
                <button
                  type="button"
                  className="remove-all-images-button"
                  onClick={handleRemoveAllImages}
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
            {isSaving ? "Saving changes..." : "Save changes"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default EditProduct;
