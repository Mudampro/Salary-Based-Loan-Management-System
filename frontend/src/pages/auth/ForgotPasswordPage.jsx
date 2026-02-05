// frontend/src/pages/auth/ForgotPasswordPage.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { forgotPassword } from "../../api/accountApi";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");

  const [working, setWorking] = useState(false);
  const [toast, setToast] = useState(null); // { type, message }

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setToast(null);

    if (!email.trim()) {
      setToast({ type: "error", message: "Please enter your email." });
      return;
    }

    try {
      setWorking(true);
      const res = await forgotPassword({ email: email.trim() });

      const msg = res?.detail || res?.message || "If the email exists, a reset link has been generated.";
      setToast({ type: "success", message: msg });
    } catch (err) {
      console.error(err);
      const msg = err?.response?.data?.detail || err?.message || "Failed to request password reset.";
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
          <h1 className="page-title">Forgot Password</h1>
          <p className="page-subtitle" style={{ marginTop: 4 }}>
            Enter your email to generate a reset link.
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
        <form onSubmit={handleSubmit} style={{ display: "grid", gap: "0.85rem" }}>
          <div>
            <label style={labelStyle}>Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={inputStyle}
              placeholder="e.g. user@example.com"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={working}
            style={{ borderRadius: "999px", padding: "0.65rem 1rem" }}
          >
            {working ? "Generating..." : "Generate Reset Link"}
          </button>

          <div style={{ fontSize: "0.85rem", color: "#6b7280" }}>
            Demo note: your backend prints the reset link in the console.
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
