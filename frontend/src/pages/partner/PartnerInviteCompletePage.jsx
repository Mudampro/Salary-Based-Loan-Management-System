import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { completePartnerInvite } from "../../api/partnerApi";

export default function PartnerInvitePage() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await completePartnerInvite({ token, password });
      setSuccessMsg(res?.message || "Password set successfully.");
      setTimeout(() => navigate("/partner/login"), 800);
    } catch (err) {
      console.error(err);
      const msg = err?.response?.data?.detail || "Failed to complete invite.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f3f4f6",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        padding: "2rem 1rem",
      }}
    >
      <div className="card" style={{ width: "100%", maxWidth: 520, padding: "1.75rem 1.5rem" }}>
        <h1 style={{ fontSize: "1.3rem", fontWeight: 700, marginBottom: "0.25rem" }}>
          Set Your Password
        </h1>
        <p style={{ marginTop: 0, color: "#6b7280", fontSize: "0.92rem" }}>
          Complete your organization account setup.
        </p>

        {error && (
          <div
            style={{
              marginTop: "0.75rem",
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

        {successMsg && (
          <div
            style={{
              marginTop: "0.75rem",
              padding: "0.6rem 0.75rem",
              borderRadius: "0.5rem",
              background: "#ecfdf3",
              color: "#166534",
              fontSize: "0.9rem",
            }}
          >
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ marginTop: "1rem" }}>
          <div style={{ marginBottom: "0.75rem" }}>
            <label style={{ display: "block", fontSize: "0.9rem", marginBottom: "0.25rem" }}>
              New Password
            </label>
            <input
              type="password"
              value={password}
              required
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: "100%",
                padding: "0.55rem 0.75rem",
                borderRadius: "0.5rem",
                border: "1px solid #d1d5db",
              }}
            />
          </div>

          <div style={{ marginBottom: "0.9rem" }}>
            <label style={{ display: "block", fontSize: "0.9rem", marginBottom: "0.25rem" }}>
              Confirm Password
            </label>
            <input
              type="password"
              value={confirm}
              required
              onChange={(e) => setConfirm(e.target.value)}
              style={{
                width: "100%",
                padding: "0.55rem 0.75rem",
                borderRadius: "0.5rem",
                border: "1px solid #d1d5db",
              }}
            />
          </div>

          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? "Saving..." : "Set Password"}
          </button>
        </form>
      </div>
    </div>
  );
}
