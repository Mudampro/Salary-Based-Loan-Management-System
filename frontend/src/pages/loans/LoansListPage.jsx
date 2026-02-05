// frontend/src/pages/loans/LoansListPage.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getLoans } from "../../api/loansApi";

const STATUS_OPTIONS = [
  { value: "", label: "All" },
  { value: "ACTIVE", label: "Active" },
  { value: "CLOSED", label: "Closed" },
  { value: "DEFAULTED", label: "Defaulted" },
];

export default function LoansListPage() {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError("");

        const params = {};
        if (statusFilter) {
          
          params.status_filter = statusFilter;
          params.status = statusFilter;
        }

        const data = await getLoans(params);
        setLoans(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
        const msg =
          err?.response?.data?.detail ||
          err?.message ||
          "Failed to load loans.";
        setError(msg);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [statusFilter]);

  const handleRowClick = (id) => {
    navigate(`/loans/${id}`);
  };

  const formatMoney = (value) => {
    if (value === null || value === undefined) return "-";
    const num = Number(value);
    if (Number.isNaN(num)) return String(value);
    return num.toLocaleString("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 2,
    });
  };

  const formatDate = (value) => {
    if (!value) return "-";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value);
    return d.toLocaleDateString("en-GB", {
      year: "numeric",
      month: "short",
      day: "2-digit",
    });
  };

  const formatRate = (value) => {
    if (value === null || value === undefined) return "-";
    const num = Number(value);
    if (Number.isNaN(num)) return String(value);
    
    return `${num}%`;
  };

  return (
    <div>
      <h1 className="page-title">Loans</h1>
      <p className="page-subtitle">View disbursed loans and their current status.</p>

      
      <div
        style={{
          margin: "0.75rem 0 1rem",
          padding: "0.75rem 1rem",
          borderRadius: "0.75rem",
          background: "#f9fafb",
          border: "1px solid #e5e7eb",
          display: "flex",
          justifyContent: "space-between",
          gap: "1rem",
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <div>
          <div
            style={{
              fontSize: "0.8rem",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              color: "#6b7280",
              marginBottom: "0.35rem",
            }}
          >
            Status
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.value || "ALL"}
                type="button"
                className={
                  statusFilter === opt.value
                    ? "status-pill status-pill-active"
                    : "status-pill"
                }
                onClick={() => setStatusFilter(opt.value)}
                disabled={loading && statusFilter === opt.value}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ fontSize: "0.85rem", color: "#6b7280", textAlign: "right" }}>
          {loading ? "Refreshing list..." : `${loans.length} loan(s)`}
        </div>
      </div>

      {error && (
        <div
          style={{
            marginBottom: "0.75rem",
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

      {loading && <p>Loading loans...</p>}

      {!loading && !error && loans.length === 0 && <p>No loans found yet.</p>}

      {!loading && !error && loans.length > 0 && (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Application ID</th>
                <th>Principal</th>
                <th>Total Payable</th>
                <th>Interest Rate</th>
                <th>Status</th>
                <th>Start</th>
                <th>End</th>
              </tr>
            </thead>
            <tbody>
              {loans.map((loan) => (
                <tr
                  key={loan.id}
                  className="clickable-row"
                  onClick={() => handleRowClick(loan.id)}
                >
                  <td>{loan.id}</td>
                  <td>{loan.application_id}</td>
                  <td>{formatMoney(loan.principal_amount)}</td>
                  <td>{formatMoney(loan.total_payable)}</td>
                  <td>{formatRate(loan.interest_rate)}</td>
                  <td>{loan.status || "-"}</td>
                  <td>{formatDate(loan.start_date)}</td>
                  <td>{formatDate(loan.end_date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
