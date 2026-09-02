import { useEffect, useState } from "react";
import "./AdminProducts.css";
import EditProduct from "./EditProduct";
import AddProduct from "./AddProduct";
import { apiRequest } from "../services/api";

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4 4" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function EditIcon() {
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
      <path d="M4 20h4l10.5-10.5a2.1 2.1 0 0 0-3-3L5 17v3Z" />
      <path d="m14.5 7.5 2 2" />
    </svg>
  );
}

function AdminProducts() {
  const [editingProduct, setEditingProduct] = useState(null);
  const [addingProduct, setAddingProduct] = useState(false);
  const [productList, setProductList] = useState([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedRisk, setSelectedRisk] = useState("all-risk");

  useEffect(() => {
    async function loadProducts() {
      try {
        const data = await apiRequest("/products");

        const mappedProducts = data.map((product) => ({
          id: product.id,
          name: product.product_name,
          category: product.category,
          price: product.selling_price,
          stock: product.current_stock,
          daysLeft: product.days_left,
          risk: product.waste_risk || "Unknown",
        }));

        setProductList(mappedProducts);
      } catch (error) {
        console.error("Failed to load products:", error);
      }
    }

    loadProducts();
  }, []);

  if (addingProduct) {
    return (
      <AddProduct
        onBack={() => setAddingProduct(false)}
        onSave={(newProduct) => {
          const nextId =
            productList.length > 0
              ? Math.max(...productList.map((product) => product.id)) + 1
              : 1;

          setProductList((currentProducts) => [
            ...currentProducts,
            {
              ...newProduct,
              id: nextId,
            },
          ]);

          setAddingProduct(false);
        }}
      />
    );
  }

  if (editingProduct) {
    return (
      <EditProduct
        product={editingProduct}
        onBack={() => setEditingProduct(null)}
        onSave={(updatedProduct) => {
          setProductList((currentProducts) =>
            currentProducts.map((product) =>
              product.id === updatedProduct.id
                ? updatedProduct
                : product
            )
          );

          setEditingProduct(null);
        }}
      />
    );
  }

  const filteredProducts = productList.filter((product) => {
    const matchesSearch = product.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    const matchesCategory =
      selectedCategory === "all" ||
      product.category.toLowerCase() === selectedCategory;

    const matchesRisk =
      selectedRisk === "all-risk" ||
      product.risk.toLowerCase() ===
        selectedRisk.replace("-risk", "");

    return matchesSearch && matchesCategory && matchesRisk;
  });

  return (
    <div className="admin-products-page">
      <header className="admin-page-header">
        <div>
          <span className="admin-eyebrow">
            Administration
          </span>

          <h1>Products</h1>

          <p>
            Manage your store catalogue and inventory information.
          </p>
        </div>

        <button
          type="button"
          className="add-product-button"
          onClick={() => setAddingProduct(true)}
        >
          <PlusIcon />
          <span>Add product</span>
        </button>
      </header>

      <section className="product-toolbar">
        <div className="admin-search">
          <SearchIcon />

          <input
            type="search"
            placeholder="Search products"
            aria-label="Search products"
            value={searchTerm}
            onChange={(event) =>
              setSearchTerm(event.target.value)
            }
          />

          {searchTerm && (
            <button
              type="button"
              className="clear-search-button"
              onClick={() => setSearchTerm("")}
              aria-label="Clear search"
            >
              ×
            </button>
          )}
        </div>

        <select
          className="filter-select"
          value={selectedCategory}
          onChange={(event) =>
            setSelectedCategory(event.target.value)
          }
        >
          <option value="all">All categories</option>
          <option value="dairy">Dairy</option>
          <option value="bakery">Bakery</option>
          <option value="produce">Produce</option>
          <option value="beverages">Beverages</option>
        </select>

        <select
          className="filter-select"
          value={selectedRisk}
          onChange={(event) =>
            setSelectedRisk(event.target.value)
          }
        >
          <option value="all-risk">All risk levels</option>
          <option value="high-risk">High risk</option>
          <option value="medium-risk">Medium risk</option>
          <option value="low-risk">Low risk</option>
        </select>
      </section>

      <section className="products-panel">
        <div className="products-panel-header">
          <div>
            <h2>Product catalogue</h2>

            <span>
              {filteredProducts.length}{" "}
              {filteredProducts.length === 1
                ? "product"
                : "products"}
            </span>
          </div>
        </div>

        <div className="products-table-wrapper">
          <table className="products-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Expiry</th>
                <th>Risk</th>
                <th aria-label="Actions" />
              </tr>
            </thead>

            <tbody>
              {filteredProducts.map((product) => (
                <tr key={product.id}>
                  <td>
                    <div className="table-product">
                      <div className="table-product-image">
                        {product.imagePreview ? (
                          <img
                            src={product.imagePreview}
                            alt={product.name}
                          />
                        ) : (
                          product.name.charAt(0)
                        )}
                      </div>

                      <div>
                        <strong>{product.name}</strong>

                        <span>
                          Product #{product.id}
                        </span>
                      </div>
                    </div>
                  </td>

                  <td>{product.category}</td>

                  <td>
                    <strong>₹{product.price}</strong>
                  </td>

                  <td>{product.stock}</td>

                  <td>
                    <span
                      className={
                        product.daysLeft <= 2
                          ? "expiry-critical"
                          : product.daysLeft <= 5
                            ? "expiry-warning"
                            : "expiry-normal"
                      }
                    >
                      {product.daysLeft}{" "}
                      {product.daysLeft === 1 ? "day" : "days"}
                    </span>
                  </td>

                  <td>
                    <span
                      className={`risk-badge ${product.risk.toLowerCase()}`}
                    >
                      {product.risk}
                    </span>
                  </td>

                  <td>
                    <button
                      type="button"
                      className="edit-product-button"
                      onClick={() =>
                        setEditingProduct(product)
                      }
                    >
                      <EditIcon />
                      <span>Edit</span>
                    </button>
                  </td>
                </tr>
              ))}

              {filteredProducts.length === 0 && (
                <tr>
                  <td
                    colSpan="7"
                    className="no-products-cell"
                  >
                    No products found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default AdminProducts;