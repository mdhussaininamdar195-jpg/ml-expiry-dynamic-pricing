import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./CustomerAuth.css";

const API_BASE = "http://localhost:8000";

export default function CustomerLogin() {
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const body = new URLSearchParams({
        username: email.trim(),
        password,
      });

      const res = await fetch(`${API_BASE}/token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body,
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.detail || "Login failed");
      }

      localStorage.setItem("access_token", data.access_token);

      navigate(location.state?.from || "/account", {
        replace: true,
      });
    } catch (e) {
      setError(e.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="customer-auth-page">
      <form className="customer-auth-card" onSubmit={submit}>
        <span className="customer-auth-brand">DailyCart</span>

        <h1>Welcome back</h1>

        <p>
          Sign in to manage your account and view your purchase history.
        </p>

        {error && (
          <div className="customer-auth-error">
            {error}
          </div>
        )}

        <div className="customer-auth-field">
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            autoComplete="email"
            required
          />
        </div>

        <div className="customer-auth-field">
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            autoComplete="current-password"
            required
          />
        </div>

        <button
          className="customer-auth-submit"
          disabled={loading}
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>

        <div className="customer-auth-link">
          New to DailyCart?{" "}
          <button
            type="button"
            onClick={() => navigate("/register")}
          >
            Create an account
          </button>
        </div>
      </form>
    </div>
  );
}
