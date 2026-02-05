// frontend/src/pages/auth/ResetPasswordPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { resetPasswordWithToken } from "../../api/accountApi";

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const query = useQuery();

  const token = query.get("token") || "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  const [working, setWorking] = useState(false);
  const [toast, setToast] = useState(null); 

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setToast(null);

    if (!token) {
      setToast({ type: "error", message: "Missing token. Please use the reset link from the email/console." });
      return;
    }

    if (!newPassword) {
      setToast({ type: "error", message: "New password is required." });
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setToast({ type: "error", message: "Password confirmation does not match." });
      return;
    }

    try {
      setWorking(true);

      const res = await resetPasswordWithToken({
        token,
        new_password: newPassword,
      });

      const msg = res?.detail || res?.message || "Password reset successful. You can now log in.";
      setToast({ type: "success", message: msg });

      setTimeout(() => navigate("/login"), 900);
    } catch (err) {
      console.error(err);
      const msg = err?.response?.data?.detail || err?.message || "Failed to reset password.";
      setToast({ type: "error", message: msg });
    } finally {
      setWorking(false);
    }
  };

  return (
    <div className="page" style={{ maxWidth: 720, margin: "0 auto" }}>
      
      {toast && (
        <div
          style={{
            position: "fixed",
            right: "1.5rem",
            bottom: "1.5rem",
            zIndex: 60,
            padding: "0.75rem 1rem",
            borderRadius: "0.75rem",
            background: toast.type === "success" ? "#ecfdf3" : "#fef2f2",
            color: toast.type === "success" ? "#166534" : "#b91c1c",
            fontSize: "0.9rem",
            boxShadow: "0 4px 12px rgba(15, 23, 42, 0.25)",
            maxWidth: "360px",
          }}
        >
          {toast.message}
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", alignItems: "center" }}>
        <div>
          <h1 className="page-title">Reset Password</h1>
          <p className="page-subtitle" style={{ marginTop: 4 }}>
            Set a new password to access your account.
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate("/login")}
          className="btn btn-secondary"
          style={{ borderRadius: "999px" }}
        >
          Back to Login
        </button>
      </div>

      <div className="card" style={{ marginTop: "1rem", padding: "1rem", borderRadius: "0.9rem" }}>
        {!token && (
          <div
            style={{
              padding: "0.75rem",
              borderRadius: "0.75rem",
              background: "#fff7ed",
              border: "1px solid #fed7aa",
              color: "#9a3412",
              marginBottom: "0.9rem",
            }}
          >
            Missing token in URL. Your reset link must look like:
            <div style={{ marginTop: 6, fontSize: "0.85rem", color: "#6b7280" }}>
              /reset-password?token=xxxxx
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "grid", gap: "0.85rem" }}>
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

          <div>
            <label style={labelStyle}>Confirm New Password</label>
            <input
              type="password"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              style={inputStyle}
              placeholder="Re-enter new password"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={working}
            style={{ borderRadius: "999px", padding: "0.65rem 1rem" }}
          >
            {working ? "Resetting..." : "Reset Password"}
          </button>
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
  borderRadius: "0.5rem",
  border: "1px solid #d1d5db",
};
