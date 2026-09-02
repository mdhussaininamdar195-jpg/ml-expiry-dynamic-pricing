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

function DeleteIcon() {
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
      <path d="M4 7h16" />
      <path d="M9 7V4h6v3" />
      <path d="M7 7l1 13h8l1-13" />
      <path d="M10 11v5M14 11v5" />
    </svg>
  );
}

function getPageNumbers(currentPage, totalPages) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages = [1];

  if (currentPage > 4) {
    pages.push("...");
  }

  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);

  for (let page = start; page <= end; page += 1) {
    if (!pages.includes(page)) pages.push(page);
  }

  if (currentPage < totalPages - 3) {
    pages.push("...");
  }

  pages.push(totalPages);
  return pages;
}

function AdminProducts() {
  const [editingProduct, setEditingProduct] = useState(null);
  const [addingProduct, setAddingProduct] = useState(false);
  const [productList, setProductList] = useState([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedRisk, setSelectedRisk] = useState("all-risk");

  const [currentPage, setCurrentPage] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [refreshVersion, setRefreshVersion] = useState(0);
  const [deletingProductId, setDeletingProductId] = useState(null);

  const PAGE_SIZE = 20;

  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, selectedCategory, selectedRisk]);

  useEffect(() => {
    async function loadProducts() {
      setLoading(true);
      setLoadError("");

      try {
        const params = new URLSearchParams({
          page: String(currentPage),
          page_size: String(PAGE_SIZE),
        });

        if (searchTerm.trim()) {
          params.set("search", searchTerm.trim());
        }

        if (selectedCategory !== "all") {
          params.set("category", selectedCategory);
        }

        if (selectedRisk !== "all-risk") {
          params.set("risk", selectedRisk);
        }

        const data = await apiRequest(`/products?${params.toString()}`);
        const products = Array.isArray(data) ? data : data.products ?? [];

        const mappedProducts = products.map((product) => {
          const prediction = product.prediction ?? {};

          return {
            id: product.id,
            name: product.product_name ?? "",
            category: product.category ?? "Unknown",
            price: Number(
              prediction.final_price ??
                product.final_price ??
                product.selling_price ??
                0
            ),
            originalPrice: Number(product.selling_price ?? 0),
            recommendedDiscount: Number(
              prediction.recommended_discount ??
                product.recommended_discount ??
                0
            ),
            stock: Number(product.current_stock ?? 0),
            daysLeft: Number(product.days_left ?? 0),
            risk:
              product.waste_risk ??
              prediction.waste_risk_category ??
              "Unknown",
            wasteRiskScore:
              prediction.waste_risk_score ??
              product.waste_risk_score ??
              null,
            stockDate: product.stock_date ?? "",
            expiryDate: product.expiry_date ?? "",
            historicalSales: Number(product.historical_sales ?? 0),
            demandRate: Number(product.demand_rate ?? 0),
            salesVelocity: Number(product.sales_velocity ?? 0),
            expectedDemand: Number(product.expected_demand ?? 0),
            finalPrice: Number(
              prediction.final_price ??
                product.final_price ??
                product.selling_price ??
                0
            ),
            imagePreview: null,
          };
        });

        setProductList(mappedProducts);
        setTotalProducts(Number(data.total ?? products.length));
        setTotalPages(Number(data.total_pages ?? 1));

        if (data.page && data.page !== currentPage) {
          setCurrentPage(Number(data.page));
        }
      } catch (error) {
        console.error("Failed to load products:", error);
        setLoadError(error.message || "Failed to load products.");
        setProductList([]);
      } finally {
        setLoading(false);
      }
    }

    loadProducts();
  }, [currentPage, searchTerm, selectedCategory, selectedRisk, refreshVersion]);

  async function handleDelete(product) {
    const confirmed = window.confirm(
      `Delete "${product.name}"? This action cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    setDeletingProductId(product.id);

    try {
      await apiRequest(`/products/${product.id}`, {
        method: "DELETE",
      });

      setRefreshVersion((current) => current + 1);
    } catch (error) {
      console.error("Failed to delete product:", error);
      window.alert(
        error.message ||
          "Failed to delete product. Please try again."
      );
    } finally {
      setDeletingProductId(null);
    }
  }

  if (addingProduct) {
    return (
      <AddProduct
        onBack={() => setAddingProduct(false)}
        onSave={() => {
          setAddingProduct(false);
          setCurrentPage(1);
          setRefreshVersion((current) => current + 1);
        }}
      />
    );
  }

  if (editingProduct) {
    return (
      <EditProduct
        product={editingProduct}
        onBack={() => setEditingProduct(null)}
        onSave={() => {
          setEditingProduct(null);
          setRefreshVersion((current) => current + 1);
        }}
      />
    );
  }

  const pageNumbers = getPageNumbers(currentPage, totalPages);

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
          <option value="Dairy">Dairy</option>
          <option value="Bakery">Bakery</option>
          <option value="Fruits">Fruits</option>
          <option value="Vegetables">Vegetables</option>
          <option value="Beverages">Beverages</option>
          <option value="Snacks">Snacks</option>
          <option value="Ready_to_Eat">Ready to Eat</option>
          <option value="Meat">Meat</option>
          <option value="Seafood">Seafood</option>
          <option value="Deli">Deli</option>
          <option value="Frozen_Meals">Frozen Meals</option>
          <option value="Personal_Care">Personal Care</option>
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
              {totalProducts}{" "}
              {totalProducts === 1 ? "product" : "products"}
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
              {loading && (
                <tr>
                  <td colSpan="7" className="no-products-cell">
                    Loading products...
                  </td>
                </tr>
              )}

              {!loading && loadError && (
                <tr>
                  <td colSpan="7" className="no-products-cell">
                    {loadError}
                  </td>
                </tr>
              )}

              {!loading && !loadError && productList.map((product) => {
                const risk = String(
                  product.risk ?? "Unknown"
                );

                const riskClass = risk.toLowerCase();

                return (
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
                            String(product.name ?? "?")
                              .charAt(0)
                              .toUpperCase()
                          )}
                        </div>

                        <div>
                          <strong>
                            {product.name}
                          </strong>

                          <span>
                            Product #{product.id}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td>{product.category}</td>

                    <td>
                      <strong>
                        ₹
                        {Number(product.price ?? 0).toFixed(
                          2
                        )}
                      </strong>
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
                        {product.daysLeft === 1
                          ? "day"
                          : "days"}
                      </span>
                    </td>

                    <td>
                      <span
                        className={`risk-badge ${riskClass}`}
                      >
                        {risk}
                      </span>
                    </td>

                    <td>
                      <div className="product-row-actions">
                        <button
                          type="button"
                          className="edit-product-button"
                          onClick={() => setEditingProduct(product)}
                          disabled={deletingProductId === product.id}
                        >
                          <EditIcon />
                          <span>Edit</span>
                        </button>

                        <button
                          type="button"
                          className="delete-product-button"
                          onClick={() => handleDelete(product)}
                          disabled={deletingProductId === product.id}
                        >
                          <DeleteIcon />
                          <span>
                            {deletingProductId === product.id
                              ? "Deleting..."
                              : "Delete"}
                          </span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {!loading && productList.length === 0 && (
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

        {totalProducts > 0 && (
          <div className="pagination-controls">
            <button
              type="button"
              className="pagination-button pagination-arrow"
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              disabled={currentPage === 1 || loading}
            >
              Previous
            </button>

            <div className="pagination-pages">
              {pageNumbers.map((page, index) =>
                page === "..." ? (
                  <span key={`ellipsis-${index}`} className="pagination-ellipsis">
                    ...
                  </span>
                ) : (
                  <button
                    key={page}
                    type="button"
                    className={`pagination-button ${
                      currentPage === page ? "active" : ""
                    }`}
                    onClick={() => setCurrentPage(page)}
                    disabled={loading}
                  >
                    {page}
                  </button>
                )
              )}
            </div>

            <button
              type="button"
              className="pagination-button pagination-arrow"
              onClick={() =>
                setCurrentPage((page) => Math.min(totalPages, page + 1))
              }
              disabled={currentPage === totalPages || loading}
            >
              Next
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

export default AdminProducts;