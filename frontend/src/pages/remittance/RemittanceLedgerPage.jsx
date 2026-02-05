import React, { useEffect, useMemo, useState } from "react";
import { getOrganizations } from "../../api/organizationsApi";
import {
  getAdminRemittanceSummary,
  getAdminRemittanceTransactions,
  getTransactionAllocations,
  reverseInboundTransaction,
  applyInboundTransaction,
} from "../../api/adminRemittanceApi";

export default function RemittanceLedgerPage() {
  const [orgs, setOrgs] = useState([]);
  const [orgId, setOrgId] = useState("");

  const [summary, setSummary] = useState(null);
  const [rows, setRows] = useState([]);

  const [allocTxId, setAllocTxId] = useState(null);
  const [allocations, setAllocations] = useState([]);
  const [allocLoading, setAllocLoading] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");

  
  const [confirmBox, setConfirmBox] = useState({
    open: false,
    action: null, 
    tx: null,     
  });

  const selectedRow = useMemo(() => {
    if (!allocTxId) return null;
    return rows.find((r) => r?.tx?.id === allocTxId) || null;
  }, [rows, allocTxId]);

  useEffect(() => {
    (async () => {
      try {
        const data = await getOrganizations();
        setOrgs(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  const loadLedger = async (id) => {
    if (!id) return;
    setLoading(true);
    setError("");
    setMsg("");
    setSummary(null);
    setRows([]);
    setAllocTxId(null);
    setAllocations([]);
    setConfirmBox({ open: false, action: null, tx: null });

    try {
      const [s, t] = await Promise.all([
        getAdminRemittanceSummary(Number(id)),
        getAdminRemittanceTransactions(Number(id)),
      ]);

      setSummary(s);
      setRows(Array.isArray(t?.rows) ? t.rows : []);
    } catch (e) {
      console.error(e);
      setError(e?.response?.data?.detail || "Failed to load remittance ledger.");
    } finally {
      setLoading(false);
    }
  };

  const handleOrgChange = async (e) => {
    const id = e.target.value;
    setOrgId(id);
    await loadLedger(id);
  };

  const toggleAllocations = async (txId) => {
    if (allocTxId === txId) {
      setAllocTxId(null);
      setAllocations([]);
      return;
    }

    setAllocTxId(txId);
    setAllocations([]);
    setAllocLoading(true);
    setError("");

    try {
      const a = await getTransactionAllocations(txId);
      setAllocations(Array.isArray(a) ? a : []);
    } catch (e) {
      console.error(e);
      setError(e?.response?.data?.detail || "Failed to load allocations.");
    } finally {
      setAllocLoading(false);
    }
  };

  const money = (n) => `₦${Number(n || 0).toLocaleString()}`;

  
  const askConfirm = (action, tx) => {
    setError("");
    setMsg("");
    setConfirmBox({ open: true, action, tx });
  };

  const closeConfirm = () => {
    setConfirmBox({ open: false, action: null, tx: null });
  };

  const runConfirmedAction = async () => {
    const action = confirmBox.action;
    const tx = confirmBox.tx;
    const txId = tx?.id;
    if (!action || !txId) return;

    setLoading(true);
    setError("");
    setMsg("");

    try {
      if (action === "APPLY") {
        const res = await applyInboundTransaction(txId);
        setMsg(res?.message || "Transaction allocated successfully.");
      }

      if (action === "REVERSE") {
        
        if (String(tx.match_status || "").toUpperCase() === "UNMATCHED") {
          setError("This transaction is UNMATCHED (no allocations). Nothing to reverse.");
          return;
        }
        const res = await reverseInboundTransaction(txId);
        setMsg(res?.message || "Transaction reversed.");
      }

      closeConfirm();
      await loadLedger(orgId);
    } catch (e) {
      console.error(e);
      setError(e?.response?.data?.detail || "Action failed.");
    } finally {
      setLoading(false);
    }
  };

  const confirmTitle =
    confirmBox.action === "APPLY"
      ? "Allocate this transaction?"
      : confirmBox.action === "REVERSE"
      ? "Reverse this transaction?"
      : "";

  const confirmDesc =
    confirmBox.action === "APPLY"
      ? "This will apply the remittance amount to eligible repayments and create allocation records."
      : confirmBox.action === "REVERSE"
      ? "This will undo allocations, roll back repayments, and mark the transaction as disputed."
      : "";

  return (
    <div>
      <h1 className="page-title">Remittance Ledger</h1>
      <p className="page-subtitle">
        Select an organization to view remittance totals, transactions, allocations and reversals.
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

      {msg && (
        <div
          style={{
            marginBottom: "1rem",
            padding: "0.6rem 0.75rem",
            borderRadius: "0.5rem",
            background: "#ecfdf3",
            color: "#166534",
            fontSize: "0.9rem",
            whiteSpace: "pre-wrap",
          }}
        >
          {msg}
        </div>
      )}

      
      {confirmBox.open && confirmBox.tx && (
        <div
          className="card"
          style={{
            marginBottom: "1rem",
            border: "1px solid #f59e0b",
            background: "rgba(255, 237, 213, 0.35)",
          }}
        >
          <div style={{ fontSize: "1rem", fontWeight: 800, marginBottom: 6 }}>
            {confirmTitle}
          </div>
          <div style={{ color: "#374151", fontSize: "0.92rem" }}>{confirmDesc}</div>

          <div style={{ marginTop: 10, fontSize: "0.92rem" }}>
            <div>
              <strong>Reference:</strong> {confirmBox.tx.reference}
            </div>
            <div>
              <strong>Amount:</strong> {money(confirmBox.tx.amount)}
            </div>
            <div>
              <strong>Status:</strong> {confirmBox.tx.match_status}
            </div>
          </div>

          <div style={{ marginTop: 12, display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
            <button
              className="btn btn-primary"
              type="button"
              onClick={runConfirmedAction}
              disabled={loading}
            >
              {loading ? "Processing..." : "Yes, Continue"}
            </button>

            <button
              className="btn btn-accent"
              type="button"
              onClick={closeConfirm}
              disabled={loading}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="card" style={{ marginBottom: "1rem" }}>
        <h2 style={{ fontSize: "1.05rem", fontWeight: 600, marginBottom: "0.75rem" }}>
          Select Organization
        </h2>

        <select
          value={orgId}
          onChange={handleOrgChange}
          style={{
            width: "100%",
            maxWidth: 480,
            padding: "0.55rem 0.7rem",
            borderRadius: "0.5rem",
            border: "1px solid #d1d5db",
          }}
        >
          <option value="">-- Select --</option>
          {orgs.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name || `Organization #${o.id}`}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <p style={{ color: "#6b7280" }}>Loading...</p>
      ) : (
        <>
          {summary && (
            <div className="card" style={{ marginBottom: "1rem" }}>
              <h2 style={{ fontSize: "1.05rem", fontWeight: 600, marginBottom: "0.5rem" }}>
                Summary
              </h2>

              <div style={{ fontSize: "0.95rem" }}>
                <div><strong>Total Remitted:</strong> {money(summary.total_remitted)}</div>
                <div><strong>Total Applied:</strong> {money(summary.total_applied)}</div>
                <div><strong>Unallocated Balance:</strong> {money(summary.unallocated_balance)}</div>
                <div style={{ marginTop: "0.4rem", color: "#6b7280" }}>
                  <strong>Total Outstanding:</strong> {money(summary.total_outstanding)}
                </div>
              </div>
            </div>
          )}

          {rows.length > 0 ? (
            <div className="card" style={{ marginBottom: "1rem" }}>
              <h2 style={{ fontSize: "1.05rem", fontWeight: 600, marginBottom: "0.75rem" }}>
                Transactions
              </h2>

              <div style={{ overflowX: "auto" }}>
                <table className="table" style={{ width: "100%" }}>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Reference</th>
                      <th>Amount</th>
                      <th>Applied</th>
                      <th>Unallocated</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => {
                      const tx = r.tx;
                      const isOpen = allocTxId === tx.id;

                      return (
                        <tr
                          key={tx.id}
                          style={{
                            background: isOpen ? "rgba(255, 237, 213, 0.35)" : "transparent",
                          }}
                        >
                          <td>{tx.paid_at ? new Date(tx.paid_at).toLocaleString() : "-"}</td>
                          <td>{tx.reference}</td>
                          <td>{tx.amount}</td>
                          <td>{r.applied_amount}</td>
                          <td>{r.unallocated_amount}</td>
                          <td>{tx.match_status}</td>

                          <td style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                            <button
                              className="btn btn-accent"
                              type="button"
                              onClick={() => toggleAllocations(tx.id)}
                            >
                              {isOpen ? "Hide Allocations" : "Allocations"}
                            </button>

                            <button
                              className="btn btn-primary"
                              type="button"
                              onClick={() => askConfirm("APPLY", tx)}
                              disabled={loading || String(tx.match_status || "").toUpperCase() === "MATCHED"}
                              title={
                                String(tx.match_status || "").toUpperCase() === "MATCHED"
                                  ? "This transaction is already MATCHED."
                                  : "Allocate this transaction."
                              }
                            >
                              Apply
                            </button>

                            <button
                              className="btn btn-danger"
                              type="button"
                              onClick={() => askConfirm("REVERSE", tx)}
                              disabled={loading || String(tx.match_status || "").toUpperCase() === "UNMATCHED"}
                              title={
                                String(tx.match_status || "").toUpperCase() === "UNMATCHED"
                                  ? "UNMATCHED transactions have no allocations to reverse."
                                  : "Reverse this remittance and roll back repayments."
                              }
                            >
                              Reverse
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {allocTxId && (
                <div style={{ marginTop: "1rem" }}>
                  <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "0.5rem" }}>
                    Allocations for Tx #{allocTxId}
                  </h3>

                  {allocLoading ? (
                    <p style={{ color: "#6b7280" }}>Loading allocations...</p>
                  ) : allocations.length === 0 ? (
                    <div style={{ color: "#6b7280" }}>
                      No allocations.
                      <div style={{ marginTop: 6, fontSize: "0.9rem" }}>
                        This usually means the transaction is <strong>UNMATCHED</strong> (money not applied),
                        or there were no eligible repayments under your allocation rules.
                      </div>
                    </div>
                  ) : (
                    <div style={{ overflowX: "auto" }}>
                      <table className="table" style={{ width: "100%" }}>
                        <thead>
                          <tr>
                            <th>Allocation ID</th>
                            <th>Repayment ID</th>
                            <th>Amount Applied</th>
                            <th>Created</th>
                          </tr>
                        </thead>
                        <tbody>
                          {allocations.map((a) => (
                            <tr key={a.id}>
                              <td>{a.id}</td>
                              <td>{a.repayment_id}</td>
                              <td>{a.amount_applied}</td>
                              <td>{a.created_at ? new Date(a.created_at).toLocaleString() : "-"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : orgId ? (
            <div className="card">
              <p style={{ color: "#6b7280" }}>No transactions for this organization.</p>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
