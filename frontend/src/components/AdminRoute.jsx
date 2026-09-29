import { useEffect, useState } from "react";
import {
  Navigate,
  NavLink,
  useLocation,
} from "react-router-dom";

import {
  getCurrentUser,
  logout,
} from "../services/auth";

function DashboardIcon() {
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
      <rect x="4" y="4" width="6" height="6" rx="1" />
      <rect x="14" y="4" width="6" height="6" rx="1" />
      <rect x="4" y="14" width="6" height="6" rx="1" />
      <rect x="14" y="14" width="6" height="6" rx="1" />
    </svg>
  );
}

function ProductsIcon() {
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
      <path d="M4 7h16" />
      <path d="M6 7v13h12V7" />
      <path d="M8 7V4h8v3" />
      <path d="M9 11h6" />
      <path d="M9 15h6" />
    </svg>
  );
}

function StoreIcon() {
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
      <path d="M4 10h16" />
      <path d="M5 10v9h14v-9" />
      <path d="M4 10l2-5h12l2 5" />
      <path d="M9 19v-5h6v5" />
    </svg>
  );
}

function LogoutIcon() {
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
      <path d="M10 5H5v14h5" />
      <path d="M14 8l4 4-4 4" />
      <path d="M8 12h10" />
    </svg>
  );
}

function AdminNav() {
  const location = useLocation();

  function handleLogout() {
    logout();
    window.location.href = "/admin/login";
  }

  const linkClass = ({ isActive }) =>
    `admin-nav-link${isActive ? " active" : ""}`;

  return (
    <nav className="admin-navigation">
      <div className="admin-navigation-brand">
        <div className="admin-navigation-brand-mark">
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
          <strong>Daily Cart</strong>
          <span>Administration</span>
        </div>
      </div>

      <div className="admin-navigation-links">
        <NavLink
          to="/admin"
          end
          className={linkClass}
        >
          <DashboardIcon />
          <span>Dashboard</span>
        </NavLink>

        <NavLink
          to="/admin/products"
          className={linkClass}
        >
          <ProductsIcon />
          <span>Edit Products</span>
        </NavLink>

        <NavLink
          to="/customer"
          className={`admin-nav-link${
            location.pathname === "/customer" ||
            location.pathname === "/"
              ? " active"
              : ""
          }`}
        >
          <StoreIcon />
          <span>User Interface</span>
        </NavLink>
      </div>

      <div className="admin-navigation-right">
        <span className="admin-auth-badge">
          Administrator
        </span>

        <button
          type="button"
          className="admin-logout-button"
          onClick={handleLogout}
        >
          <LogoutIcon />
          <span>Logout</span>
        </button>
      </div>
    </nav>
  );
}

function AdminRoute({ children }) {
  const location = useLocation();

  const [status, setStatus] =
    useState("checking");

  useEffect(() => {
    let mounted = true;

    async function verifyAdmin() {
      const token =
        localStorage.getItem("access_token");

      /*
       * No JWT at all.
       * Do NOT render the admin page.
       */
      if (!token) {
        if (mounted) {
          setStatus("unauthenticated");
        }

        return;
      }

      try {
        /*
         * IMPORTANT:
         *
         * Do not trust localStorage.user_role.
         * The backend /auth/me endpoint validates
         * the JWT and returns the real database user.
         */
        const response =
          await getCurrentUser();

        const user =
          response?.user;

        const role =
          String(user?.role || "")
            .trim()
            .toLowerCase();

        if (!mounted) {
          return;
        }

        if (role === "admin") {
          setStatus("authorized");
        } else {
          logout();
          setStatus("forbidden");
        }
      } catch (error) {
        console.error(
          "Admin authentication failed:",
          error
        );

        logout();

        if (mounted) {
          setStatus("unauthenticated");
        }
      }
    }

    /*
     * Every time the protected admin route
     * mounts, verify the JWT against the backend.
     */
    verifyAdmin();

    return () => {
      mounted = false;
    };
  }, [location.pathname]);

  if (status === "checking") {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f7f9f6",
          color: "#183a2b",
          fontFamily:
            "Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
          fontSize: "15px",
        }}
      >
        Checking administrator access...
      </div>
    );
  }

  /*
   * No valid authentication.
   * Send the user to the admin login page.
   */
  if (status === "unauthenticated") {
    return (
      <Navigate
        to="/admin/login"
        replace
        state={{
          from: location.pathname,
        }}
      />
    );
  }

  /*
   * Valid JWT, but the account is not an admin.
   */
  if (status === "forbidden") {
    return (
      <Navigate
        to="/customer"
        replace
      />
    );
  }

  /*
   * Only an authenticated admin reaches here.
   */
  return (
    <>
      <AdminNav />

      <div className="admin-route-content">
        {children}
      </div>
    </>
  );
}

export default AdminRoute;