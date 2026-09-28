import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./CustomerAuth.css";

const API_BASE = "http://localhost:8000";

function UserIcon({ size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true">
      <circle cx="12" cy="8" r="3.2" />
      <path d="M5.5 20c.8-3.6 3-5.4 6.5-5.4s5.7 1.8 6.5 5.4" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

function BackIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 15.2A8.2 8.2 0 0 1 8.8 4 8.2 8.2 0 1 0 20 15.2Z" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="5" r="2.5" />
      <circle cx="6" cy="12" r="2.5" />
      <circle cx="18" cy="19" r="2.5" />
      <path d="m8.2 10.8 7.5-4.3M8.2 13.2l7.5 4.3" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3 19 6v5c0 4.6-2.7 7.8-7 10-4.3-2.2-7-5.4-7-10V6l7-3Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Z" />
      <path d="M10 21h4" />
    </svg>
  );
}

function HelpIcon() {
  return (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M9.7 9a2.5 2.5 0 1 1 4.1 1.9c-1.2.9-1.8 1.3-1.8 2.8" />
      <path d="M12 17h.01" />
    </svg>
  );
}

export default function CustomerAccount() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [totalSpent, setTotalSpent] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [section, setSection] = useState("settings");
  const [darkMode, setDarkMode] = useState(localStorage.getItem("dailycart_theme") === "dark");
  const [openFaq, setOpenFaq] = useState(null);
  const [shareMessage, setShareMessage] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    const headers = { Authorization: `Bearer ${token}` };

    Promise.all([
      fetch(`${API_BASE}/auth/me`, { headers }),
      fetch(`${API_BASE}/account/orders`, { headers }),
    ])
      .then(async ([u, o]) => {
        if (u.status === 401 || o.status === 401) {
          localStorage.removeItem("access_token");
          navigate("/login", { replace: true });
          return;
        }

        const ud = await u.json();
        const od = await o.json();

        if (!u.ok) throw new Error(ud.detail || "Unable to load account");
        if (!o.ok) throw new Error(od.detail || "Unable to load orders");

        setUser(ud.user);
        setOrders(od.orders || []);
        setTotalSpent(Number(od.total_spent || 0));
      })
      .catch((e) => setError(e.message || "Unable to load account"))
      .finally(() => setLoading(false));
  }, [navigate]);

  useEffect(() => {
    document.documentElement.dataset.theme = darkMode ? "dark" : "light";
    localStorage.setItem("dailycart_theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  function logout() {
    localStorage.removeItem("access_token");
    navigate("/", { replace: true });
  }

  async function shareApp() {
    const shareData = {
      title: "DailyCart",
      text: "DailyCart — smart grocery shopping with freshness-aware pricing.",
      url: window.location.origin,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        setShareMessage("Thanks for sharing DailyCart!");
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(window.location.origin);
        setShareMessage("App link copied to clipboard.");
      } else {
        setShareMessage("Sharing is not supported on this browser.");
      }
    } catch {
      // User cancelled the native share dialog.
    }
  }

  const faqItems = [
    ["What is DailyCart?", "DailyCart is a grocery shopping app designed around inventory, freshness and expiry-aware pricing."],
    ["How does the pricing work?", "DailyCart uses the project's machine-learning pricing pipeline to estimate waste risk and recommend a suitable discount."],
    ["What is Waste Risk?", "Waste Risk represents the model's estimate of how likely a product is to become waste based on inventory and freshness-related information."],
    ["Why can two products have different discounts?", "The recommendation can differ because inventory, sales, demand and remaining shelf-life information can differ between products."],
    ["How does DailyCart help reduce food waste?", "The system can recommend lower prices for products with higher expiry or waste risk, encouraging earlier purchases."],
    ["Can I see my previous purchases?", "Yes. Once you are signed in, your purchase history is available in your account."],
  ];

  if (loading) {
    return <div className="account-page"><div className="account-shell">Loading DailyCart…</div></div>;
  }

  return (
    <div className="account-page dailycart-account-page">
      <div className="account-shell">
        <div className="account-topbar">
          {section !== "settings" ? (
            <button className="settings-back-button" onClick={() => setSection("settings")} aria-label="Back">
              <BackIcon />
            </button>
          ) : (
            <button className="settings-back-button" onClick={() => navigate("/customer")} aria-label="Back to shopping">
              <BackIcon />
            </button>
          )}
          <strong>{section === "settings" ? "Settings" :
            section === "faq" ? "FAQ" :
            section === "privacy" ? "Account Privacy" :
            section === "history" ? "Purchase History" :
            "Notification Preferences"}</strong>
          <span />
        </div>

        {error && <div className="customer-auth-error">{error}</div>}

        {section === "settings" && (
          <>
            <div className="dailycart-profile-card">
              <div className="dailycart-profile-avatar"><UserIcon size={30} /></div>
              <div>
                <h1>{user?.username || "Customer"}</h1>
                <p>{user?.email || "No email added"}</p>
              </div>
            </div>

            <div className="settings-group">
              <div className="settings-group-title">Preferences</div>

              <button className="settings-row" onClick={() => setDarkMode((v) => !v)}>
                <span className="settings-row-icon"><MoonIcon /></span>
                <span className="settings-row-text">
                  <strong>Appearance</strong>
                  <small>{darkMode ? "Dark mode" : "Light mode"}</small>
                </span>
                <span className={`dailycart-switch ${darkMode ? "on" : ""}`}><span /></span>
              </button>

              <button className="settings-row" onClick={shareApp}>
                <span className="settings-row-icon"><ShareIcon /></span>
                <span className="settings-row-text">
                  <strong>Share this app</strong>
                  <small>{shareMessage || "Tell someone about DailyCart"}</small>
                </span>
                <ChevronIcon />
              </button>
            </div>

            <div className="settings-group">
              <div className="settings-group-title">Account</div>

              <button className="settings-row" onClick={() => setSection("privacy")}>
                <span className="settings-row-icon"><ShieldIcon /></span>
                <span className="settings-row-text">
                  <strong>Account Privacy</strong>
                  <small>Security and account information</small>
                </span>
                <ChevronIcon />
              </button>

              <button className="settings-row" onClick={() => setSection("notifications")}>
                <span className="settings-row-icon"><BellIcon /></span>
                <span className="settings-row-text">
                  <strong>Notification Preferences</strong>
                  <small>Coming soon</small>
                </span>
                <ChevronIcon />
              </button>

              <button className="settings-row" onClick={() => setSection("faq")}>
                <span className="settings-row-icon"><HelpIcon /></span>
                <span className="settings-row-text">
                  <strong>FAQ</strong>
                  <small>Frequently asked questions</small>
                </span>
                <ChevronIcon />
              </button>
            </div>

            <div className="settings-group">
              <button className="settings-row logout-row" onClick={logout}>
                <span className="settings-row-text">
                  <strong>Logout</strong>
                  <small>Sign out of your DailyCart account</small>
                </span>
                <ChevronIcon />
              </button>
            </div>

            <div className="dailycart-orders-preview">
              <div className="settings-group-title">Purchase summary</div>
              <button
                type="button"
                className="purchase-summary-card"
                onClick={() => setSection("history")}
              >
                <div>
                  <h2>{orders.length} {orders.length === 1 ? "purchase" : "purchases"}</h2>
                  <div className="account-muted">Total spent ₹{totalSpent.toFixed(2)}</div>
                </div>
                <ChevronIcon />
              </button>
            </div>
          </>
        )}

        {section === "history" && (
          <div className="settings-detail-page">
            <p className="settings-detail-intro">
              All purchases made from your DailyCart account.
            </p>

            {orders.length === 0 ? (
              <div className="coming-soon-card">
                <h2>No purchases yet</h2>
                <p>Your purchase history will appear here after you place an order.</p>
              </div>
            ) : (
              <div className="purchase-history-list">
                {orders.map((order) => (
                  <div className="purchase-history-card" key={order.purchase_id}>
                    <div className="purchase-history-image">
                      {order.image_data ? (
                        <img
                          src={order.image_data}
                          alt={order.product_name || "Product"}
                        />
                      ) : (
                        <div className="purchase-history-image-placeholder">
                          <span>{(order.product_name || "P").charAt(0).toUpperCase()}</span>
                        </div>
                      )}
                    </div>

                    <div className="purchase-history-content">
                      <div className="purchase-history-main">
                        <div>
                          <h3>{order.product_name || "Product"}</h3>
                          <span className="purchase-history-category">
                            {String(order.category || "Product").replace(/[_-]+/g, " ")}
                          </span>
                        </div>
                        <strong>
                          ₹{Number(order.total_amount || 0).toFixed(2)}
                        </strong>
                      </div>

                      <div className="purchase-history-details">
                        <span>Quantity: {order.quantity}</span>
                        <span>₹{Number(order.price_per_unit || 0).toFixed(2)} each</span>
                        <span>
                          {order.purchased_at
                            ? new Date(order.purchased_at.replace(" ", "T")).toLocaleString("en-IN", {
                                dateStyle: "medium",
                                timeStyle: "short",
                              })
                            : "Purchase date unavailable"}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {section === "faq" && (
          <div className="settings-detail-page">
            <p className="settings-detail-intro">Everything you need to know about DailyCart.</p>
            <div className="faq-list">
              {faqItems.map(([question, answer], index) => (
                <div className="faq-item" key={question}>
                  <button className="faq-question" onClick={() => setOpenFaq(openFaq === index ? null : index)}>
                    <span>{question}</span><ChevronIcon />
                  </button>
                  {openFaq === index && <div className="faq-answer">{answer}</div>}
                </div>
              ))}
            </div>
          </div>
        )}

        {section === "privacy" && (
          <div className="settings-detail-page">
            <div className="privacy-card">
              <div className="privacy-icon"><ShieldIcon /></div>
              <h2>Your account security</h2>
              <p>Your DailyCart account uses authenticated access to protect account-specific information such as your profile and purchase history.</p>
              <div className="privacy-item"><strong>Authentication</strong><span>Your session is protected by an access token.</span></div>
              <div className="privacy-item"><strong>Purchase history</strong><span>Your account page only requests purchase records associated with your signed-in account.</span></div>
              <div className="privacy-item"><strong>Logout</strong><span>Logging out removes the saved access token from this browser.</span></div>
            </div>
          </div>
        )}

        {section === "notifications" && (
          <div className="settings-detail-page">
            <div className="coming-soon-card">
              <div className="coming-soon-icon"><BellIcon /></div>
              <h2>Coming Soon</h2>
              <p>Notification preferences will be available in a future DailyCart update.</p>
            </div>
          </div>
        )}

        <footer className="dailycart-footer">
          <strong>DailyCart</strong>
          <span>Smart groceries, better value.</span>
          <small>Version V1.0</small>
        </footer>
      </div>
    </div>
  );
}
