import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { changeMyPassword } from "../../api/accountApi";

export default function ChangePasswordPage() {
  const navigate = useNavigate();

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setToast(null);

    if (!oldPassword || !newPassword) {
      setToast({ type: "error", message: "Old password and new password are required." });
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setToast({ type: "error", message: "New password and confirmation do not match." });
      return;
    }

    try {
      setSaving(true);

      await changeMyPassword({
        old_password: oldPassword,
        new_password: newPassword,
      });

      setToast({ type: "success", message: "Password changed successfully ✅" });

      setOldPassword("");
      setNewPassword("");
      setConfirmNewPassword("");

      
      setTimeout(() => navigate("/account"), 700);
    } catch (err) {
      console.error(err);
      const msg =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.message ||
        "Failed to change password.";
      setToast({ type: "error", message: msg });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page" style={{ maxWidth: 720 }}>
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

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem" }}>
        <div>
          <h1 className="page-title">Change Password</h1>
          <p className="page-subtitle" style={{ marginTop: 4 }}>
            Update your password securely.
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate("/account")}
          className="btn btn-secondary"
          style={{ borderRadius: "999px" }}
        >
          Back
        </button>
      </div>

      <div className="card" style={{ marginTop: "1rem", padding: "1rem", borderRadius: "0.9rem" }}>
        <form onSubmit={handleSubmit} style={{ display: "grid", gap: "0.85rem" }}>
          <div>
            <label style={labelStyle}>Old Password</label>
            <input
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Confirm New Password</label>
            <input
              type="password"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              style={inputStyle}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "center" }}>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving}
              style={{
                width: "100%",
                maxWidth: 360,
                borderRadius: "999px",
                padding: "0.65rem 1rem",
                textAlign: "center",
              }}
            >
              {saving ? "Saving..." : "Save Password"}
            </button>
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
  borderRadius: "0.5rem",
  border: "1px solid #d1d5db",
};
