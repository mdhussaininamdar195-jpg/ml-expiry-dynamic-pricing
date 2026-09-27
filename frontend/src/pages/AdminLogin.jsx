import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./AdminLogin.css";
import {
  login,
  logout,
  getCurrentUser,
} from "../services/auth";

function ShieldIcon() {
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
      <path d="M12 3 19 6v5c0 4.5-2.8 8-7 10-4.2-2-7-5.5-7-10V6l7-3Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function AdminLogin() {
  const navigate = useNavigate();
  const location = useLocation();

  const [username, setUsername] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [error, setError] =
    useState("");

  const [isSigningIn, setIsSigningIn] =
    useState(false);

  /*
   * If an administrator is already authenticated,
   * don't show the login page again.
   */
  useEffect(() => {
    let mounted = true;

    async function checkExistingAdmin() {
      const token =
        localStorage.getItem(
          "access_token"
        );

      if (!token) {
        return;
      }

      try {
        const response =
          await getCurrentUser();

        const user =
          response?.user;

        if (
          mounted &&
          user?.role === "admin"
        ) {
          const destination =
            location.state?.from ||
            "/admin";

          navigate(
            destination,
            {
              replace: true,
            }
          );
        }

      } catch {
        /*
         * Invalid/expired token.
         * Clear it so the user can log in normally.
         */
        logout();
      }
    }

    checkExistingAdmin();

    return () => {
      mounted = false;
    };
  }, [navigate, location.state]);

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");

    if (
      !username.trim() ||
      !password
    ) {
      setError(
        "Please enter your username and password."
      );

      return;
    }

    setIsSigningIn(true);

    try {
      /*
       * Clear any old session before
       * starting a fresh admin login.
       */
      logout();

      const data =
        await login(
          username.trim(),
          password
        );

      /*
       * Only an administrator can enter
       * the admin section.
       */
      if (
        String(data?.role || "").toLowerCase() !==
        "admin"
      ) {
        logout();

        setError(
          "This account does not have administrator access."
        );

        return;
      }

      const destination =
        location.state?.from ||
        "/admin";

      navigate(
        destination,
        {
          replace: true,
        }
      );

    } catch (err) {

      logout();

      setError(
        err.message ||
          "Unable to sign in."
      );

    } finally {

      setIsSigningIn(false);
    }
  }

  return (
    <main className="admin-login-page">

      <section className="admin-login-shell">

        <div className="admin-login-brand">

          <div className="admin-login-brand-mark">

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

            <strong>
              FreshFlow
            </strong>

            <span>
              Administration
            </span>

          </div>

        </div>


        <div className="admin-login-card">

          <div className="admin-login-icon">
            <ShieldIcon />
          </div>

          <span className="admin-login-eyebrow">
            Secure access
          </span>

          <h1>
            Admin Login
          </h1>

          <p className="admin-login-description">
            Sign in to manage products,
            pricing, inventory and store
            analytics.
          </p>


          <form
            onSubmit={handleSubmit}
            className="admin-login-form"
          >

            <label className="admin-login-field">

              <span>
                Username
              </span>

              <input
                type="text"
                value={username}
                onChange={(event) =>
                  setUsername(
                    event.target.value
                  )
                }
                placeholder="Enter admin username"
                autoComplete="username"
                autoFocus
                required
                disabled={isSigningIn}
              />

            </label>


            <label className="admin-login-field">

              <span>
                Password
              </span>

              <input
                type="password"
                value={password}
                onChange={(event) =>
                  setPassword(
                    event.target.value
                  )
                }
                placeholder="Enter password"
                autoComplete="current-password"
                required
                disabled={isSigningIn}
              />

            </label>


            {error && (

              <div
                className="admin-login-error"
                role="alert"
              >
                {error}
              </div>

            )}


            <button
              type="submit"
              className="admin-login-submit"
              disabled={isSigningIn}
            >
              {isSigningIn
                ? "Signing in..."
                : "Sign in"}
            </button>

          </form>


          <div className="admin-login-footer">
            Authorized administrators only
          </div>

        </div>

      </section>

    </main>
  );
}

export default AdminLogin;