
import { Link } from "react-router-dom";
import "./Auth.css";

function Register() {
  return (
    <div className="auth-page">
      <div className="auth-card">
        <Link to="/" className="auth-brand">
          🌉 GoalBridge
        </Link>

        <h1>Create your account</h1>
        <p className="auth-subtitle">
          Start planning your career and reaching your goals.
        </p>

        <form className="auth-form">
          <div className="name-fields">
            <div className="form-group">
              <label>First Name</label>
              <input
                type="text"
                placeholder="Enter first name"
                required
              />
            </div>

            <div className="form-group">
              <label>Last Name</label>
              <input
                type="text"
                placeholder="Enter last name"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              placeholder="Enter your email"
              required
            />
          </div>

          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              placeholder="Enter your username"
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              placeholder="Create a password"
              minLength={8}
              required
            />
          </div>

          <div className="form-group">
            <label>Confirm Password</label>
            <input
              type="password"
              placeholder="Enter password again"
              minLength={8}
              required
            />
          </div>

          <button type="submit" className="auth-button">
            Create Account →
          </button>
        </form>

        <p className="auth-switch">
          Already have an account?{" "}
          <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;
