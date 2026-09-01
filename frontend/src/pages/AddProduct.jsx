import { useState } from "react";
import "./EditProduct.css";

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
      <path d="m21 15-5-5L6 20" />
    </svg>
  );
}

function AddProduct({ onBack, onSave }) {
  const [formData, setFormData] = useState({
    name: "",
    category: "Dairy",
    size: "",
    price: "",
    originalPrice: "",
    stock: "",
    daysLeft: "",
    risk: "Low",
  });

  const [imagePreview, setImagePreview] = useState(null);
  const [imageInputKey, setImageInputKey] = useState(0);

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
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

  function handleSubmit(event) {
    event.preventDefault();

    const newProduct = {
      id: Date.now(),
      name: formData.name.trim(),
      category: formData.category,
      size: formData.size.trim(),
      price: Number(formData.price),
      originalPrice: Number(formData.originalPrice || formData.price),
      stock: Number(formData.stock),
      daysLeft: Number(formData.daysLeft),
      risk: formData.risk,
      status:
        Number(formData.daysLeft) <= 2
          ? "Near expiry"
          : Number(formData.price) <
              Number(formData.originalPrice || formData.price)
            ? "Reduced price"
            : "Fresh",
      imagePreview,
    };

    if (onSave) {
      onSave(newProduct);
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
          >
            ← Back to products
          </button>

          <span className="edit-eyebrow">
            Product management
          </span>

          <h1>Add product</h1>

          <p>
            Add a new product to the store catalogue.
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
              Basic information about this product.
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
              <span>Pack size</span>

              <input
                type="text"
                name="size"
                value={formData.size}
                onChange={handleChange}
                placeholder="Example: 1 L"
                required
              />
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
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  required
                />
              </div>
            </label>

            <label className="form-field">
              <span>Original price</span>

              <div className="price-input">
                <span>₹</span>

                <input
                  type="number"
                  name="originalPrice"
                  value={formData.originalPrice}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                />
              </div>
            </label>

            <label className="form-field">
              <span>Current stock</span>

              <input
                type="number"
                name="stock"
                value={formData.stock}
                onChange={handleChange}
                min="0"
                placeholder="0"
                required
              />
            </label>

            <label className="form-field">
              <span>Days until expiry</span>

              <input
                type="number"
                name="daysLeft"
                value={formData.daysLeft}
                onChange={handleChange}
                min="0"
                placeholder="Example: 7"
                required
              />
            </label>

            <label className="form-field">
              <span>Expiry risk</span>

              <select
                name="risk"
                value={formData.risk}
                onChange={handleChange}
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </label>
          </div>
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
                JPG, PNG or WebP. Image upload will be connected
                to the backend later.
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
          >
            Cancel
          </button>

          <button
            type="submit"
            className="save-product-button"
          >
            Add product
          </button>
        </div>
      </form>
    </div>
  );
}

export default AddProduct;