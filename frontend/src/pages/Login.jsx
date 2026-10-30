import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "./Auth.css";

const API_URL = "http://localhost:5000/api/auth";

function Login() {
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [isError, setIsError] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");
    setIsError(false);
    setLoading(true);

    try {
      const response = await axios.post(`${API_URL}/login`, {
        identifier,
        password,
      });

      // Store the token and basic user information.
      localStorage.setItem("token", response.data.token);
      localStorage.setItem(
        "user",
        JSON.stringify(response.data.user)
      );

      setMessage(response.data.message);

      // For now, return to the home page.
      navigate("/dashboard", { replace: true });
    } catch (error) {
      setIsError(true);
      setMessage(
        error.response?.data?.message ||
          "Unable to log in. Check your connection and try again."
      );
    } finally {
      setLoading(false);
   async function handleSubmit(event) {
  event.preventDefault();

  if (loading) return;

  setMessage("");
  setIsError(false);
  setLoading(true);

  try {
    const response = await axios.post(
      `${API_URL}/login`,
      {
        identifier: identifier.trim(),
        password,
      },
      {
        timeout: 15000,
      }
    );

    const { token, user } = response.data;

    // Validate login response
    if (
      typeof token !== "string" ||
      !token ||
      !user ||
      typeof user !== "object" ||
      !(user.id || user._id)
    ) {
      throw new Error(
        "Login response is missing required user information."
      );
    }

    // Save authentication information
    localStorage.setItem("token", token);
    localStorage.setItem(
      "user",
      JSON.stringify(user)
    );

    // Navigate after saving authentication data
    navigate("/dashboard", { replace: true });

  } catch (error) {
    console.error("Login failed:", error.message);

    setIsError(true);

    setMessage(
      error.response?.data?.message ||
      error.message ||
      "Unable to log in. Please try again."
    );

  } finally {
    setLoading(false);
  }
}
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card login-card">
        <Link to="/" className="auth-brand">
          🌉 GoalBridge
        </Link>

        <h1>Welcome back!</h1>
        <p className="auth-subtitle">
          Log in to continue your career journey.
        </p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Username or Email</label>
            <input
              type="text"
              value={identifier}
              onChange={(event) =>
                setIdentifier(event.target.value)
              }
              placeholder="Enter username or email"
              autoComplete="username"
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              placeholder="Enter your password"
              autoComplete="current-password"
              required
            />
          </div>

          {message && (
            <p
              role="status"
              style={{
                color: isError ? "#c62828" : "#238636",
              }}
            >
              {message}
            </p>
          )}

          <button
            type="submit"
            className="auth-button"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login →"}
          </button>
        </form>

        <p className="auth-switch">
          Don't have an account?{" "}
          <Link to="/register">Create an account</Link>
        </p>

        <Link to="/" className="back-home">
          ← Back to Home
        </Link>
      </div>
    </div>
  );
}

export default Login;
