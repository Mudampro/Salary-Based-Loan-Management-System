import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { partnerLogin } from "../../api/partnerApi";
import { setPartnerToken, setPartnerUser } from "../../utils/partnerStorage";

export default function PartnerLoginPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await partnerLogin(email, password);
      setPartnerToken(data.access_token);
      setPartnerUser(data.user);
      navigate("/partner/dashboard");
    } catch (err) {
      console.error(err);
      const msg = err?.response?.data?.detail || "Login failed.";
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
      <div
        className="card"
        style={{
          width: "100%",
          maxWidth: 520,
          padding: "1.75rem 1.5rem",
        }}
      >
        <h1 style={{ fontSize: "1.3rem", fontWeight: 700, marginBottom: "0.25rem" }}>
          Organization Login
        </h1>
        <p style={{ marginTop: 0, color: "#6b7280", fontSize: "0.92rem" }}>
          Log in to remit salary deductions and view transactions.
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

        <form onSubmit={handleSubmit} style={{ marginTop: "1rem" }}>
          <div style={{ marginBottom: "0.75rem" }}>
            <label style={{ display: "block", fontSize: "0.9rem", marginBottom: "0.25rem" }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              required
              onChange={(e) => setEmail(e.target.value)}
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
              Password
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

          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <div style={{ marginTop: "1rem", fontSize: "0.88rem", color: "#6b7280" }}>
          If you don’t have a password yet, use the invite link from the bank.
        </div>
      </div>
    </div>
  );
}
