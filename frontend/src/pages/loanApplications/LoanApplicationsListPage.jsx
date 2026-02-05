import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getLoanApplications } from "../../api/loanApplicationsApi";

const STATUS_OPTIONS = [
  { value: "", label: "All" },
  { value: "PENDING", label: "Pending" },
  { value: "UNDER_REVIEW", label: "Under Review" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
  { value: "DISBURSED", label: "Disbursed" },
];

export default function LoanApplicationsListPage() {
  const [applications, setApplications] = useState([]);
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
        }

        const data = await getLoanApplications(params);
        setApplications(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
        setError("Failed to load loan applications.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [statusFilter]);

  const handleRowClick = (id) => {
    navigate(`/loan-applications/${id}`);
  };

  const renderStatusBadge = (status) => {
    if (!status) return "-";
    const s = status.toUpperCase();

    let bg = "#e5e7eb";
    let color = "#111827";
    if (s === "PENDING") {
      bg = "#fef3c7";
      color = "#92400e";
    } else if (s === "UNDER_REVIEW") {
      bg = "#dbeafe";
      color = "#1d4ed8";
    } else if (s === "APPROVED") {
      bg = "#dcfce7";
      color = "#166534";
    } else if (s === "REJECTED") {
      bg = "#fee2e2";
      color = "#b91c1c";
    } else if (s === "DISBURSED") {
      bg = "#e0f2fe";
      color = "#075985";
    }

    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          padding: "0.15rem 0.6rem",
          borderRadius: "9999px",
          fontSize: "0.75rem",
          fontWeight: 500,
          backgroundColor: bg,
          color,
        }}
      >
        {s}
      </span>
    );
  };

  const formatCurrency = (value) => {
    if (value === null || value === undefined) return "-";
    const num = Number(value);
    if (Number.isNaN(num)) return String(value);
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 2,
    }).format(num);
  };

  return (
    <div>
      <h1 className="page-title">Loan Applications</h1>
      <p className="page-subtitle">
        View and filter loan requests submitted by staff via organization links.
      </p>
      <p
        style={{
          fontSize: "0.8rem",
          color: "#6b7280",
          marginTop: "0.2rem",
          marginBottom: "0.8rem",
        }}
      >
        Tip: click any row to view full application details.
      </p>

      {/* Filter bar with pill buttons */}
      <div
        style={{
          marginBottom: "1rem",
          padding: "0.75rem 1rem",
          borderRadius: "0.75rem",
          background: "#f9fafb",
          border: "1px solid #e5e7eb",
          display: "flex",
          flexWrap: "wrap",
          gap: "0.75rem",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ flex: 1, minWidth: 260 }}>
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

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "0.5rem",
            }}
          >
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

        <div
          style={{
            fontSize: "0.85rem",
            color: "#6b7280",
            textAlign: "right",
          }}
        >
          {loading
            ? "Refreshing list..."
            : `${applications.length} application(s)`}
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

      {loading && <p>Loading applications...</p>}

      {!loading && !error && applications.length === 0 && (
        <p>No loan applications found.</p>
      )}

      {!loading && !error && applications.length > 0 && (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Customer</th>
                <th>Organization</th>
                <th>Product</th>
                <th>Requested Amount</th>
                <th>Tenor (months)</th>
                <th>Status</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((app) => {
                const customerName =
                  app.customer?.full_name || `Customer #${app.customer_id}`;
                const organizationName =
                  app.customer?.organization?.name || "-";
                const productName =
                  app.product?.name || `Product #${app.product_id}`;

                return (
                  <tr
                    key={app.id}
                    className="clickable-row"
                    onClick={() => handleRowClick(app.id)}
                  >
                    <td>{app.id}</td>
                    <td>{customerName}</td>
                    <td>{organizationName}</td>
                    <td>{productName}</td>
                    <td>{formatCurrency(app.requested_amount)}</td>
                    <td>{app.tenor_months}</td>
                    <td>{renderStatusBadge(app.status)}</td>
                    <td>
                      {app.created_at
                        ? new Date(app.created_at).toLocaleString()
                        : "-"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
