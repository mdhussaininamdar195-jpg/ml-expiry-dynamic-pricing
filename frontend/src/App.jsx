import "./App.css";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  NavLink,
  useLocation,
} from "react-router-dom";

import AdminDashboard from "./pages/AdminDashboard";
import AdminProducts from "./pages/AdminProducts";
import CustomerHome from "./pages/CustomerHome";
import AdminLogin from "./pages/AdminLogin";
import AdminRoute from "./components/AdminRoute";

function AdminNavigation() {
  const location = useLocation();

  // Only show admin navigation on admin pages
  if (!location.pathname.startsWith("/admin")) {
    return null;
  }

  return (
    <nav className="admin-navigation">
      <div className="admin-navigation-inner">
        <div className="admin-navigation-brand">
          <span className="admin-navigation-title">FreshFlow</span>
          <span className="admin-navigation-label">Administration</span>
        </div>

        <div className="admin-navigation-links">
          <NavLink
            to="/admin"
            end
            className={({ isActive }) =>
              `admin-nav-link ${isActive ? "active" : ""}`
            }
          >
            Dashboard
          </NavLink>

          <NavLink
            to="/admin/products"
            className={({ isActive }) =>
              `admin-nav-link ${isActive ? "active" : ""}`
            }
          >
            Products
          </NavLink>

          <NavLink to="/" className="admin-nav-link customer-link">
            Customer Store
          </NavLink>
        </div>
      </div>
    </nav>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AdminNavigation />

      <Routes>
        {/* Customer */}
        <Route path="/" element={<CustomerHome />} />

        {/* Admin Login */}
        <Route path="/admin/login" element={<AdminLogin />} />

        {/* Protected Admin Routes */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/products"
          element={
            <AdminRoute>
              <AdminProducts />
            </AdminRoute>
          }
        />

        {/* Unknown URL */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;