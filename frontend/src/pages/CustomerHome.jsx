import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./CustomerHome.css";

import { apiRequest } from "../services/api";

const categories = [
  { label: "All", value: "All" },
  { label: "Dairy", value: "Dairy" },
  { label: "Bakery", value: "Bakery" },
  { label: "Fruits", value: "Fruits" },
  { label: "Vegetables", value: "Vegetables" },
  { label: "Produce", value: "Produce" },
  { label: "Beverages", value: "Beverages" },
  { label: "Snacks", value: "Snacks" },
  { label: "Ready to Eat", value: "Ready to Eat" },
  { label: "Meat", value: "Meat" },
  { label: "Seafood", value: "Seafood" },
  { label: "Deli", value: "Deli" },
  { label: "Frozen Meals", value: "Frozen Meals" },
  { label: "Personal Care", value: "Personal Care" },
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

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="8" r="3.2" />
      <path d="M5.5 20c.8-3.6 3-5.4 6.5-5.4s5.7 1.8 6.5 5.4" />
    </svg>
  );
}

function CategoryArrow({ direction = "right" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {direction === "left" ? <path d="m15 18-6-6 6-6" /> : <path d="m9 18 6-6-6-6" />}
    </svg>
  );
}


const LEGACY_CART_KEY = "dailycart_cart";
const CART_KEY_PREFIX = "dailycart_cart_user_";

function getCurrentCartStorageKey() {
  try {
    const token = localStorage.getItem("access_token");

    if (!token) {
      return `${CART_KEY_PREFIX}guest`;
    }

    // The JWT subject is the authenticated user's stable ID.
    // Using the user ID instead of the email/token keeps the cart
    // stable for that account across page refreshes and logins.
    const parts = token.split(".");
    if (parts.length >= 2) {
      const payload = JSON.parse(
        decodeURIComponent(
          atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"))
            .split("")
            .map((char) =>
              `%${`00${char.charCodeAt(0).toString(16)}`.slice(-2)}`
            )
            .join("")
        )
      );

      if (payload?.sub !== undefined && payload?.sub !== null) {
        return `${CART_KEY_PREFIX}${String(payload.sub)}`;
      }
    }

    // Fallback if the token cannot be decoded.
    return `${CART_KEY_PREFIX}${token}`;
  } catch (error) {
    console.error("Failed to determine cart account:", error);
    return `${CART_KEY_PREFIX}guest`;
  }
}

function readStoredCart() {
  try {
    const accountCartKey = getCurrentCartStorageKey();
    const savedAccountCart = localStorage.getItem(accountCartKey);

    if (savedAccountCart) {
      const parsed = JSON.parse(savedAccountCart);
      return Array.isArray(parsed) ? parsed : [];
    }

    // Migrate the cart created by the older global-cart version.
    // This happens only once for the account currently logged in.
    const legacyCart = localStorage.getItem(LEGACY_CART_KEY);
    if (legacyCart) {
      const parsedLegacyCart = JSON.parse(legacyCart);

      if (Array.isArray(parsedLegacyCart) && parsedLegacyCart.length > 0) {
        localStorage.setItem(accountCartKey, JSON.stringify(parsedLegacyCart));
        localStorage.removeItem(LEGACY_CART_KEY);
        return parsedLegacyCart;
      }

      localStorage.removeItem(LEGACY_CART_KEY);
    }

    return [];
  } catch (error) {
    console.error("Failed to restore account cart:", error);
    return [];
  }
}

