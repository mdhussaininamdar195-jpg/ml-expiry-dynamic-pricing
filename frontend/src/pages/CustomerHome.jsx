import { useEffect, useState } from "react";
import "./CustomerHome.css";
import { apiRequest } from "../services/api";

const categories = [
  { label: "All", value: "All" },
  { label: "Dairy", value: "Dairy" },
  { label: "Bakery", value: "Bakery" },
  { label: "Fruits", value: "Fruits" },
  { label: "Vegetables", value: "Vegetables" },
  { label: "Beverages", value: "Beverages" },
  { label: "Snacks", value: "Snacks" },
  { label: "Ready to Eat", value: "Ready_to_Eat" },
  { label: "Meat", value: "Meat" },
  { label: "Seafood", value: "Seafood" },
  { label: "Deli", value: "Deli" },
  { label: "Frozen Meals", value: "Frozen_Meals" },
  { label: "Personal Care", value: "Personal_Care" },
];

function ProductIcon({ category }) {
  const icons = {
    Dairy: (
      <>
        <path d="M9 4h6" />
        <path d="M10 4v3l-2 3v9h8v-9l-2-3V4" />
        <path d="M8 11h8" />
      </>
    ),

    Bakery: (
      <>
        <path d="M5 10h14v9H5z" />
        <path d="M7 10c0-3 2-5 5-5s5 2 5 5" />
        <path d="M9 14h6" />
      </>
    ),

    Fruits: (
      <>
        <path d="M12 20c-4-2-6-5-5-9 4-.5 7 2 5 9Z" />
        <path d="M12 20c4-2 6-5 5-9-4-.5-7 2-5 9Z" />
        <path d="M12 11c0-3 2-5 5-6" />
      </>
    ),

    Vegetables: (
      <>
        <path d="M12 20c-4-2-6-5-5-9 4-.5 7 2 5 9Z" />
        <path d="M12 20c4-2 6-5 5-9-4-.5-7 2-5 9Z" />
        <path d="M12 11c0-3 2-5 5-6" />
      </>
    ),

    Beverages: (
      <>
        <path d="M8 4h8" />
        <path d="M9 4l1 16h4l1-16" />
        <path d="M10 9h4" />
      </>
    ),

    Snacks: (
      <>
        <path d="M7 5h10l-1 14H8L7 5Z" />
        <path d="M9 5V3h6v2" />
        <path d="M9 10h6" />
      </>
    ),

    Ready_to_Eat: (
      <>
        <path d="M5 8h14v11H5z" />
        <path d="M8 8V5h8v3" />
        <path d="M8 12h8" />
      </>
    ),

    Meat: (
      <>
        <path d="M6 14c0-4 3-7 7-7 3 0 5 2 5 5 0 4-3 7-7 7-3 0-5-2-5-5Z" />
        <circle cx="15.5" cy="12" r="1" />
      </>
    ),

    Seafood: (
      <>
        <path d="M4 12c3-5 9-6 16-2-2 5-7 7-12 5l-4 2 2-5-2-0Z" />
        <circle cx="16" cy="11" r="1" />
      </>
    ),

    Deli: (
      <>
        <path d="M5 8h14v11H5z" />
        <path d="M8 8V5h8v3" />
        <path d="M8 12h8" />
      </>
    ),

    Frozen_Meals: (
      <>
        <path d="M6 6h12v13H6z" />
        <path d="M9 10h6" />
        <path d="M9 14h6" />
      </>
    ),

    Personal_Care: (
      <>
        <path d="M9 4h6" />
        <path d="M10 4v4l-2 3v8h8v-8l-2-3V4" />
      </>
    ),
  };

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {icons[category] || (
        <>
          <rect x="6" y="6" width="12" height="13" rx="2" />
          <path d="M9 10h6M9 14h6" />
        </>
      )}
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

function CartIcon() {
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
      <path d="M4 5h2l1.5 10h10L20 8H7" />
      <circle cx="9" cy="19" r="1" />
      <circle cx="17" cy="19" r="1" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m5 12 4 4L19 6" />
    </svg>
  );
}

