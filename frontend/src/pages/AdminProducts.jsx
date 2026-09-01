import { useState } from "react";
import "./AdminProducts.css";
import EditProduct from "./EditProduct";

const products = [
    {
        id: 1,
        name: "Fresh Milk",
        category: "Dairy",
        price: 48,
        stock: 32,
        daysLeft: 1,
        risk: "High",
    },
    {
        id: 2,
        name: "Whole Wheat Bread",
        category: "Bakery",
        price: 32,
        stock: 18,
        daysLeft: 2,
        risk: "High",
    },
    {
        id: 3,
        name: "Plain Yogurt",
        category: "Dairy",
        price: 35,
        stock: 14,
        daysLeft: 3,
        risk: "Medium",
    },
    {
        id: 4,
        name: "Red Apples",
        category: "Produce",
        price: 110,
        stock: 42,
        daysLeft: 7,
        risk: "Low",
    },
    {
        id: 5,
        name: "Orange Juice",
        category: "Beverages",
        price: 85,
        stock: 26,
        daysLeft: 9,
        risk: "Low",
    },
];

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

  if (editingProduct) {
    return (
      <EditProduct
        product={editingProduct}
        onBack={() => setEditingProduct(null)}
        onSave={(updatedProduct) => {
          console.log("Updated product:", updatedProduct);
          setEditingProduct(null);
        }}
      />
    );
  }

  return (
        <div className="admin-products-page">
            <header className="admin-page-header">
                <div>
                    <span className="admin-eyebrow">Administration</span>
                    <h1>Products</h1>
                    <p>Manage your store catalogue and inventory information.</p>
                </div>

                <button className="add-product-button">
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
                    />
                </div>

                <select className="filter-select" defaultValue="all">
                    <option value="all">All categories</option>
                    <option value="dairy">Dairy</option>
                    <option value="bakery">Bakery</option>
                    <option value="produce">Produce</option>
                    <option value="beverages">Beverages</option>
                </select>

                <select className="filter-select" defaultValue="all-risk">
                    <option value="all-risk">All risk levels</option>
                    <option value="high">High risk</option>
                    <option value="medium">Medium risk</option>
                    <option value="low">Low risk</option>
                </select>
            </section>

            <section className="products-panel">
                <div className="products-panel-header">
                    <div>
                        <h2>Product catalogue</h2>
                        <span>{products.length} products</span>
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
                            {products.map((product) => (
                                <tr key={product.id}>
                                    <td>
                                        <div className="table-product">
                                            <div className="table-product-image">
                                                {product.name.charAt(0)}
                                            </div>

                                            <div>
                                                <strong>{product.name}</strong>
                                                <span>Product #{product.id}</span>
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
                                            {product.daysLeft} days
                                        </span>
                                    </td>

                                    <td>
                                        <span className={`risk-badge ${product.risk.toLowerCase()}`}>
                                            {product.risk}
                                        </span>
                                    </td>

                                    <td>
                                        <button
                                            className="edit-product-button"
                                            onClick={() => setEditingProduct(product)}
                                        >
                                            <EditIcon />
                                            <span>Edit</span>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
}

export default AdminProducts;