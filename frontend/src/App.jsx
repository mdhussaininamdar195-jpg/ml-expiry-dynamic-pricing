import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import CustomerHome from "./pages/CustomerHome";

import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import AdminProducts from "./pages/AdminProducts";

import AdminRoute from "./components/AdminRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* ================================================= */}
        {/* CUSTOMER */}
        {/* ================================================= */}

        <Route
          path="/"
          element={<CustomerHome />}
        />

        <Route
          path="/customer"
          element={<CustomerHome />}
        />


        {/* ================================================= */}
        {/* ADMIN LOGIN - PUBLIC */}
        {/* ================================================= */}

        <Route
          path="/admin/login"
          element={<AdminLogin />}
        />


        {/* ================================================= */}
        {/* ADMIN DASHBOARD - PROTECTED */}
        {/* ================================================= */}

        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        />


        {/* ================================================= */}
        {/* ADMIN PRODUCTS - PROTECTED */}
        {/* ================================================= */}

        <Route
          path="/admin/products"
          element={
            <AdminRoute>
              <AdminProducts />
            </AdminRoute>
          }
        />


        {/* ================================================= */}
        {/* UNKNOWN ROUTES */}
        {/* ================================================= */}

        <Route
          path="*"
          element={
            <Navigate
              to="/"
              replace
            />
          }
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;