function CustomerHome() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [cartItems, setCartItems] = useState(() => readStoredCart());
  const [products, setProducts] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [purchaseComplete, setPurchaseComplete] = useState(false);
  const [lastPurchaseTotal, setLastPurchaseTotal] = useState(0);
  const [showSplash, setShowSplash] = useState(true);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [refreshVersion, setRefreshVersion] = useState(0);
  const [purchaseError, setPurchaseError] = useState("");
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [detailImageIndex, setDetailImageIndex] = useState(0);
  const requestIdRef = useRef(0);
  const categoryListRef = useRef(null);

  const PAGE_SIZE = 20;

  useEffect(() => {
    try {
      const cartStorageKey = getCurrentCartStorageKey();
      localStorage.setItem(cartStorageKey, JSON.stringify(cartItems));

      // Remove the old global key so a different account can never
      // accidentally inherit this account's cart.
      localStorage.removeItem(LEGACY_CART_KEY);
    } catch (error) {
      console.error("Failed to save account cart:", error);
    }
  }, [cartItems]);

  useEffect(() => {
    const savedTheme = localStorage.getItem("dailycart_theme");
    document.documentElement.dataset.theme = savedTheme === "dark" ? "dark" : "light";

    const timer = window.setTimeout(() => setShowSplash(false), 850);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadProducts() {
      const requestId = ++requestIdRef.current;
      setLoading(true);
      setLoadError("");

      try {
        const params = new URLSearchParams({
          page: String(currentPage),
          page_size: String(PAGE_SIZE),
        });

        const normalizedSearch = searchTerm.trim();
        if (normalizedSearch) {
          params.set("search", normalizedSearch);
        }

        if (selectedCategory !== "All") {
          // Send the exact category value represented by the UI.
          // The backend normalizes spaces/underscores/hyphens.
          params.set("category", selectedCategory.trim());
        }

        const data = await apiRequest(
          `/products/customer?${params.toString()}`
        );

        if (cancelled || requestId !== requestIdRef.current) return;

        const pageProducts = Array.isArray(data)
          ? data
          : Array.isArray(data?.products)
            ? data.products
            : [];

        const mappedProducts = pageProducts.map((product) => {
          const prediction = product.prediction ?? {};

          const finalPrice = Number(
            prediction.final_price ??
              product.final_price ??
              product.selling_price ??
              0
          );

          const originalPrice = Number(
            product.selling_price ?? 0
          );

          const recommendedDiscount = Number(
            prediction.recommended_discount ??
              product.recommended_discount ??
              0
          );

          let status = "";

          if (recommendedDiscount > 50) {
            status = "Great deal";
          } else if (recommendedDiscount >= 16) {
            status = "Reduced price";
          } else if (recommendedDiscount > 0) {
            status = "Small saving";
          }

          return {
            id: product.id,
            name: product.product_name ?? "",
            category: product.category ?? "Unknown",
            size: "",
            price: finalPrice,
            originalPrice,
            recommendedDiscount,
            isDiscounted:
              recommendedDiscount > 0 &&
              finalPrice < originalPrice,
            status,
            stock: Number(product.current_stock ?? 0),
            shelfLifeDays: Number.isFinite(Number(product.shelf_life_days))
              ? Number(product.shelf_life_days)
              : null,
            imageData: product.image_data ?? null,
            images: Array.isArray(product.images)
              ? product.images.filter(Boolean)
              : product.image_data
                ? [product.image_data]
                : [],
          };
        });

        setProducts(mappedProducts);

        const serverTotal = Number(
          data?.total ?? mappedProducts.length
        );

        const serverPageSize = Number(
          data?.page_size ?? PAGE_SIZE
        );

        const serverTotalPages = Number(
          data?.total_pages ??
            Math.ceil(serverTotal / serverPageSize)
        );

        setTotalProducts(
          Number.isFinite(serverTotal)
            ? serverTotal
            : mappedProducts.length
        );

        setTotalPages(
          Math.max(
            1,
            Number.isFinite(serverTotalPages)
              ? serverTotalPages
              : Math.ceil(serverTotal / PAGE_SIZE)
          )
        );

        if (
          data?.page &&
          Number(data.page) !== currentPage
        ) {
          setCurrentPage(Number(data.page));
        }
      } catch (error) {
        if (cancelled || requestId !== requestIdRef.current) return;

        console.error(
          "Failed to load customer products:",
          error
        );

        setLoadError(
          error.message ||
            "Failed to load products."
        );

        setProducts([]);
        setTotalProducts(0);
        setTotalPages(1);
      } finally {
        if (!cancelled && requestId === requestIdRef.current) {
          setLoading(false);
        }
      }
    }

    loadProducts();

    return () => {
      cancelled = true;
    };
  }, [
    currentPage,
    searchTerm,
    selectedCategory,
    refreshVersion,
  ]);

  const pageNumbers = getPageNumbers(currentPage, totalPages);

  function openProductDetails(product) {
    setSelectedProduct(product);
    setDetailImageIndex(0);
  }

  function closeProductDetails() {
    setSelectedProduct(null);
    setDetailImageIndex(0);
  }

  function getProductImages(product) {
    if (!product) return [];
    if (Array.isArray(product.images) && product.images.length > 0) return product.images;
    return product.imageData ? [product.imageData] : [];
  }

  function getCartQuantity(productId) {
    const item = cartItems.find((cartItem) => cartItem.id === productId);
    return item ? Number(item.quantity ?? 1) : 0;
  }

  function handleBuy(product) {
    const stock = Number(product.stock ?? 0);

    if (stock <= 0) {
      return;
    }

    setCartItems((currentItems) => {
      const existingItem = currentItems.find(
        (item) => item.id === product.id
      );

      if (existingItem) {
        const nextQuantity = Math.min(
          Number(existingItem.quantity ?? 1) + 1,
          stock
        );

        return currentItems.map((item) =>
          item.id === product.id
            ? { ...item, quantity: nextQuantity }
            : item
        );
      }

      return [...currentItems, { ...product, quantity: 1 }];
    });
  }

  function handleBuyNow(product) {
    const stock = Number(product.stock ?? 0);

    if (stock <= 0) {
      return;
    }

    setCartItems((currentItems) => {
      const existingItem = currentItems.find(
        (item) => item.id === product.id
      );

      if (existingItem) {
        return currentItems;
      }

      return [...currentItems, { ...product, quantity: 1 }];
    });

    setIsCartOpen(true);
  }

  function updateCartQuantity(product, nextQuantity) {
    const stock = Number(product.stock ?? 0);
    const safeQuantity = Math.max(
      0,
      Math.min(Number(nextQuantity) || 0, stock)
    );

    if (safeQuantity === 0) {
      handleRemove(product.id);
      return;
    }

    setCartItems((currentItems) =>
      currentItems.map((item) =>
        item.id === product.id
          ? { ...item, quantity: safeQuantity }
          : item
      )
    );
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

    if (!localStorage.getItem("access_token")) {
      navigate("/login", { state: { from: "/customer" } });
      return;
    }

    setPurchaseError("");
    setIsPurchasing(true);

    try {
      const purchaseResults = [];

      for (const product of cartItems) {
        const quantity = Number(product.quantity ?? 1);

        const response = await apiRequest(
          `/products/${product.id}/purchase`,
          {
            method: "POST",
            body: JSON.stringify({ quantity }),
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
    (total, product) =>
      total +
      Number(product.price ?? 0) *
        Number(product.quantity ?? 1),
    0
  );

  const cartItemCount = cartItems.reduce(
    (total, product) =>
      total + Number(product.quantity ?? 1),
    0
  );

  function scrollCategories(direction) {
    categoryListRef.current?.scrollBy({
      left: direction === "left" ? -260 : 260,
      behavior: "smooth",
    });
  }

  return (
    <>
      {showSplash && (
        <div className="dailycart-splash" aria-label="Opening DailyCart">
          <div className="dailycart-splash-logo">D</div>
          <strong>DailyCart</strong>
          <span>Smart groceries, better value.</span>
        </div>
      )}
      <div className="customer-page">
      <header className="customer-header">
        <div className="customer-brand">
          <div>
            <strong>DailyCart</strong>
            <span>Smart groceries, better value.</span>
          </div>
        </div>

        <div className="store-selector">
          <span className="store-dot" />

          <div>
            <span>Shopping from</span>
            <strong>Nearby Store</strong>
          </div>
        </div>

        <div className="customer-actions">
          <button
            type="button"
            className="dailycart-profile-button"
            onClick={() => navigate(localStorage.getItem("access_token") ? "/account" : "/login")}
            aria-label={localStorage.getItem("access_token") ? "Open account settings" : "Login"}
          >
            {localStorage.getItem("access_token") ? <UserIcon /> : "Login"}
          </button>

          <button
            className="cart-button"
            aria-label="Shopping cart"
            onClick={() => setIsCartOpen(true)}
          >
            <CartIcon />
            <span>{cartItemCount}</span>
          </button>
        </div>
      </header>

      <main className="customer-main">
        <section className="customer-intro">
          <div>
            <span className="customer-eyebrow">
              DailyCart
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
              onChange={(event) => {
                setCurrentPage(1);
                setSearchTerm(event.target.value);
              }}
            />
          </div>

          <div className="category-scroller">
            <button
              type="button"
              className="category-scroll-button category-scroll-left"
              onClick={() => scrollCategories("left")}
              aria-label="Scroll categories left"
            >
              <CategoryArrow direction="left" />
            </button>

            <div className="category-list" ref={categoryListRef}>
              {categories.map((category) => (
                <button
                  type="button"
                  key={category.value}
                  className={`category-button ${
                    selectedCategory === category.value ? "selected" : ""
                  }`}
                  onClick={() => {
                    setCurrentPage(1);
                    setSelectedCategory(category.value);
                  }}
                >
                  {category.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              className="category-scroll-button category-scroll-right"
              onClick={() => scrollCategories("right")}
              aria-label="Scroll categories right"
            >
              <CategoryArrow direction="right" />
            </button>
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
                const quantity = getCartQuantity(product.id);
                const stock = Number(product.stock ?? 0);
                const isLowStock = stock > 0 && stock < 5;
                const isExpanded = selectedProduct?.id === product.id;

                const productImages = getProductImages(product);
                const activeProductImage =
                  productImages[detailImageIndex] || productImages[0];

                const shelfLifeText =
                  product.shelfLifeDays != null &&
                  product.shelfLifeDays >= 0
                    ? `${product.shelfLifeDays} days shelf life`
                    : "";

                return (
                  <article
                    className={`customer-product-card ${isExpanded ? "is-expanded" : ""}`}
                    key={product.id}
                    onClick={() => {
                      if (isExpanded) {
                        closeProductDetails();
                      } else {
                        openProductDetails(product);
                      }
                    }}
                  >
                    {!isExpanded ? (
                      <>
                        <div className="product-image">
                          {product.imageData ? (
                            <img
                              src={product.imageData}
                              alt={product.name}
                            />
                          ) : (
                            <ProductIcon category={product.category} />
                          )}
                        </div>

                        <div className="customer-product-content">
                          <div className="product-meta">
                            <span>
                              {String(product.category || "Unknown")
                                .replace(/[_-]+/g, " ")}
                            </span>
                          </div>

                          <h3 title={product.name}>{product.name}</h3>

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

                          {isLowStock && (
                            <span className="low-stock-badge">
                              Only {stock} left
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

                            {quantity > 0 ? (
                              <div
                                className="quantity-control"
                                aria-label={`Quantity for ${product.name}`}
                              >
                                <button
                                  type="button"
                                  className="quantity-button"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    updateCartQuantity(product, quantity - 1);
                                  }}
                                  aria-label={`Decrease ${product.name} quantity`}
                                >
                                  −
                                </button>

                                <span className="quantity-value">
                                  {quantity}
                                </span>

                                <button
                                  type="button"
                                  className="quantity-button"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    updateCartQuantity(product, quantity + 1);
                                  }}
                                  disabled={quantity >= stock}
                                  aria-label={`Increase ${product.name} quantity`}
                                >
                                  +
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                className="buy-button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  handleBuy(product);
                                }}
                                disabled={stock <= 0}
                              >
                                {stock <= 0 ? "Out of stock" : "Add"}
                              </button>
                            )}
                          </div>
                        </div>
                      </>
                    ) : (
                      <div
                        className="product-expanded-panel"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <div className="product-expanded-gallery">
                          <div className="product-expanded-main-image">
                            {activeProductImage ? (
                              <img
                                src={activeProductImage}
                                alt={product.name}
                              />
                            ) : (
                              <ProductIcon category={product.category} />
                            )}

                            {productImages.length > 1 && (
                              <>
                                <button
                                  type="button"
                                  className="gallery-arrow gallery-arrow-left"
                                  onClick={() =>
                                    setDetailImageIndex((index) =>
                                      index === 0
                                        ? productImages.length - 1
                                        : index - 1
                                    )
                                  }
                                  aria-label="Previous product image"
                                >
                                  ‹
                                </button>

                                <button
                                  type="button"
                                  className="gallery-arrow gallery-arrow-right"
                                  onClick={() =>
                                    setDetailImageIndex(
                                      (index) =>
                                        (index + 1) % productImages.length
                                    )
                                  }
                                  aria-label="Next product image"
                                >
                                  ›
                                </button>
                              </>
                            )}

                            {productImages.length > 1 && (
                              <div className="product-image-slide-dots">
                                {productImages.map((_, index) => (
                                  <button
                                    key={index}
                                    type="button"
                                    className={
                                      index === detailImageIndex
                                        ? "active"
                                        : ""
                                    }
                                    onClick={() => setDetailImageIndex(index)}
                                    aria-label={`Show product image ${index + 1}`}
                                  />
                                ))}
                              </div>
                            )}
                          </div>

                          {productImages.length > 1 && (
                            <div className="product-detail-thumbnails">
                              {productImages.map((image, index) => (
                                <button
                                  type="button"
                                  key={`${image}-${index}`}
                                  className={`product-detail-thumbnail ${
                                    index === detailImageIndex ? "active" : ""
                                  }`}
                                  onClick={() => setDetailImageIndex(index)}
                                  aria-label={`View product image ${index + 1}`}
                                >
                                  <img src={image} alt="" />
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="product-expanded-content">
                          <div className="product-expanded-heading">
                            <div>
                              <span className="product-expanded-category">
                                {String(product.category || "Unknown")
                                  .replace(/[_-]+/g, " ")}
                              </span>

                              <h4>{product.name}</h4>

                              {product.status && (
                                <span
                                  className={`product-status product-expanded-status ${
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

                              {shelfLifeText && (
                                <span className="product-expanded-shelf-life">
                                  <span className="shelf-life-dot" aria-hidden="true" />
                                  {shelfLifeText}
                                </span>
                              )}
                            </div>

                            <button
                              type="button"
                              className="product-expanded-close"
                              onClick={closeProductDetails}
                              aria-label="Close product details"
                            >
                              <CloseIcon />
                            </button>
                          </div>

                          <div className="product-expanded-price-row">
                            <strong>
                              ₹{Number(product.price).toFixed(2)}
                            </strong>

                            {product.isDiscounted && (
                              <del>
                                ₹{Number(product.originalPrice).toFixed(2)}
                              </del>
                            )}

                            {product.recommendedDiscount > 0 && (
                              <span className="product-expanded-saving">
                                Save{" "}
                                {Number(product.recommendedDiscount).toFixed(0)}
                                %
                              </span>
                            )}
                          </div>

                          {product.recommendedDiscount > 0 && (
                            <div className="product-expanded-offer">
                              <span>Deal</span>
                              <strong>
                                {Number(product.recommendedDiscount).toFixed(0)}%
                                saving
                              </strong>
                            </div>
                          )}

                          {isLowStock && (
                            <div className="product-expanded-stock-note">
                              Only {stock} units left
                            </div>
                          )}

                          <p className="product-expanded-description">
                            DailyCart adjusts prices based on inventory and
                            freshness, helping you save while reducing
                            unnecessary food waste.
                          </p>

                          <div className="product-expanded-actions">
                            {quantity > 0 ? (
                              <>
                                <div
                                  className="quantity-control product-expanded-quantity"
                                  aria-label={`Quantity for ${product.name}`}
                                >
                                  <button
                                    type="button"
                                    className="quantity-button"
                                    onClick={() =>
                                      updateCartQuantity(product, quantity - 1)
                                    }
                                    aria-label={`Decrease ${product.name} quantity`}
                                  >
                                    −
                                  </button>

                                  <span className="quantity-value">
                                    {quantity}
                                  </span>

                                  <button
                                    type="button"
                                    className="quantity-button"
                                    onClick={() =>
                                      updateCartQuantity(product, quantity + 1)
                                    }
                                    disabled={quantity >= stock}
                                    aria-label={`Increase ${product.name} quantity`}
                                  >
                                    +
                                  </button>
                                </div>

                                <button
                                  type="button"
                                  className="product-detail-buy-now-button"
                                  disabled={stock <= 0}
                                  onClick={() => handleBuyNow(product)}
                                >
                                  Buy Now
                                </button>
                              </>
                            ) : (
                              <button
                                type="button"
                                className="product-detail-add-button product-expanded-cart-button"
                                disabled={stock <= 0}
                                onClick={() => handleBuy(product)}
                              >
                                {stock <= 0 ? "Out of stock" : "Add to cart"}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
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
                  {cartItems.map((product) => {
                    const quantity = Number(product.quantity ?? 1);
                    const stock = Number(product.stock ?? 0);
                    const lineTotal =
                      Number(product.price ?? 0) * quantity;

                    return (
                      <div className="cart-item" key={product.id}>
                        <div className="cart-item-image">
                          {product.imageData ? (
                            <img
                              src={product.imageData}
                              alt={product.name}
                            />
                          ) : (
                            <ProductIcon category={product.category} />
                          )}
                        </div>

                        <div className="cart-item-content">
                          <strong title={product.name}>
                            {product.name}
                          </strong>

                          <span>
                            {String(product.category || "Unknown")
                              .replace(/[_-]+/g, " ")}
                          </span>

                          <div className="cart-item-middle">
                            <span className="cart-item-price">
                              ₹{lineTotal.toFixed(2)}
                            </span>

                            <div className="quantity-control cart-quantity-control">
                              <button
                                type="button"
                                className="quantity-button"
                                onClick={() =>
                                  updateCartQuantity(product, quantity - 1)
                                }
                              >
                                −
                              </button>

                              <span className="quantity-value">
                                {quantity}
                              </span>

                              <button
                                type="button"
                                className="quantity-button"
                                onClick={() =>
                                  updateCartQuantity(product, quantity + 1)
                                }
                                disabled={quantity >= stock}
                              >
                                +
                              </button>
                            </div>
                          </div>

                          <div className="cart-item-bottom">
                            <span className="cart-item-unit-price">
                              ₹{Number(product.price).toFixed(2)} each
                            </span>

                            <button
                              type="button"
                              className="cart-remove-button"
                              onClick={() => handleRemove(product.id)}
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="cart-footer">
                  <div className="cart-subtotal">
                    <span>Subtotal</span>

                    <strong>
                      ₹{Number(cartTotal).toFixed(2)}
                    </strong>
                  </div>

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
    </>
  );
}

export default CustomerHome;