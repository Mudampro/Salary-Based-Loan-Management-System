import React, { useEffect, useState } from "react";
import usePartnerProtectedRoute from "../../hooks/usePartnerProtectedRoute";
import { getMyRemittanceAccount } from "../../api/partnerApi";

export default function PartnerRemittanceAccountPage() {
  usePartnerProtectedRoute();

  const [acct, setAcct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      try {
        const data = await getMyRemittanceAccount();
        setAcct(data);
      } catch (e) {
        console.error(e);
        const msg =
          e?.response?.data?.detail ||
          "Failed to load remittance account. Contact the bank.";
        setError(msg);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const copy = async (text) => {
    try {
      await navigator.clipboard.writeText(String(text || ""));
      alert("Copied!");
    } catch {
      alert("Copy failed. Please copy manually.");
    }
  };

  return (
    <div>
      <h1 className="page-title">Remittance Account</h1>
      <p className="page-subtitle">
        Use these bank details to remit salary deductions. Your remittance will
        be applied automatically to repayments.
      </p>

      {error && (
        <div
          style={{
            marginBottom: "1rem",
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

      {loading ? (
        <p style={{ color: "#6b7280" }}>Loading...</p>
      ) : acct ? (
        <div className="card" style={{ maxWidth: 640 }}>
          <div style={{ display: "grid", gap: "0.75rem" }}>
            <div>
              <div style={{ fontSize: "0.85rem", color: "#6b7280" }}>
                Bank Name
              </div>
              <div style={{ fontSize: "1rem", fontWeight: 600 }}>
                {acct.bank_name || "-"}
              </div>
              <button
                className="btn btn-accent"
                type="button"
                style={{ marginTop: "0.4rem" }}
                onClick={() => copy(acct.bank_name)}
              >
                Copy
              </button>
            </div>

            <div>
              <div style={{ fontSize: "0.85rem", color: "#6b7280" }}>
                Account Number
              </div>
              <div style={{ fontSize: "1.2rem", fontWeight: 700 }}>
                {acct.account_number}
              </div>
              <button
                className="btn btn-primary"
                type="button"
                style={{ marginTop: "0.4rem" }}
                onClick={() => copy(acct.account_number)}
              >
                Copy
              </button>
            </div>

            <div>
              <div style={{ fontSize: "0.85rem", color: "#6b7280" }}>
                Account Name
              </div>
              <div style={{ fontSize: "1rem", fontWeight: 600 }}>
                {acct.account_name || "-"}
              </div>
              <button
                className="btn btn-accent"
                type="button"
                style={{ marginTop: "0.4rem" }}
                onClick={() => copy(acct.account_name)}
              >
                Copy
              </button>
            </div>

            <div style={{ fontSize: "0.9rem", color: "#374151" }}>
              <strong>Note:</strong> Always include a unique bank transfer
              reference. Duplicate references will be rejected.
            </div>
          </div>
        </div>
      ) : (
        <div className="card" style={{ maxWidth: 640, color: "#b91c1c" }}>
          No active remittance account found. Contact the bank admin.
        </div>
      )}
    </div>
  );
}
