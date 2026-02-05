import React from "react";
import { Link } from "react-router-dom";

export default function SettingsPage() {
  return (
    <div style={{ display: "grid", gap: "1rem", maxWidth: 900 }}>
      <div>
        <h1 className="page-title" style={{ marginBottom: 4 }}>Settings</h1>
        <div style={{ color: "#6b7280" }}>
          Manage your account and system preferences.
        </div>
      </div>

      <div
        className="card"
        style={{
          padding: "1rem",
          borderRadius: "0.9rem",
          border: "1px solid #e5e7eb",
        }}
      >
        <h2 style={{ fontSize: "1.05rem", marginBottom: "0.5rem" }}>
          Account
        </h2>

        <p style={{ color: "#6b7280", marginBottom: "0.75rem" }}>
          Change your password and manage your login security.
        </p>

        <Link to="/settings/account" className="btn btn-primary">
          Manage Account
        </Link>
      </div>
    </div>
  );
}
