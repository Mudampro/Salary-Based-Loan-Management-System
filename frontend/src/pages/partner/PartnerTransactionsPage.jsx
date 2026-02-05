import React, { useEffect, useState } from "react";
import { getMyPartnerTransactions } from "../../api/partnerApi";

export default function PartnerTransactionsPage() {
  const [txs, setTxs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await getMyPartnerTransactions();
      setTxs(Array.isArray(res) ? res : []);
    } catch (e) {
      console.error(e);
      setError(e?.response?.data?.detail || "Failed to load transactions.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div>
      <h1 className="page-title">Transactions</h1>
      <p className="page-subtitle">All remittance transactions submitted by your organization.</p>

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
      ) : txs.length === 0 ? (
        <div className="card">
          <p style={{ color: "#6b7280" }}>No transactions yet.</p>
        </div>
      ) : (
        <div className="card">
          <h2 style={{ fontSize: "1.05rem", fontWeight: 600, marginBottom: "0.75rem" }}>
            Transactions ({txs.length})
          </h2>

          <div style={{ overflowX: "auto" }}>
            <table className="table" style={{ width: "100%" }}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Reference</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {txs.map((t) => (
                  <tr key={t.id}>
                    <td>{t.paid_at ? new Date(t.paid_at).toLocaleString() : "-"}</td>
                    <td>{t.reference || "-"}</td>
                    <td>{t.amount}</td>
                    <td>{t.match_status || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button className="btn btn-accent" type="button" onClick={load} style={{ marginTop: "0.75rem" }}>
            Refresh
          </button>
        </div>
      )}
    </div>
  );
}
