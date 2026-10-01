import { useEffect, useState } from "react";
import "./AdminDashboard.css";
import { apiRequest } from "../services/api";


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


function RevenueChart({ chartData }) {
    if (!chartData || !chartData.days?.length) {
        return <div className="dashboard-chart-empty">No revenue data yet.</div>;
    }

    const values = chartData.cumulative_revenue ?? [];
    const width = 760;
    const height = 280;
    const left = 54;
    const right = 20;
    const top = 24;
    const bottom = 46;
    const graphWidth = width - left - right;
    const graphHeight = height - top - bottom;

    const maxValue = Math.max(...values, 1);
    const points = values.map((value, index) => {
        const x =
            left +
            (index / Math.max(values.length - 1, 1)) * graphWidth;
        const y =
            top +
            graphHeight -
            (value / maxValue) * graphHeight;

        return `${x},${y}`;
    }).join(" ");

    return (
        <div className="dashboard-chart">
            <svg
                viewBox={`0 0 ${width} ${height}`}
                role="img"
                aria-label="Cumulative revenue over the last 14 days"
            >
                <line
                    x1={left}
                    y1={top + graphHeight}
                    x2={width - right}
                    y2={top + graphHeight}
                    className="chart-axis"
                />

                <line
                    x1={left}
                    y1={top}
                    x2={left}
                    y2={top + graphHeight}
                    className="chart-axis"
                />

                <polyline
                    points={points}
                    fill="none"
                    className="chart-line"
                />

                {values.map((value, index) => {
                    const x =
                        left +
                        (index / Math.max(values.length - 1, 1)) *
                            graphWidth;
                    const y =
                        top +
                        graphHeight -
                        (value / maxValue) * graphHeight;

                    return (
                        <circle
                            key={`${chartData.days[index]}-${index}`}
                            cx={x}
                            cy={y}
                            r="4"
                            className="chart-point"
                        >
                            <title>
                                {`${chartData.days[index]}: ₹${value.toFixed(2)} cumulative`}
                            </title>
                        </circle>
                    );
                })}

                {chartData.days.map((day, index) => {
                    const x =
                        left +
                        (index / Math.max(chartData.days.length - 1, 1)) *
                            graphWidth;

                    return (
                        <text
                            key={`${day}-${index}`}
                            x={x}
                            y={height - 18}
                            textAnchor="middle"
                            className="chart-label"
                        >
                            {index % 2 === 0 ? day : ""}
                        </text>
                    );
                })}

                <text
                    x={left}
                    y={14}
                    className="chart-value-label"
                >
                    ₹{maxValue.toFixed(0)}
                </text>

                <text
                    x={left}
                    y={top + graphHeight - 4}
                    className="chart-value-label"
                >
                    ₹0
                </text>
            </svg>
        </div>
    );
}

function SustainabilityChart({ chartData }) {
    if (!chartData || !chartData.days?.length) {
        return <div className="dashboard-chart-empty">No sustainability data yet.</div>;
    }

    const values = chartData.sustainability_rate ?? [];
    const width = 760;
    const height = 280;
    const left = 54;
    const right = 20;
    const top = 24;
    const bottom = 46;
    const graphWidth = width - left - right;
    const graphHeight = height - top - bottom;
    const maxValue = 100;

    const points = values.map((value, index) => {
        const x =
            left +
            (index / Math.max(values.length - 1, 1)) * graphWidth;
        const y =
            top +
            graphHeight -
            (Math.min(value, maxValue) / maxValue) * graphHeight;

        return `${x},${y}`;
    }).join(" ");

    return (
        <div className="dashboard-chart">
            <svg
                viewBox={`0 0 ${width} ${height}`}
                role="img"
                aria-label="Sustainability rate over the last 14 days"
            >
                <line
                    x1={left}
                    y1={top + graphHeight}
                    x2={width - right}
                    y2={top + graphHeight}
                    className="chart-axis"
                />

                <line
                    x1={left}
                    y1={top}
                    x2={left}
                    y2={top + graphHeight}
                    className="chart-axis"
                />

                <line
                    x1={left}
                    y1={top + graphHeight / 2}
                    x2={width - right}
                    y2={top + graphHeight / 2}
                    className="chart-grid-line"
                />

                <line
                    x1={left}
                    y1={top}
                    x2={width - right}
                    y2={top}
                    className="chart-grid-line"
                />

                <polyline
                    points={points}
                    fill="none"
                    className="chart-line sustainability"
                />

                {values.map((value, index) => {
                    const x =
                        left +
                        (index / Math.max(values.length - 1, 1)) *
                            graphWidth;
                    const y =
                        top +
                        graphHeight -
                        (Math.min(value, maxValue) / maxValue) *
                            graphHeight;

                    return (
                        <circle
                            key={`${chartData.days[index]}-${index}`}
                            cx={x}
                            cy={y}
                            r="4"
                            className="chart-point"
                        >
                            <title>
                                {`${chartData.days[index]}: ${value.toFixed(2)}%`}
                            </title>
                        </circle>
                    );
                })}

                {chartData.days.map((day, index) => {
                    const x =
                        left +
                        (index / Math.max(chartData.days.length - 1, 1)) *
                            graphWidth;

                    return (
                        <text
                            key={`${day}-${index}`}
                            x={x}
                            y={height - 18}
                            textAnchor="middle"
                            className="chart-label"
                        >
                            {index % 2 === 0 ? day : ""}
                        </text>
                    );
                })}

                <text
                    x={left}
                    y={14}
                    className="chart-value-label"
                >
                    100%
                </text>

                <text
                    x={left}
                    y={top + graphHeight - 4}
                    className="chart-value-label"
                >
                    0%
                </text>
            </svg>
        </div>
    );
}

