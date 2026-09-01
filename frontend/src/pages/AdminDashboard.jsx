import "./AdminDashboard.css";

function PackageIcon() {
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
            <path d="m3 7 9-4 9 4-9 4-9-4Z" />
            <path d="M3 7v10l9 4 9-4V7" />
            <path d="M12 11v10" />
        </svg>
    );
}

function InventoryIcon() {
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
            <path d="M4 5h16v15H4z" />
            <path d="M8 9h8M8 13h8M8 17h5" />
        </svg>
    );
}

function WarningIcon() {
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
            <path d="M12 3 2.8 20h18.4L12 3Z" />
            <path d="M12 9v5M12 17h.01" />
        </svg>
    );
}

function ClockIcon() {
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
            <circle cx="12" cy="12" r="8.5" />
            <path d="M12 7v5l3 2" />
        </svg>
    );
}

function TrendingIcon() {
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
            <path d="M4 16 9 11l4 3 7-7" />
            <path d="M15 7h5v5" />
        </svg>
    );
}

function ShoppingIcon() {
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
            <path d="M5 8h14l-1 12H6L5 8Z" />
            <path d="M9 8a3 3 0 0 1 6 0" />
        </svg>
    );
}

function AdminDashboard() {
    const stats = [
        {
            label: "Total products",
            value: "128",
            change: "+6 this month",
            type: "neutral",
            icon: <PackageIcon />,
        },
        {
            label: "Total stock",
            value: "2,486",
            change: "+8.4% from last week",
            type: "positive",
            icon: <InventoryIcon />,
        },
        {
            label: "Expiring soon",
            value: "18",
            change: "Within 3 days",
            type: "warning",
            icon: <ClockIcon />,
        },
        {
            label: "High risk products",
            value: "7",
            change: "Needs attention",
            type: "danger",
            icon: <WarningIcon />,
        },
    ];

    const riskData = [
        {
            label: "Low risk",
            value: 76,
            count: 97,
            className: "low",
        },
        {
            label: "Medium risk",
            value: 19,
            count: 24,
            className: "medium",
        },
        {
            label: "High risk",
            value: 5,
            count: 7,
            className: "high",
        },
    ];

    const expiringProducts = [
        {
            name: "Fresh Milk",
            category: "Dairy",
            days: "1 day",
            risk: "High",
        },
        {
            name: "Whole Wheat Bread",
            category: "Bakery",
            days: "2 days",
            risk: "High",
        },
        {
            name: "Plain Yogurt",
            category: "Dairy",
            days: "3 days",
            risk: "Medium",
        },
        {
            name: "Fresh Paneer",
            category: "Dairy",
            days: "4 days",
            risk: "Medium",
        },
    ];

    return (
        <div className="admin-dashboard-page">
            <header className="dashboard-header">
                <div>
                    <span className="dashboard-eyebrow">
                        Administration
                    </span>

                    <h1>Dashboard</h1>

                    <p>
                        Monitor inventory, expiry risk, and pricing activity.
                    </p>
                </div>

                <div className="dashboard-date">
                    <span>Store overview</span>
                    <strong>Today</strong>
                </div>
            </header>

            <section className="dashboard-stats">
                {stats.map((stat) => (
                    <article
                        className={`stat-card ${stat.type}`}
                        key={stat.label}
                    >
                        <div className="stat-card-top">
                            <span className="stat-icon">
                                {stat.icon}
                            </span>

                            <span className="stat-label">
                                {stat.label}
                            </span>
                        </div>

                        <strong className="stat-value">
                            {stat.value}
                        </strong>

                        <span className="stat-change">
                            {stat.change}
                        </span>
                    </article>
                ))}
            </section>

            <section className="dashboard-grid">
                <article className="dashboard-card risk-card">
                    <div className="dashboard-card-header">
                        <div>
                            <h2>Expiry risk overview</h2>
                            <p>
                                Current product distribution by risk level.
                            </p>
                        </div>

                        <span className="card-icon">
                            <WarningIcon />
                        </span>
                    </div>

                    <div className="risk-overview">
                        <div className="risk-total">
                            <strong>128</strong>
                            <span>Total products</span>
                        </div>

                        <div className="risk-bars">
                            {riskData.map((risk) => (
                                <div
                                    className="risk-row"
                                    key={risk.label}
                                >
                                    <div className="risk-row-header">
                                        <span>
                                            {risk.label}
                                        </span>

                                        <strong>
                                            {risk.count}
                                        </strong>
                                    </div>

                                    <div className="risk-track">
                                        <div
                                            className={`risk-fill ${risk.className}`}
                                            style={{
                                                width: `${risk.value}%`,
                                            }}
                                        />
                                    </div>

                                    <span className="risk-percentage">
                                        {risk.value}%
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </article>

                <article className="dashboard-card pricing-card">
                    <div className="dashboard-card-header">
                        <div>
                            <h2>Dynamic pricing</h2>
                            <p>
                                Pricing activity based on expiry risk.
                            </p>
                        </div>

                        <span className="card-icon">
                            <TrendingIcon />
                        </span>
                    </div>

                    <div className="pricing-summary">
                        <div>
                            <span>Products repriced</span>
                            <strong>24</strong>
                        </div>

                        <div>
                            <span>Average discount</span>
                            <strong>12.6%</strong>
                        </div>

                        <div>
                            <span>Estimated waste avoided</span>
                            <strong>18.4 kg</strong>
                        </div>
                    </div>

                    <div className="pricing-note">
                        <TrendingIcon />
                        <span>
                            Pricing adjustments are helping reduce
                            potential expiry waste.
                        </span>
                    </div>
                </article>
            </section>

            <section className="dashboard-card inventory-card">
                <div className="dashboard-card-header">
                    <div>
                        <h2>Products approaching expiry</h2>
                        <p>
                            Products that require attention in the next
                            few days.
                        </p>
                    </div>

                    <span className="card-icon">
                        <ClockIcon />
                    </span>
                </div>

                <div className="dashboard-table-wrapper">
                    <table className="dashboard-table">
                        <thead>
                            <tr>
                                <th>Product</th>
                                <th>Category</th>
                                <th>Expiry</th>
                                <th>Risk</th>
                            </tr>
                        </thead>

                        <tbody>
                            {expiringProducts.map((product) => (
                                <tr key={product.name}>
                                    <td>
                                        <strong>
                                            {product.name}
                                        </strong>
                                    </td>

                                    <td>
                                        {product.category}
                                    </td>

                                    <td>
                                        <span
                                            className={
                                                product.risk === "High"
                                                    ? "expiry-critical"
                                                    : "expiry-warning"
                                            }
                                        >
                                            {product.days}
                                        </span>
                                    </td>

                                    <td>
                                        <span
                                            className={`dashboard-risk-badge ${product.risk.toLowerCase()}`}
                                        >
                                            {product.risk}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            <section className="dashboard-bottom-grid">
                <article className="dashboard-card inventory-summary-card">
                    <div className="dashboard-card-header">
                        <div>
                            <h2>Inventory summary</h2>
                            <p>
                                Current stock position across the store.
                            </p>
                        </div>

                        <span className="card-icon">
                            <InventoryIcon />
                        </span>
                    </div>

                    <div className="inventory-summary">
                        <div>
                            <span>In stock</span>
                            <strong>2,486</strong>
                        </div>

                        <div>
                            <span>Low stock</span>
                            <strong>16</strong>
                        </div>

                        <div>
                            <span>Out of stock</span>
                            <strong>4</strong>
                        </div>
                    </div>
                </article>

                <article className="dashboard-card purchases-card">
                    <div className="dashboard-card-header">
                        <div>
                            <h2>Recent purchases</h2>
                            <p>
                                Latest customer activity.
                            </p>
                        </div>

                        <span className="card-icon">
                            <ShoppingIcon />
                        </span>
                    </div>

                    <div className="purchase-summary">
                        <strong>64</strong>
                        <span>Purchases today</span>
                        <small>
                            18 more than yesterday
                        </small>
                    </div>
                </article>
            </section>
        </div>
    );
}

export default AdminDashboard;