import React, { useState } from "react";
import { Link } from "react-router-dom";

export default function ManageAccountPage() {
  
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg("");
    setErr("");

    

    if (!oldPassword || !newPassword) {
      setErr("Old password and new password are required.");
      return;
    }

    if (newPassword.length < 6) {
      setErr("New password should be at least 6 characters.");
      return;
    }

    
    setMsg("UI ready ✅ Next step: connect to backend endpoint.");
    setOldPassword("");
    setNewPassword("");
  };

  return (
    <div style={{ display: "grid", gap: "1rem", maxWidth: 900 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem" }}>
        <div>
          <h1 className="page-title" style={{ marginBottom: 4 }}>Manage Account</h1>
          <div style={{ color: "#6b7280" }}>
            Change your password and manage login access.
          </div>
        </div>

        <Link to="/settings" className="btn btn-secondary">
          Back
        </Link>
      </div>

      <div
        className="card"
        style={{
          padding: "1rem",
          borderRadius: "0.9rem",
          border: "1px solid #e5e7eb",
          maxWidth: 650,
        }}
      >
        <h2 style={{ fontSize: "1.05rem", marginBottom: "0.75rem" }}>
          Change Password
        </h2>

        {err && (
          <div
            style={{
              marginBottom: "0.75rem",
              padding: "0.55rem 0.75rem",
              borderRadius: "0.6rem",
              background: "#fef2f2",
              color: "#b91c1c",
              fontSize: "0.9rem",
            }}
          >
            {err}
          </div>
        )}

        {msg && (
          <div
            style={{
              marginBottom: "0.75rem",
              padding: "0.55rem 0.75rem",
              borderRadius: "0.6rem",
              background: "#ecfdf5",
              color: "#065f46",
              fontSize: "0.9rem",
            }}
          >
            {msg}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "grid", gap: "0.75rem" }}>
          <div>
            <label style={labelStyle}>Old Password</label>
            <input
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              style={inputStyle}
              placeholder="Enter old password"
            />
          </div>

          <div>
            <label style={labelStyle}>New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              style={inputStyle}
              placeholder="Enter new password"
            />
          </div>

          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <button className="btn btn-primary" type="submit">
              Change Password
            </button>

            <span style={{ color: "#6b7280", fontSize: "0.85rem" }}>
              Forgot password will be added next.
            </span>
          </div>
        </form>
      </div>
    </div>
  );
}

const labelStyle = {
  display: "block",
  marginBottom: "0.25rem",
  fontSize: "0.875rem",
  color: "#374151",
};

const inputStyle = {
  width: "100%",
  padding: "0.55rem 0.75rem",
  borderRadius: "0.6rem",
  border: "1px solid #d1d5db",
};
