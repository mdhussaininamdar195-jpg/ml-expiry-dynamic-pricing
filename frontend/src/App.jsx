import "./App.css";

function SidebarIcon({ type }) {
  const paths = {
    overview: (
      <>
        <rect x="4" y="4" width="6" height="6" rx="1" />
        <rect x="14" y="4" width="6" height="6" rx="1" />
        <rect x="4" y="14" width="6" height="6" rx="1" />
        <rect x="14" y="14" width="6" height="6" rx="1" />
      </>
    ),
    inventory: (
      <>
        <path d="M4 7.5 12 4l8 3.5v9L12 20l-8-3.5v-9Z" />
        <path d="M4.5 7.5 12 11l7.5-3.5" />
        <path d="M12 11v9" />
      </>
    ),
    pricing: (
      <>
        <path d="M5 7h14" />
        <path d="M5 12h10" />
        <path d="M5 17h7" />
        <circle cx="18" cy="12" r="2" />
      </>
    ),
    analytics: (
      <>
        <path d="M5 19V9" />
        <path d="M12 19V5" />
        <path d="M19 19v-7" />
      </>
    ),
    products: (
      <>
        <path d="M5 6h14v14H5z" />
        <path d="M8 3h8v3H8z" />
        <path d="M8 10h8M8 14h6" />
      </>
    ),
    users: (
      <>
        <circle cx="12" cy="8" r="3" />
        <path d="M5 20c.7-3.2 3-5 7-5s6.3 1.8 7 5" />
      </>
    ),
    settings: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M19 12a7 7 0 0 0-.1-1l2-1.2-2-3.4-2.1 1a7 7 0 0 0-1.7-1L15 4h-4l-.3 2.4a7 7 0 0 0-1.7 1l-2.1-1-2 3.4L7 11a7 7 0 0 0 0 2l-2.1 1.2 2 3.4 2.1-1a7 7 0 0 0 1.7 1L11 20h4l.3-2.4a7 7 0 0 0 1.7-1l2.1 1 2-3.4-2.1-1.2c0-.3.1-.7.1-1Z" />
      </>
    ),
  };

  return (
    <svg
      className="nav-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[type]}
    </svg>
  );
}

