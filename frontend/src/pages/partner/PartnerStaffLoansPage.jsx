import React, { useEffect, useMemo, useState } from "react";
import { getPartnerUser } from "../../utils/partnerStorage";
import { getMyStaffLoans } from "../../api/partnerApi";

export default function PartnerStaffLoansPage() {
  const partnerUser = useMemo(() => getPartnerUser(), []);

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const money = (n) => `₦${Number(n || 0).toLocaleString()}`;

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await getMyStaffLoans();
      setRows(Array.isArray(res?.rows) ? res.rows : []);
    } catch (e) {
      console.error(e);
      setError(e?.response?.data?.detail || "Failed to load staff loans.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div>
      <h1 className="page-title">Staff Loans</h1>
      <p className="page-subtitle">
        View staff members in your organization who currently have loans and their repayment status.
      </p>

      <div
        style={{
          marginBottom: "1rem",
          padding: "0.6rem 0.75rem",
          borderRadius: "0.5rem",
          background: "rgba(59, 130, 246, 0.08)",
          border: "1px solid rgba(59, 130, 246, 0.18)",
          color: "#1e3a8a",
          fontSize: "0.9rem",
        }}
      >
        <strong>Organization:</strong>{" "}
        {partnerUser?.organization_id ? `Org #${partnerUser.organization_id}` : "—"}
        <button
          className="btn btn-accent"
          type="button"
          onClick={load}
          style={{ marginLeft: 12 }}
          disabled={loading}
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

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
      ) : rows.length === 0 ? (
        <div className="card">
          <p style={{ color: "#6b7280" }}>No staff loans found yet.</p>
        </div>
      ) : (
        <div className="card">
          <h2 style={{ fontSize: "1.05rem", fontWeight: 600, marginBottom: "0.75rem" }}>
            Loans ({rows.length})
          </h2>

          <div style={{ overflowX: "auto" }}>
            <table className="table" style={{ width: "100%" }}>
              <thead>
                <tr>
                  <th>Staff</th>
                  <th>Staff ID</th>
                  <th>Loan ID</th>
                  <th>Status</th>
                  <th>Principal</th>
                  <th>Total Payable</th>
                  <th>Total Due</th>
                  <th>Total Paid</th>
                  <th>Outstanding</th>
                  <th>Next Due</th>
                  <th>Next Amount</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const overdue =
                    r?.next_due_date &&
                    new Date(r.next_due_date).getTime() < Date.now();

                  return (
                    <tr key={`${r.loan_id}-${r.customer_id}`}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{r.full_name || "-"}</div>
                        <div style={{ color: "#6b7280", fontSize: "0.85rem" }}>
                          {r.email || "-"} {r.phone ? `• ${r.phone}` : ""}
                        </div>
                      </td>
                      <td>{r.staff_id || "-"}</td>
                      <td>{r.loan_id}</td>
                      <td>{r.loan_status || "-"}</td>
                      <td>{money(r.principal_amount)}</td>
                      <td>{money(r.total_payable)}</td>
                      <td>{money(r.total_due)}</td>
                      <td>{money(r.total_paid)}</td>
                      <td style={{ fontWeight: 700 }}>
                        {money(r.outstanding)}
                      </td>
                      <td style={{ color: overdue ? "#b91c1c" : "inherit" }}>
                        {r.next_due_date ? new Date(r.next_due_date).toLocaleDateString() : "-"}
                      </td>
                      <td>{r.next_amount_due != null ? money(r.next_amount_due) : "-"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: "0.75rem", color: "#6b7280", fontSize: "0.9rem" }}>
            Note: This is a read-only view. Loan repayments still depend on bank allocation/remittance processing.
          </div>
        </div>
      )}
    </div>
  );
}
