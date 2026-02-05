// frontend/src/pages/customers/CustomerDetailPage.jsx
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  getCustomerById,
  getCustomerLoanHistory,
  getCustomerLoans,
} from "../../api/customersApi";

export default function CustomerDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [customer, setCustomer] = useState(null);

  const [applications, setApplications] = useState([]);
  const [loans, setLoans] = useState([]);

  const [loading, setLoading] = useState(true);

  const [profileError, setProfileError] = useState("");
  const [appsError, setAppsError] = useState("");
  const [loansError, setLoansError] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      setProfileError("");
      setAppsError("");
      setLoansError("");

      try {
        const results = await Promise.allSettled([
          getCustomerById(id),
          getCustomerLoanHistory(id),
          getCustomerLoans(id),
        ]);

        const [profileRes, appsRes, loansRes] = results;

        if (profileRes.status === "fulfilled") {
          setCustomer(profileRes.value);
        } else {
          console.error("Customer profile error:", profileRes.reason);
          setProfileError(
            profileRes?.reason?.response?.data?.detail ||
              "Failed to load customer profile."
          );
        }

        if (appsRes.status === "fulfilled") {
          setApplications(Array.isArray(appsRes.value) ? appsRes.value : []);
        } else {
          console.error("Customer loan history error:", appsRes.reason);
          setAppsError(
            appsRes?.reason?.response?.data?.detail ||
              "Failed to load loan applications."
          );
          setApplications([]);
        }

        if (loansRes.status === "fulfilled") {
          setLoans(Array.isArray(loansRes.value) ? loansRes.value : []);
        } else {
          console.error("Customer loans error:", loansRes.reason);
          setLoansError(
            loansRes?.reason?.response?.data?.detail ||
              "Failed to load loans (check /customers/{id}/loans endpoint)."
          );
          setLoans([]);
        }
      } catch (err) {
        console.error("Unexpected detail page error:", err);
        setProfileError("Unexpected error loading customer details.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [id]);

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

  if (loading) return <p>Loading customer...</p>;

  if (profileError) {
    return (
      <div>
        <h1 className="page-title">Customer Details</h1>

        <div
          style={{
            marginBottom: "1rem",
            padding: "0.6rem 0.75rem",
            borderRadius: "0.5rem",
            background: "#fef2f2",
            color: "#b91c1c",
          }}
        >
          {profileError}
        </div>

        <button className="btn btn-secondary" onClick={() => navigate(-1)}>
          ← Back
        </button>
      </div>
    );
  }

  if (!customer) return <p>Customer not found.</p>;

  return (
    <div>
      <h1 className="page-title">Customer Details</h1>

      <button
        className="btn btn-secondary"
        style={{ marginBottom: "1rem" }}
        onClick={() => navigate(-1)}
      >
        ← Back
      </button>

      
      <div className="card" style={{ marginBottom: "1rem" }}>
        <p><strong>Name:</strong> {customer.full_name}</p>
        <p><strong>Staff ID:</strong> {customer.staff_id}</p>
        <p><strong>Email:</strong> {customer.email}</p>
        <p><strong>Phone:</strong> {customer.phone}</p>
        <p><strong>Organization:</strong> {customer.organization?.name || "-"}</p>

        <p>
          <strong>Net Salary:</strong> {formatMoney(customer.net_monthly_salary)}
        </p>

        <p><strong>BVN:</strong> {customer.bvn || "-"}</p>

        
        <hr style={{ margin: "0.75rem 0", border: "none", borderTop: "1px solid #e5e7eb" }} />
        <p>
          <strong>NUN Account Number:</strong>{" "}
          {customer.nun_account_number || "Not generated yet"}
        </p>
        <p>
          <strong>Account Balance:</strong> {formatMoney(customer.account_balance)}
        </p>
      </div>

      
      <h2 style={{ marginTop: "1rem" }}>Loans</h2>

      {loansError && (
        <div
          style={{
            marginBottom: "0.75rem",
            padding: "0.6rem 0.75rem",
            borderRadius: "0.5rem",
            background: "#fff7ed",
            color: "#9a3412",
            border: "1px solid #fed7aa",
          }}
        >
          {loansError}
        </div>
      )}

      {loans.length === 0 ? (
        <p>No loans yet.</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Principal</th>
              <th>Total Payable</th>
              <th>Status</th>
              <th>Open</th>
            </tr>
          </thead>
          <tbody>
            {loans.map((l) => (
              <tr key={l.id}>
                <td>{l.id}</td>
                <td>{formatMoney(l.principal_amount)}</td>
                <td>{formatMoney(l.total_payable)}</td>
                <td>{l.status}</td>
                <td>
                  <button
                    className="btn btn-primary"
                    onClick={() => navigate(`/loans/${l.id}`)}
                  >
                    View Loan
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      
      <h2 style={{ marginTop: "1.5rem" }}>Loan Applications</h2>

      {appsError && (
        <div
          style={{
            marginBottom: "0.75rem",
            padding: "0.6rem 0.75rem",
            borderRadius: "0.5rem",
            background: "#fff7ed",
            color: "#9a3412",
            border: "1px solid #fed7aa",
          }}
        >
          {appsError}
        </div>
      )}

      {applications.length === 0 ? (
        <p>No applications yet.</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Requested</th>
              <th>Approved</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {applications.map((a) => (
              <tr key={a.id}>
                <td>{a.id}</td>
                <td>{formatMoney(a.requested_amount)}</td>
                <td>
                  {a.approved_amount !== null && a.approved_amount !== undefined
                    ? formatMoney(a.approved_amount)
                    : "-"}
                </td>
                <td>{a.status}</td>
                <td>{a.created_at ? new Date(a.created_at).toLocaleDateString() : "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
