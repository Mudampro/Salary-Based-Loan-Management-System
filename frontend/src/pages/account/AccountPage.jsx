// frontend/src/pages/account/AccountPage.jsx
import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import useAuth from "../../hooks/useAuth";

function normalizeRole(rawRole) {
  if (!rawRole) return "";
  let r = String(rawRole).trim();
  if (r.includes(",")) r = r.split(",")[0].trim();
  if (r.includes(".")) r = r.split(".").pop().trim();
  return r.toUpperCase();
}

export default function AccountPage() {
  const { user } = useAuth();
  const role = useMemo(() => normalizeRole(user?.role), [user]);

  return (
    <div className="page" style={{ maxWidth: 900 }}>
      <div style={{ marginBottom: "1rem" }}>
        <h1 className="page-title">Manage Account</h1>
        <p className="page-subtitle" style={{ marginTop: 4 }}>
          Signed in as <b>{user?.email || "-"}</b> • Role: <b>{role || "UNKNOWN"}</b>
        </p>
      </div>

      <div style={{ display: "grid", gap: "1rem" }}>
        
        <div className="card" style={cardStyle}>
          <div style={cardHeader}>
            <div>
              <div style={cardTitle}>Change Password</div>
              <div style={cardDesc}>
                Update your password using your current password.
              </div>
            </div>

            <Link
              to="/account/change-password"
              className="btn btn-primary"
              style={pillBtn}
            >
              Open
            </Link>
          </div>
        </div>

        
        <div className="card" style={cardStyle}>
          <div style={cardHeader}>
            <div>
              <div style={cardTitle}>Forgot Password</div>
              <div style={cardDesc}>
                Generate a password reset link if you cannot remember your password.
              </div>
            </div>

            <Link
              to="/forgot-password"
              className="btn btn-primary"
              style={pillBtn}
            >
              Open
            </Link>
          </div>

          <div style={{ marginTop: "0.6rem", fontSize: "0.85rem", color: "#9a3412" }}>
            Demo note: reset link is printed in the backend console.
          </div>
        </div>
      </div>
    </div>
  );
}

const cardStyle = {
  borderRadius: "0.9rem",
  padding: "1rem",
  border: "1px solid #e5e7eb",
  boxShadow: "0 1px 3px rgba(15, 23, 42, 0.08)",
};

const cardHeader = {
  display: "flex",
  justifyContent: "space-between",
  gap: "1rem",
  flexWrap: "wrap",
  alignItems: "center",
};

const cardTitle = {
  fontWeight: 700,
  fontSize: "1rem",
};

const cardDesc = {
  color: "#6b7280",
  fontSize: "0.9rem",
  marginTop: 4,
};

const pillBtn = {
  borderRadius: "999px",
  padding: "0.55rem 1rem",
  whiteSpace: "nowrap",
};