function getPageNumbers(currentPage, totalPages) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages = [1];
  if (currentPage > 4) pages.push("...");

  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);
  for (let page = start; page <= end; page += 1) {
    if (!pages.includes(page)) pages.push(page);
  }

  if (currentPage < totalPages - 3) pages.push("...");
  pages.push(totalPages);
  return pages;
}

function CustomerHome() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [cartItems, setCartItems] = useState([]);
  const [products, setProducts] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [purchaseComplete, setPurchaseComplete] = useState(false);
  const [lastPurchaseTotal, setLastPurchaseTotal] = useState(0);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [refreshVersion, setRefreshVersion] = useState(0);
  const [purchaseError, setPurchaseError] = useState("");
  const [isPurchasing, setIsPurchasing] = useState(false);

  const PAGE_SIZE = 20;

  useEffect(() => {
    const timer = setTimeout(() => setCurrentPage(1), 300);
    return () => clearTimeout(timer);
  }, [searchTerm, selectedCategory]);

  useEffect(() => {
    async function loadProducts() {
      setLoading(true);
      setLoadError("");

      try {
        const params = new URLSearchParams({
          page: String(currentPage),
          page_size: String(PAGE_SIZE),
        });

        if (searchTerm.trim()) params.set("search", searchTerm.trim());
        if (selectedCategory !== "All") {
          params.set("category", selectedCategory);
        }

        const data = await apiRequest(`/products?${params.toString()}`);
        const pageProducts = Array.isArray(data) ? data : data.products ?? [];

        const mappedProducts = pageProducts.map((product) => {
          const prediction = product.prediction ?? {};
          const daysLeft = Number(product.days_left ?? 0);
          const finalPrice = Number(
            prediction.final_price ??
              product.final_price ??
              product.selling_price ??
              0
          );
          const originalPrice = Number(product.selling_price ?? 0);
          const recommendedDiscount = Number(
            prediction.recommended_discount ??
              product.recommended_discount ??
              0
          );

          let status = "";
          if (recommendedDiscount > 50) status = "Great deal";
          else if (recommendedDiscount >= 16) status = "Reduced price";
          else if (recommendedDiscount > 0) status = "Small saving";

          return {
            id: product.id,
            name: product.product_name ?? "",
            category: product.category ?? "Unknown",
            size: "",
            price: finalPrice,
            originalPrice,
            recommendedDiscount,
            isDiscounted: recommendedDiscount > 0 && finalPrice < originalPrice,
            status,
            daysLeft,
            stock: Number(product.current_stock ?? 0),
          };
        });

        setProducts(mappedProducts);
        setTotalProducts(Number(data.total ?? pageProducts.length));
        setTotalPages(Number(data.total_pages ?? 1));

        if (data.page && data.page !== currentPage) {
          setCurrentPage(Number(data.page));
        }
      } catch (error) {
        console.error("Failed to load customer products:", error);
        setLoadError(error.message || "Failed to load products.");
        setProducts([]);
      } finally {
        setLoading(false);
      }
    }

    loadProducts();
  }, [currentPage, searchTerm, selectedCategory, refreshVersion]);

  const pageNumbers = getPageNumbers(currentPage, totalPages);

  function handleBuy(product) {
    setCartItems((currentItems) => {
      if (currentItems.some((item) => item.id === product.id)) {
        return currentItems;
      }

      return [...currentItems, product];
    });
  }

  function handleRemove(productId) {
    setCartItems((currentItems) =>
      currentItems.filter((item) => item.id !== productId)
    );
  }

  async function handlePurchase() {
    if (cartItems.length === 0 || isPurchasing) {
      return;
    }

    setPurchaseError("");
    setIsPurchasing(true);

    try {
      const purchaseResults = [];

      for (const product of cartItems) {
        const response = await apiRequest(
          `/products/${product.id}/purchase`,
          {
            method: "POST",
            body: JSON.stringify({ quantity: 1 }),
          }
        );

        purchaseResults.push(response);
      }

      const total = purchaseResults.reduce(
        (sum, purchase) =>
          sum + Number(purchase.total_amount ?? 0),
        0
      );

      setLastPurchaseTotal(total);
      setCartItems([]);
      setIsCartOpen(false);
      setPurchaseComplete(true);

      // Reload the same page so stock and the newly recalculated
      // ML price are visible immediately.
      setRefreshVersion((current) => current + 1);
    } catch (error) {
      console.error("Failed to complete purchase:", error);
      setPurchaseError(
        error.message ||
          "Purchase failed. Please try again."
      );
    } finally {
      setIsPurchasing(false);
    }
  }

  const cartTotal = cartItems.reduce(
    (total, product) => total + product.price,
    0
  );

  return (
    <div className="customer-page">
      <header className="customer-header">
        <div className="customer-brand">
          <div className="customer-brand-mark">
            <svg
              viewBox="0 0 32 32"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M16 4c-5.8 2.2-9 6.1-9 11.3C7 21.2 10.8 26 16 28c5.2-2 9-6.8 9-12.7C25 10.1 21.8 6.2 16 4Z"
                fill="currentColor"
              />
              <path
                d="M16 8c-.2 5.6-.1 11.6 0 16"
                stroke="white"
                strokeWidth="1.7"
                strokeLinecap="round"
              />
            </svg>
          </div>

          <div>
            <strong>FreshFlow</strong>
            <span>Local groceries</span>
          </div>
        </div>

        <div className="store-selector">
          <span className="store-dot" />

          <div>
            <span>Shopping from</span>
            <strong>Nearby Store</strong>
          </div>

          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="m7 10 5 5 5-5" />
          </svg>
        </div>

        <div className="customer-actions">
          <button
            className="customer-icon-button"
            aria-label="Search"
          >
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
          </button>

          <button
            className="cart-button"
            aria-label="Shopping cart"
            onClick={() => setIsCartOpen(true)}
          >
            <CartIcon />
            <span>{cartItems.length}</span>
          </button>
        </div>
      </header>

      <main className="customer-main">
        <section className="customer-intro">
          <div>
            <span className="customer-eyebrow">
              FreshFlow Market
            </span>

            <h1>Good groceries, better value.</h1>

            <p>
              Browse nearby products with prices adjusted to help
              reduce unnecessary food waste.
            </p>
          </div>
        </section>

        <section className="shopping-toolbar">
          <div className="search-box">
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

            <input
              type="search"
              placeholder="Search groceries"
              aria-label="Search groceries"
              value={searchTerm}
              onChange={(event) =>
                setSearchTerm(event.target.value)
              }
            />
          </div>

          <div className="category-list">
            {categories.map((category) => (
              <button
                key={category.value}
                className={`category-button ${
                  selectedCategory === category.value
                    ? "selected"
                    : ""
                }`}
                onClick={() =>
                  setSelectedCategory(category.value)
                }
              >
                {category.label}
              </button>
            ))}
          </div>
        </section>

        <section className="product-section">
          <div className="product-section-header">
            <div>
              <span className="customer-eyebrow">
                Available nearby
              </span>

              <h2>Groceries</h2>
            </div>

            <span className="product-count">
              {totalProducts}{" "}
              {totalProducts === 1 ? "product" : "products"}
            </span>
          </div>

          {loading && (
            <div className="empty-products">
              <strong>Loading products...</strong>
              <span>Please wait while the catalogue loads.</span>
            </div>
          )}

          {!loading && loadError && (
            <div className="empty-products">
              <strong>Unable to load products</strong>
              <span>{loadError}</span>
            </div>
          )}

          {!loading && !loadError && (
            <div className="customer-product-grid">
              {products.map((product) => {
              const isAdded = cartItems.some(
                (item) => item.id === product.id
              );

              return (
                <article
                  className="customer-product-card"
                  key={product.id}
                >
                  <div className="product-image">
                    <ProductIcon category={product.category} />
                  </div>

                  <div className="customer-product-content">
                    <div className="product-meta">
                      <span>
                        {product.category.replaceAll("_", " ")}
                      </span>

                    </div>

                    <h3>{product.name}</h3>

                    {product.status && (
                      <span
                        className={`product-status ${
                          product.status === "Reduced price"
                            ? "reduced"
                            : product.status === "Small saving"
                              ? "small-saving"
                              : product.status === "Great deal"
                                ? "strong-deal"
                                : ""
                        }`}
                      >
                        {product.status}
                      </span>
                    )}

                    <div className="product-purchase-row">
                      <div className="product-price">
                        <strong>
                          ₹{Number(product.price).toFixed(2)}
                        </strong>

                        {product.isDiscounted && (
                          <del>
                            ₹{Number(product.originalPrice).toFixed(2)}
                          </del>
                        )}
                      </div>

                      <button
                        className={`buy-button ${
                          isAdded ? "added" : ""
                        }`}
                        onClick={() => handleBuy(product)}
                        disabled={isAdded}
                      >
                        {isAdded ? "Added" : "Buy"}
                      </button>
                    </div>
                  </div>
                </article>
              );
              })}
            </div>
          )}

          {!loading && !loadError && products.length === 0 && (
            <div className="empty-products">
              <strong>No products found</strong>
              <span>Try a different search or category.</span>
            </div>
          )}

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
                      className={`pagination-button ${currentPage === page ? "active" : ""}`}
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
                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                disabled={currentPage === totalPages || loading}
              >
                Next
              </button>
            </div>
          )}

        </section>
      </main>

      {isCartOpen && (
        <div
          className="cart-overlay"
          onClick={() => setIsCartOpen(false)}
        >
          <aside
            className="cart-panel"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="cart-header">
              <div className="cart-header-content">
                <strong>Shopping cart</strong>

                <span>
                  {cartItems.length}{" "}
                  {cartItems.length === 1 ? "item" : "items"}
                </span>
              </div>

              <button
                type="button"
                className="cart-close-button"
                aria-label="Close cart"
                onClick={() => setIsCartOpen(false)}
              >
                <CloseIcon />
              </button>
            </div>

            {cartItems.length === 0 ? (
              <div className="cart-empty">
                <div className="cart-empty-icon">
                  <CartIcon />
                </div>

                <strong>Your cart is empty</strong>

                <span>
                  Add products from the catalogue to see them
                  here.
                </span>
              </div>
            ) : (
              <>
                <div className="cart-items">
                  {cartItems.map((product) => (
                    <div
                      className="cart-item"
                      key={product.id}
                    >
                      <div className="cart-item-image">
                        <ProductIcon
                          category={product.category}
                        />
                      </div>

                      <div className="cart-item-content">
                        <strong>{product.name}</strong>

                        <span>
                          {product.category.replaceAll("_", " ")}
                        </span>

                        <div className="cart-item-bottom">
                          <span className="cart-item-price">
                            ₹{Number(product.price).toFixed(2)}
                          </span>

                          <button
                            type="button"
                            className="cart-remove-button"
                            onClick={() =>
                              handleRemove(product.id)
                            }
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="cart-footer">
                  <div className="cart-subtotal">
                    <span>Subtotal</span>

                    <strong>
                      ₹{Number(cartTotal).toFixed(2)}
                    </strong>
                  </div>

                  <span className="cart-note">
                    Purchase is simulated for this project.
                  </span>

                  {purchaseError && (
                    <span className="cart-note">
                      {purchaseError}
                    </span>
                  )}

                  <button
                    type="button"
                    className="purchase-button"
                    onClick={handlePurchase}
                    disabled={isPurchasing}
                  >
                    {isPurchasing ? "Processing..." : "Purchase"}
                  </button>
                </div>
              </>
            )}
          </aside>
        </div>
      )}

      {purchaseComplete && (
        <div className="purchase-success-overlay">
          <div className="purchase-success-card">
            <div className="purchase-success-icon">
              <CheckIcon />
            </div>

            <span className="purchase-success-eyebrow">
              Purchase complete
            </span>

            <h2>Thank you for your purchase.</h2>

            <p>
              Your order has been recorded successfully.
            </p>

            <div className="purchase-success-summary">
              <span>Total paid</span>

              <strong>
                ₹{Number(lastPurchaseTotal).toFixed(2)}
              </strong>
            </div>

            <button
              type="button"
              className="purchase-success-button"
              onClick={() => setPurchaseComplete(false)}
            >
              Continue shopping
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default CustomerHome;