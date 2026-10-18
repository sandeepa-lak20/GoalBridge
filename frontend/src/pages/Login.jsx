
import { Link } from "react-router-dom";
import "./Auth.css";

function Login() {
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

        <form className="auth-form">
          <div className="form-group">
            <label>Username or Email</label>
            <input
              type="text"
              placeholder="Enter username or email"
              autoComplete="username"
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              autoComplete="current-password"
              required
            />
          </div>

          <button type="submit" className="auth-button">
            Login →
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