function App() {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 32 32" fill="none">
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
            <span>Inventory intelligence</span>
          </div>
        </div>

        <nav className="navigation" aria-label="Primary navigation">
          <div className="nav-section">
            <span className="nav-label">Workspace</span>

            <button className="nav-item active">
              <SidebarIcon type="overview" />
              <span>Overview</span>
            </button>

            <button className="nav-item">
              <SidebarIcon type="inventory" />
              <span>Inventory</span>
            </button>

            <button className="nav-item">
              <SidebarIcon type="pricing" />
              <span>Pricing</span>
            </button>

            <button className="nav-item">
              <SidebarIcon type="analytics" />
              <span>Analytics</span>
            </button>
          </div>

          <div className="nav-section">
            <span className="nav-label">Administration</span>

            <button className="nav-item">
              <SidebarIcon type="products" />
              <span>Products</span>
            </button>

            <button className="nav-item">
              <SidebarIcon type="users" />
              <span>Users</span>
            </button>

            <button className="nav-item">
              <SidebarIcon type="settings" />
              <span>Settings</span>
            </button>
          </div>
        </nav>

        <div className="sidebar-footer">
          <div className="user-avatar">AD</div>

          <div className="user-details">
            <strong>Admin</strong>
            <span>Store operations</span>
          </div>

          <button className="more-button" aria-label="More account options">
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <circle cx="5" cy="12" r="1.5" />
              <circle cx="12" cy="12" r="1.5" />
              <circle cx="19" cy="12" r="1.5" />
            </svg>
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <span className="eyebrow">Store operations</span>
            <h1>Overview</h1>
          </div>

          <div className="topbar-actions">
            <button className="icon-button" aria-label="Search">
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

            <button className="profile-button">
              <span className="user-avatar small">AD</span>
              <span>Admin</span>
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
            </button>
          </div>
        </header>

        <section className="page-intro">
          <div>
            <h2>Inventory at a glance</h2>
            <p>
              Monitor stock health, expiry risk and pricing opportunities.
            </p>
          </div>

          <span className="status-indicator">
            <span />
            System operational
          </span>
        </section>

        <section className="health-panel">
          <div>
            <span className="section-label">Inventory health</span>
            <div className="health-value">94%</div>
          </div>

          <div className="health-progress">
            <div className="progress-track">
              <div className="progress-value" />
            </div>
            <span>Healthy inventory position</span>
          </div>

          <div className="health-note">
            <strong>7</strong>
            <span>products need attention</span>
          </div>
        </section>

        <div className="dashboard-grid">
          <section className="panel expiry-panel">
            <div className="panel-header">
              <div>
                <span className="section-label">Expiry watch</span>
                <h3>Products needing attention</h3>
              </div>

              <button className="text-button">View all</button>
            </div>

            <div className="product-list">
              <div className="product-row">
                <div className="product-info">
                  <div className="product-placeholder">Y</div>
                  <div>
                    <strong>Yogurt</strong>
                    <span>Dairy</span>
                  </div>
                </div>

                <span>1 day</span>
                <span className="risk high">High</span>
              </div>

              <div className="product-row">
                <div className="product-info">
                  <div className="product-placeholder">M</div>
                  <div>
                    <strong>Milk</strong>
                    <span>Dairy</span>
                  </div>
                </div>

                <span>2 days</span>
                <span className="risk high">High</span>
              </div>

              <div className="product-row">
                <div className="product-info">
                  <div className="product-placeholder">B</div>
                  <div>
                    <strong>Bread</strong>
                    <span>Bakery</span>
                  </div>
                </div>

                <span>5 days</span>
                <span className="risk medium">Medium</span>
              </div>

              <div className="product-row">
                <div className="product-info">
                  <div className="product-placeholder">C</div>
                  <div>
                    <strong>Cheese</strong>
                    <span>Dairy</span>
                  </div>
                </div>

                <span>7 days</span>
                <span className="risk low">Low</span>
              </div>
            </div>
          </section>

          <section className="panel pricing-panel">
            <div className="panel-header">
              <div>
                <span className="section-label">Pricing opportunities</span>
                <h3>Recommended actions</h3>
              </div>

              <button className="text-button">View all</button>
            </div>

            <div className="pricing-list">
              <div className="pricing-row">
                <div>
                  <strong>Yogurt</strong>
                  <span>Current price</span>
                </div>

                <div className="price-change">
                  <strong>₹50 → ₹35</strong>
                  <span>30% recommended</span>
                </div>

                <button className="outline-button">Review</button>
              </div>

              <div className="pricing-row">
                <div>
                  <strong>Milk</strong>
                  <span>Current price</span>
                </div>

                <div className="price-change">
                  <strong>₹60 → ₹48</strong>
                  <span>20% recommended</span>
                </div>

                <button className="outline-button">Review</button>
              </div>
            </div>
          </section>
        </div>

        <section className="panel radar-panel">
          <div className="panel-header">
            <div>
              <span className="section-label">Expiry radar</span>
              <h3>Inventory risk horizon</h3>
            </div>

            <span className="muted-label">Next 7 days</span>
          </div>

          <div className="radar">
            <div className="radar-line" />

            <div className="radar-point">
              <span className="point high" />
              <strong>Today</strong>
              <span>Yogurt</span>
            </div>

            <div className="radar-point">
              <span className="point high" />
              <strong>2 days</strong>
              <span>Milk</span>
            </div>

            <div className="radar-point">
              <span className="point medium" />
              <strong>5 days</strong>
              <span>Bread</span>
            </div>

            <div className="radar-point">
              <span className="point low" />
              <strong>7 days</strong>
              <span>Cheese</span>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;