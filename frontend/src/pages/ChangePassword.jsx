
import { useState } from "react";

export default function ChangePassword() {
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showPasswords, setShowPasswords] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function handleChange(e) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });

    setMessage("");
    setError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();

    setMessage("");
    setError("");

    if (form.newPassword !== form.confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    if (form.newPassword.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    setSaving(true);

    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        "http://localhost:5000/api/profile/change-password",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(form),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to update password."
        );
      }

      setMessage("Password updated successfully!");

      // Clear password fields
      setForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="password-section">
      <div className="password-section-header">
        <h3>Account Security</h3>
        <p>
          Change your password to keep your account secure.
        </p>
      </div>

      <form
        className="password-form"
        onSubmit={handleSubmit}
      >
        <label>
          Current Password
          <input
            type={showPasswords ? "text" : "password"}
            name="currentPassword"
            autoComplete="current-password"
            value={form.currentPassword}
            onChange={handleChange}
            required
            placeholder="Enter current password"
          />
        </label>

        <label>
          New Password
          <input
            type={showPasswords ? "text" : "password"}
            name="newPassword"
            autoComplete="new-password"
            value={form.newPassword}
            onChange={handleChange}
            minLength={8}
            maxLength={72}
            required
            placeholder="Enter new password"
          />
        </label>

        <label>
          Confirm New Password
          <input
            type={showPasswords ? "text" : "password"}
            name="confirmPassword"
            autoComplete="new-password"
            value={form.confirmPassword}
            onChange={handleChange}
            required
            placeholder="Confirm new password"
          />
        </label>

        <label className="password-show-toggle">
          <input
            type="checkbox"
            checked={showPasswords}
            onChange={(e) =>
              setShowPasswords(e.target.checked)
            }
          />
          Show passwords
        </label>

        {error && (
          <p className="profile-error" role="alert">
            {error}
          </p>
        )}

        {message && (
          <p className="profile-success" role="status">
            {message}
          </p>
        )}

        <div className="profile-actions">
          <button type="submit" disabled={saving}>
            {saving
              ? "Updating..."
              : "Update Password"}
          </button>
        </div>
      </form>
    </section>
  );
}
