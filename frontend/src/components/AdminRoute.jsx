import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { getCurrentUser, logout } from "../services/auth";

function AdminRoute({ children }) {
  const [status, setStatus] = useState("checking");

  useEffect(() => {
    let mounted = true;

    async function verifyAdmin() {
      const token = localStorage.getItem("access_token");

      if (!token) {
        if (mounted) setStatus("unauthenticated");
        return;
      }

      try {
        const response = await getCurrentUser();
        const user = response?.user;

        if (mounted) {
          setStatus(user?.role === "admin" ? "authorized" : "forbidden");
        }
      } catch {
        logout();
        if (mounted) setStatus("unauthenticated");
      }
    }

    verifyAdmin();

    return () => {
      mounted = false;
    };
  }, []);

  if (status === "checking") {
    return (
      <div className="admin-route-loading">
        Checking administrator access...
      </div>
    );
  }

  if (status === "unauthenticated") return <Navigate to="/admin/login" replace />;
  if (status === "forbidden") return <Navigate to="/" replace />;

  return children;
}

export default AdminRoute;
