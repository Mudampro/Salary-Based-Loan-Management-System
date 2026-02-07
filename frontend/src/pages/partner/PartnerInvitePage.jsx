// frontend/src/pages/partner/PartnerInvitePage.jsx

import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { completePartnerInvite, validatePartnerInvite } from "../../api/partnerApi";

export default function PartnerInvitePage() {
  const { token } = useParams();
  const navigate = useNavigate();

  
  const inviteToken = useMemo(() => {
    const t = token ? String(token).trim() : "";
    return t.endsWith("/") ? t.slice(0, -1) : t;
  }, [token]);

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    let mounted = true;

    async function run() {
      setValidating(true);
      setError("");

      if (!inviteToken) {
        if (mounted) {
          setError("Invite token is missing. Please use the invite link provided by the bank.");
          setValidating(false);
        }
        return;
      }

      try {
        await validatePartnerInvite(inviteToken);
        if (mounted) setError("");
      } catch (err) {
        if (!mounted) return;

        
        const status = err?.response?.status;
        const data = err?.response?.data;
        const url = err?.config?.url;

        console.log("INVITE TOKEN:", inviteToken);
        console.log("VALIDATE URL:", url);
        console.log("VALIDATE STATUS:", status);
        console.log("VALIDATE DATA:", data);

        
        const detail =
          data?.detail ||
          (typeof data === "string" ? data.slice(0, 200) : null) ||
          `Validate failed${status ? ` (${status})` : ""}. Check Network tab.`;

        setError(detail);
      } finally {
        if (mounted) setValidating(false);
      }
    }

    run();
    return () => {
      mounted = false;
    };
  }, [inviteToken]);

  const validateForm = () => {
    if (!inviteToken) return "Invite token is missing.";
    if (password.length < 8) return "Password must be at least 8 characters.";
    if (password !== confirm) return "Passwords do not match.";
    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    const v = validateForm();
    if (v) {
      setError(v);
      return;
    }

    setLoading(true);
    try {
      const res = await completePartnerInvite({ token: inviteToken, password });
      setSuccessMsg(res?.message || "Password set successfully. Redirecting...");
      setPassword("");
      setConfirm("");
      setTimeout(() => navigate("/partner/login"), 800);
    } catch (err) {
      const status = err?.response?.status;
      const data = err?.response?.data;
      const url = err?.config?.url;

      console.log("COMPLETE URL:", url);
      console.log("COMPLETE STATUS:", status);
      console.log("COMPLETE DATA:", data);

      const detail =
        data?.detail ||
        (typeof data === "string" ? data.slice(0, 200) : null) ||
        `Complete failed${status ? ` (${status})` : ""}. Check Network tab.`;

      setError(detail);
    } finally {
      setLoading(false);
    }
  };

  const disabled = loading || !!successMsg || validating || !inviteToken;

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
          Complete Organization Invite
        </h1>
        <p style={{ marginTop: 0, color: "#6b7280", fontSize: "0.92rem" }}>
          Set your password to activate your organization account.
        </p>

        {validating && (
          <div style={{ marginTop: "0.75rem", color: "#6b7280", fontSize: "0.92rem" }}>
            Checking invite…
          </div>
        )}

        {!validating && error && (
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
              New Password (min 8 chars)
            </label>
            <input
              type="password"
              value={password}
              required
              disabled={disabled}
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
              disabled={disabled}
              onChange={(e) => setConfirm(e.target.value)}
              style={{
                width: "100%",
                padding: "0.55rem 0.75rem",
                borderRadius: "0.5rem",
                border: "1px solid #d1d5db",
              }}
            />
          </div>

          <button className="btn btn-primary" type="submit" disabled={disabled}>
            {loading ? "Saving..." : "Set Password"}
          </button>
        </form>

        <div style={{ marginTop: "1rem", fontSize: "0.88rem", color: "#6b7280" }}>
          After setting your password, you’ll be redirected to the Organization Login page.
        </div>
      </div>
    </div>
  );
}
