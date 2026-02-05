// frontend/src/pages/reports/OrgMonthlyReportPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { getOrganizations } from "../../api/organizationsApi";
import { getOrgMonthlyReportV2 } from "../../api/reportsApi"; 

const MONTHS = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
];

function money(value) {
  if (value === null || value === undefined) return "-";
  const n = Number(value);
  if (Number.isNaN(n)) return "-";
  return n.toLocaleString("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 2,
  });
}

export default function OrgMonthlyReportPage() {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const [organizations, setOrganizations] = useState([]);
  const [orgId, setOrgId] = useState("");
  const [year, setYear] = useState(currentYear);
  const [month, setMonth] = useState(currentMonth);

  const [report, setReport] = useState(null);
  const [loadingOrgs, setLoadingOrgs] = useState(true);
  const [loadingReport, setLoadingReport] = useState(false);
  const [error, setError] = useState("");

  const yearOptions = useMemo(() => {
    const years = [];
    for (let y = currentYear - 2; y <= currentYear + 2; y += 1) years.push(y);
    return years;
  }, [currentYear]);

  useEffect(() => {
    async function loadOrgs() {
      try {
        setLoadingOrgs(true);
        const data = await getOrganizations();
        setOrganizations(Array.isArray(data) ? data : []);
        if (Array.isArray(data) && data.length > 0) {
          setOrgId(String(data[0].id));
        }
      } catch (err) {
        console.error(err);
        setError(
          err?.response?.data?.detail ||
            err?.message ||
            "Failed to load organizations."
        );
      } finally {
        setLoadingOrgs(false);
      }
    }
    loadOrgs();
  }, []);

  const handleGenerate = async (e) => {
    e?.preventDefault?.();
    setError("");
    setReport(null);

    if (!orgId) {
      setError("Please select an organization.");
      return;
    }

    try {
      setLoadingReport(true);

      
      const data = await getOrgMonthlyReportV2({
        organization_id: Number(orgId),
        year: Number(year),
        month: Number(month),
      });

      setReport(data || null);
    } catch (err) {
      console.error(err);
      setError(
        err?.response?.data?.detail ||
          err?.message ||
          "Failed to generate report."
      );
    } finally {
      setLoadingReport(false);
    }
  };

  const periodLabel = report?.period?.label || "–";
  const summary = report?.summary || null;
  const items = Array.isArray(report?.items) ? report.items : [];

  return (
    <div className="page">
      <div style={{ marginBottom: "1rem" }}>
        <h1 className="page-title">Organization Monthly Report</h1>
        <p className="page-subtitle">
          View salary-based loan performance for a selected organization and month.
        </p>
      </div>

      {/* Filters */}
      <form
        onSubmit={handleGenerate}
        className="card"
        style={{
          marginBottom: "1.25rem",
          padding: "1rem 1.25rem",
          borderRadius: "0.9rem",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr 1fr",
            gap: "0.75rem 1.5rem",
            alignItems: "flex-end",
          }}
        >
          
          <div>
            <label
              style={{
                display: "block",
                marginBottom: "0.25rem",
                fontSize: "0.875rem",
                color: "#374151",
              }}
            >
              Organization
            </label>
            <select
              value={orgId}
              onChange={(e) => setOrgId(e.target.value)}
              style={{
                width: "100%",
                padding: "0.55rem 0.75rem",
                borderRadius: "0.5rem",
                border: "1px solid #d1d5db",
              }}
              disabled={loadingOrgs}
            >
              {loadingOrgs && <option>Loading...</option>}
              {!loadingOrgs && organizations.length === 0 && (
                <option>No organizations</option>
              )}
              {!loadingOrgs &&
                organizations.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name}
                  </option>
                ))}
            </select>
          </div>

          
          <div>
            <label
              style={{
                display: "block",
                marginBottom: "0.25rem",
                fontSize: "0.875rem",
                color: "#374151",
              }}
            >
              Year
            </label>
            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              style={{
                width: "100%",
                padding: "0.55rem 0.75rem",
                borderRadius: "0.5rem",
                border: "1px solid #d1d5db",
              }}
            >
              {yearOptions.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          
          <div>
            <label
              style={{
                display: "block",
                marginBottom: "0.25rem",
                fontSize: "0.875rem",
                color: "#374151",
              }}
            >
              Month
            </label>
            <select
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              style={{
                width: "100%",
                padding: "0.55rem 0.75rem",
                borderRadius: "0.5rem",
                border: "1px solid #d1d5db",
              }}
            >
              {MONTHS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ marginTop: "1rem", textAlign: "center" }}>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loadingReport || loadingOrgs || !orgId}
            style={{
              padding: "0.7rem 2.5rem",
              borderRadius: "999px",
              fontSize: "0.95rem",
            }}
          >
            {loadingReport ? "Generating..." : "Generate Report"}
          </button>
        </div>
      </form>

      
      {error && (
        <div
          style={{
            marginBottom: "0.75rem",
            padding: "0.7rem 0.9rem",
            borderRadius: "0.75rem",
            background: "#fef2f2",
            color: "#b91c1c",
            fontSize: "0.9rem",
          }}
        >
          {error}
        </div>
      )}

      
      <div
        className="card"
        style={{
          marginBottom: "1.25rem",
          padding: "1rem 1.25rem",
          borderRadius: "0.9rem",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: "0.75rem 1.5rem",
          }}
        >
          <div>
            <div style={{ fontSize: "0.85rem", color: "#6b7280" }}>
              Organization
            </div>
            <div style={{ fontWeight: 700, fontSize: "1rem" }}>
              {report?.organization?.name || "-"}
            </div>
          </div>

          <div>
            <div style={{ fontSize: "0.85rem", color: "#6b7280" }}>Period</div>
            <div style={{ fontWeight: 700, fontSize: "1rem" }}>
              {periodLabel}
            </div>
          </div>

          <div>
            <div style={{ fontSize: "0.85rem", color: "#6b7280" }}>
              Loans in Period
            </div>
            <div style={{ fontWeight: 700, fontSize: "1rem" }}>
              {summary ? summary.loans_in_period : "-"}
            </div>
          </div>

          <div>
            <div style={{ fontSize: "0.85rem", color: "#6b7280" }}>
              Total Principal
            </div>
            <div style={{ fontWeight: 700, fontSize: "1rem" }}>
              {summary ? money(summary.total_principal) : "-"}
            </div>
          </div>

          <div>
            <div style={{ fontSize: "0.85rem", color: "#6b7280" }}>
              Total Expected (Month)
            </div>
            <div style={{ fontWeight: 700, fontSize: "1rem" }}>
              {summary ? money(summary.total_expected_month) : "-"}
            </div>
          </div>

          <div>
            <div style={{ fontSize: "0.85rem", color: "#6b7280" }}>
              Total Paid (Month)
            </div>
            <div style={{ fontWeight: 700, fontSize: "1rem" }}>
              {summary ? money(summary.total_paid_month) : "-"}
            </div>
          </div>

          <div>
            <div style={{ fontSize: "0.85rem", color: "#6b7280" }}>
              Total Outstanding
            </div>
            <div style={{ fontWeight: 700, fontSize: "1rem" }}>
              {summary ? money(summary.total_outstanding_month) : "-"}
            </div>
          </div>
        </div>
      </div>

      
      <h2
        style={{
          fontSize: "1.05rem",
          fontWeight: 800,
          marginBottom: "0.5rem",
        }}
      >
        Loan Breakdown for Period
      </h2>

      {!report && (
        <div
          style={{
            padding: "0.75rem",
            borderRadius: "0.75rem",
            background: "#eff6ff",
            border: "1px solid #bfdbfe",
            color: "#1d4ed8",
            fontSize: "0.9rem",
          }}
        >
          Select filters above and click <b>Generate Report</b>.
        </div>
      )}

      {report && items.length === 0 && (
        <div
          style={{
            padding: "0.75rem",
            borderRadius: "0.75rem",
            background: "#f9fafb",
            border: "1px solid #e5e7eb",
            color: "#6b7280",
            fontSize: "0.9rem",
          }}
        >
          No loans or repayments found for the selected period.
        </div>
      )}

      {report && items.length > 0 && (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Loan ID</th>
                <th>Status</th>
                <th>Principal</th>
                <th>Expected (Month)</th>
                <th>Paid (Month)</th>
                <th>Outstanding (Month)</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.loan_id}>
                  <td>{item.loan_id}</td>
                  <td>{item.status}</td>
                  <td>{money(item.principal_amount)}</td>
                  <td>{money(item.total_expected_for_month)}</td>
                  <td>{money(item.total_paid_for_month)}</td>
                  <td>{money(item.total_outstanding_for_month)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
