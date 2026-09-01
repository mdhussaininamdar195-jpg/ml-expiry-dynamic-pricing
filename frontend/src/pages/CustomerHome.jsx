import { useState } from "react";
import "./CustomerHome.css";

const categories = ["All", "Dairy", "Bakery", "Produce", "Beverages"];

const products = [
  {
    id: 1,
    name: "Fresh Milk",
    category: "Dairy",
    size: "1 L",
    price: 48,
    originalPrice: 60,
    status: "Near expiry",
  },
  {
    id: 2,
    name: "Whole Wheat Bread",
    category: "Bakery",
    size: "400 g",
    price: 32,
    originalPrice: 40,
    status: "Near expiry",
  },
  {
    id: 3,
    name: "Plain Yogurt",
    category: "Dairy",
    size: "400 g",
    price: 35,
    originalPrice: 50,
    status: "Reduced price",
  },
  {
    id: 4,
    name: "Red Apples",
    category: "Produce",
    size: "1 kg",
    price: 110,
    originalPrice: 125,
    status: "Fresh",
  },
  {
    id: 5,
    name: "Orange Juice",
    category: "Beverages",
    size: "1 L",
    price: 85,
    originalPrice: 95,
    status: "Fresh",
  },
  {
    id: 6,
    name: "Cheddar Cheese",
    category: "Dairy",
    size: "200 g",
    price: 75,
    originalPrice: 90,
    status: "Reduced price",
  },
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
    Produce: (
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
      {icons[category]}
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

function CustomerHome() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [cartItems, setCartItems] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [purchaseComplete, setPurchaseComplete] = useState(false);
  const [lastPurchaseTotal, setLastPurchaseTotal] = useState(0);

  const filteredProducts = products.filter((product) => {
    const matchesCategory =
      selectedCategory === "All" ||
      product.category === selectedCategory;

    const matchesSearch = product.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    return matchesCategory && matchesSearch;
  });

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

  function handlePurchase() {
    if (cartItems.length === 0) {
      return;
    }

    const total = cartItems.reduce(
      (sum, product) => sum + product.price,
      0
    );

    setLastPurchaseTotal(total);
    setCartItems([]);
    setIsCartOpen(false);
    setPurchaseComplete(true);
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
            <svg viewBox="0 0 32 32" fill="none" aria-hidden="true">
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
              Browse nearby products with prices adjusted to help reduce
              unnecessary food waste.
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
                key={category}
                className={`category-button ${
                  selectedCategory === category ? "selected" : ""
                }`}
                onClick={() => setSelectedCategory(category)}
              >
                {category}
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
              {filteredProducts.length} products
            </span>
          </div>

          <div className="customer-product-grid">
            {filteredProducts.map((product) => {
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
                      <span>{product.category}</span>
                      <span>{product.size}</span>
                    </div>

                    <h3>{product.name}</h3>

                    <span
                      className={`product-status ${
                        product.status === "Near expiry"
                          ? "attention"
                          : product.status === "Reduced price"
                            ? "reduced"
                            : ""
                      }`}
                    >
                      {product.status}
                    </span>

                    <div className="product-purchase-row">
                      <div className="product-price">
                        <strong>₹{product.price}</strong>
                        <del>₹{product.originalPrice}</del>
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

          {filteredProducts.length === 0 && (
            <div className="empty-products">
              <strong>No products found</strong>
              <span>
                Try a different search or category.
              </span>
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
                  Add products from the catalogue to see them here.
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
                          {product.size} · {product.category}
                        </span>

                        <div className="cart-item-bottom">
                          <span className="cart-item-price">
                            ₹{product.price}
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
                    <strong>₹{cartTotal}</strong>
                  </div>

                  <span className="cart-note">
                    Purchase is simulated for this project.
                  </span>

                  <button
                    type="button"
                    className="purchase-button"
                    onClick={handlePurchase}
                  >
                    Purchase
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
              <strong>₹{lastPurchaseTotal}</strong>
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