function AdminDashboard() {
    const [dashboard, setDashboard] = useState(null);
    const [chartData, setChartData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState("");
    const [reportLoading, setReportLoading] = useState(false);

    useEffect(() => {
        let isMounted = true;

        const fetchDashboard = async () => {
            try {
                const [statsResponse, chartResponse] = await Promise.all([
                    apiRequest("/dashboard/stats"),
                    apiRequest("/dashboard/chart-data"),
                ]);

                if (!isMounted) {
                    return;
                }

                setDashboard(statsResponse);
                setChartData(chartResponse);
                setLoadError("");
            } catch (error) {
                if (!isMounted) {
                    return;
                }

                console.error("Failed to load dashboard:", error);
                setLoadError(
                    error.message || "Unable to load dashboard data."
                );
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        fetchDashboard();

        const refreshInterval = setInterval(() => {
            fetchDashboard();
        }, 10000);

        const handleWindowFocus = () => {
            fetchDashboard();
        };

        window.addEventListener("focus", handleWindowFocus);

        return () => {
            isMounted = false;
            clearInterval(refreshInterval);
            window.removeEventListener("focus", handleWindowFocus);
        };
    }, []);

    async function downloadReport() {
        setReportLoading(true);

        try {
            const token = localStorage.getItem("access_token");

            const response = await fetch(
                "http://localhost:8000/dashboard/report/pdf",
                {
                    headers: token
                        ? { Authorization: `Bearer ${token}` }
                        : {},
                }
            );

            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                throw new Error(
                    errorData?.detail ||
                    `Report download failed (${response.status})`
                );
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");

            link.href = url;
            link.download = "dailycart_dashboard_report.pdf";
            document.body.appendChild(link);
            link.click();
            link.remove();

            setTimeout(() => window.URL.revokeObjectURL(url), 1000);
        } catch (error) {
            console.error("Failed to download report:", error);
            setLoadError(
                error.message || "Unable to download the PDF report."
            );
        } finally {
            setReportLoading(false);
        }
    }

    const data = dashboard ?? {
        total_purchases: 0,
        total_products_purchased: 0,
        products_saved_from_waste: 0,
        amount_recouped_from_waste: 0,
        sustainability_rate: 0,
        total_amount_recouped: 0
    };

    const stats = [
        {
            label: "Total purchases",
            value: Number(data.total_purchases ?? 0).toLocaleString(),
            change: "Purchase transactions",
            type: "neutral",
            icon: <ShoppingIcon />
        },
        {
            label: "Products purchased",
            value: Number(data.total_products_purchased ?? 0).toLocaleString(),
            change: "Total units sold",
            type: "positive",
            icon: <InventoryIcon />
        },
        {
            label: "Saved from waste",
            value: Number(data.products_saved_from_waste ?? 0).toLocaleString(),
            change: "Purchased within 3 days of expiry",
            type: "warning",
            icon: <ClockIcon />
        },
        {
            label: "Amount recouped",
            value: `₹${Number(
                data.amount_recouped_from_waste ?? 0
            ).toFixed(2)}`,
            change: "From near-expiry products",
            type: "positive",
            icon: <TrendingIcon />
        }
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
                        Monitor purchases, waste recovery, and
                        sustainability performance.
                    </p>
                </div>

                <div className="dashboard-header-actions">
                    <button
                        type="button"
                        className="dashboard-report-button"
                        onClick={downloadReport}
                        disabled={reportLoading}
                    >
                        {reportLoading
                            ? "Preparing report..."
                            : "Download PDF report"}
                    </button>

                    <div className="dashboard-date">
                        <span>Store overview</span>
                        <strong>Live</strong>
                    </div>
                </div>
            </header>

            {loadError && (
                <div className="dashboard-error">
                    {loadError}
                </div>
            )}

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
                            {loading ? "—" : stat.value}
                        </strong>

                        <span className="stat-change">
                            {stat.change}
                        </span>
                    </article>
                ))}
            </section>

            <section className="dashboard-grid">
                <article className="dashboard-card pricing-card">
                    <div className="dashboard-card-header">
                        <div>
                            <h2>Sustainability & waste recovery</h2>
                            <p>
                                Products purchased within 3 days of expiry
                                are counted as saved from waste.
                            </p>
                        </div>

                        <span className="card-icon">
                            <TrendingIcon />
                        </span>
                    </div>

                    <div className="pricing-summary">
                        <div>
                            <span>Products saved</span>
                            <strong>
                                {loading
                                    ? "—"
                                    : Number(
                                        data.products_saved_from_waste ?? 0
                                    ).toLocaleString()}
                            </strong>
                        </div>

                        <div>
                            <span>Amount recouped</span>
                            <strong>
                                {loading
                                    ? "—"
                                    : `₹${Number(
                                        data.amount_recouped_from_waste ?? 0
                                    ).toFixed(2)}`}
                            </strong>
                        </div>

                        <div>
                            <span>Sustainability rate</span>
                            <strong>
                                {loading
                                    ? "—"
                                    : `${Number(
                                        data.sustainability_rate ?? 0
                                    ).toFixed(2)}%`}
                            </strong>
                        </div>
                    </div>

                    <div className="pricing-note">
                        <TrendingIcon />
                        <span>
                            A product is counted here when it had 3 days or
                            less remaining at the time of purchase.
                        </span>
                    </div>
                </article>

                <article className="dashboard-card purchases-card">
                    <div className="dashboard-card-header">
                        <div>
                            <h2>Purchase overview</h2>
                            <p>
                                Revenue and customer activity from the
                                database.
                            </p>
                        </div>

                        <span className="card-icon">
                            <ShoppingIcon />
                        </span>
                    </div>

                    <div className="purchase-summary">
                        <strong>
                            {loading
                                ? "—"
                                : `₹${Number(
                                    data.total_amount_recouped ?? 0
                                ).toFixed(2)}`}
                        </strong>

                        <span>Total purchase amount</span>

                        <small>
                            {loading
                                ? "—"
                                : `${Number(
                                    data.total_purchases ?? 0
                                ).toLocaleString()} purchase transactions`}
                        </small>
                    </div>
                </article>
            </section>


            <section className="dashboard-chart-grid">
                <article className="dashboard-card dashboard-chart-card">
                    <div className="dashboard-card-header">
                        <div>
                            <h2>Store revenue growth</h2>
                            <p>
                                Cumulative revenue from customer purchases
                                over the last 14 days.
                            </p>
                        </div>

                        <span className="chart-period">14 days</span>
                    </div>

                    <RevenueChart chartData={chartData} />
                </article>

                <article className="dashboard-card dashboard-chart-card">
                    <div className="dashboard-card-header">
                        <div>
                            <h2>Sustainability trend</h2>
                            <p>
                                Daily share of purchased units that were
                                within 3 days of expiry.
                            </p>
                        </div>

                        <span className="chart-period">14 days</span>
                    </div>

                    <SustainabilityChart chartData={chartData} />
                </article>
            </section>

            <section className="dashboard-card inventory-card">
                <div className="dashboard-card-header">
                    <div>
                        <h2>How the sustainability metric works</h2>
                        <p>
                            The dashboard uses the purchase record captured
                            at checkout.
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
                                <th>Metric</th>
                                <th>Calculation</th>
                                <th>Current value</th>
                            </tr>
                        </thead>

                        <tbody>
                            <tr>
                                <td>
                                    <strong>Products saved from waste</strong>
                                </td>
                                <td>
                                    Units purchased with 3 days or less
                                    remaining
                                </td>
                                <td>
                                    {loading
                                        ? "—"
                                        : Number(
                                            data.products_saved_from_waste ?? 0
                                        ).toLocaleString()}
                                </td>
                            </tr>

                            <tr>
                                <td>
                                    <strong>Amount recouped from waste</strong>
                                </td>
                                <td>
                                    Purchase amount from those near-expiry
                                    units
                                </td>
                                <td>
                                    {loading
                                        ? "—"
                                        : `₹${Number(
                                            data.amount_recouped_from_waste ?? 0
                                        ).toFixed(2)}`}
                                </td>
                            </tr>

                            <tr>
                                <td>
                                    <strong>Sustainability rate</strong>
                                </td>
                                <td>
                                    Saved units ÷ total purchased units × 100
                                </td>
                                <td>
                                    {loading
                                        ? "—"
                                        : `${Number(
                                            data.sustainability_rate ?? 0
                                        ).toFixed(2)}%`}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
}

export default AdminDashboard;
