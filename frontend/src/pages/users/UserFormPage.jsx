// frontend/src/pages/users/UserFormPage.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createUser } from "../../api/usersApi";

const ROLE_OPTIONS = [
  "ADMIN",
  "LOAN_OFFICER",
  "MANAGER",
  "CASHIER",
  "AUTHORIZER",
];

export default function UserFormPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    role: "LOAN_OFFICER",
    password: "",
    is_active: true,
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);

    try {
      const payload = {
        full_name: form.full_name,
        email: form.email,
        role: form.role, 
        password: form.password,
        is_active: form.is_active,
      };
      await createUser(payload);
      setSuccess("User created successfully.");
      
      setTimeout(() => navigate("/users"), 800);
    } catch (err) {
      console.error(err);
      const msg =
        err?.response?.data?.detail ||
        err?.message ||
        "Failed to create user.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "0.75rem",
        }}
      >
        <div>
          <h1 className="page-title">Create User</h1>
          <p className="page-subtitle">Add a new internal system user.</p>
        </div>

        <button
          type="button"
          onClick={() => navigate("/users")}
          style={{
            padding: "0.5rem 1rem",
            borderRadius: "999px",
            border: "1px solid #e5e7eb",
            background: "#f9fafb",
            fontSize: "0.85rem",
            cursor: "pointer",
          }}
        >
          ← Back to Users
        </button>
      </div>

      {error && (
        <div
          style={{
            marginBottom: "0.75rem",
            padding: "0.6rem 0.75rem",
            borderRadius: "0.5rem",
            background: "#fef2f2",
            color: "#b91c1c",
            fontSize: "0.9rem",
          }}
        >
          {error}
        </div>
      )}

      {success && (
        <div
          style={{
            marginBottom: "0.75rem",
            padding: "0.6rem 0.75rem",
            borderRadius: "0.5rem",
            background: "#ecfdf3",
            color: "#166534",
            fontSize: "0.9rem",
          }}
        >
          {success}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        style={{
          background: "#ffffff",
          padding: "1rem",
          borderRadius: "0.9rem",
          border: "1px solid #e5e7eb",
          boxShadow: "0 1px 3px rgba(15, 23, 42, 0.08)",
          maxWidth: "480px",
        }}
      >
        <div style={{ marginBottom: "0.75rem" }}>
          <label
            style={{
              display: "block",
              fontSize: "0.9rem",
              marginBottom: "0.25rem",
            }}
          >
            Full Name
          </label>
          <input
            type="text"
            name="full_name"
            value={form.full_name}
            onChange={handleChange}
            required
            style={{
              width: "100%",
              padding: "0.5rem 0.75rem",
              borderRadius: "0.5rem",
              border: "1px solid #d1d5db",
              fontSize: "0.9rem",
            }}
          />
        </div>

        <div style={{ marginBottom: "0.75rem" }}>
          <label
            style={{
              display: "block",
              fontSize: "0.9rem",
              marginBottom: "0.25rem",
            }}
          >
            Email
          </label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            required
            style={{
              width: "100%",
              padding: "0.5rem 0.75rem",
              borderRadius: "0.5rem",
              border: "1px solid #d1d5db",
              fontSize: "0.9rem",
            }}
          />
        </div>

        <div style={{ marginBottom: "0.75rem" }}>
          <label
            style={{
              display: "block",
              fontSize: "0.9rem",
              marginBottom: "0.25rem",
            }}
          >
            Role
          </label>
          <select
            name="role"
            value={form.role}
            onChange={handleChange}
            required
            style={{
              width: "100%",
              padding: "0.5rem 0.75rem",
              borderRadius: "0.5rem",
              border: "1px solid #d1d5db",
              fontSize: "0.9rem",
            }}
          >
            {ROLE_OPTIONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: "0.75rem" }}>
          <label
            style={{
              display: "block",
              fontSize: "0.9rem",
              marginBottom: "0.25rem",
            }}
          >
            Password
          </label>
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            required
            style={{
              width: "100%",
              padding: "0.5rem 0.75rem",
              borderRadius: "0.5rem",
              border: "1px solid #d1d5db",
              fontSize: "0.9rem",
            }}
          />
        </div>

        <div style={{ marginBottom: "0.9rem" }}>
          <label
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.35rem",
              fontSize: "0.9rem",
            }}
          >
            <input
              type="checkbox"
              name="is_active"
              checked={form.is_active}
              onChange={handleChange}
            />
            Active
          </label>
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          disabled={submitting}
        >
          {submitting ? "Creating..." : "Create User"}
        </button>
      </form>
    </div>
  );
}
