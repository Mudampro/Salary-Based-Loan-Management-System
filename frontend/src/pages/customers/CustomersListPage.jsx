// frontend/src/pages/customers/CustomersListPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCustomers } from "../../api/customersApi";

export default function CustomersListPage() {
  const navigate = useNavigate();

  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadCustomers() {
      setLoading(true);
      setError("");

      try {
        const data = await getCustomers();
        setCustomers(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
        setError("Failed to load customers.");
      } finally {
        setLoading(false);
      }
    }

    loadCustomers();
  }, []);

  const total = useMemo(() => customers.length, [customers]);

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

  return (
    <div>
      <h1 className="page-title">Customers</h1>
      <p className="page-subtitle">
        Manage borrowers (staff) and view their loan history. ({total})
      </p>

      <button
        className="btn btn-primary"
        style={{ marginBottom: "1rem" }}
        onClick={() => navigate("/customers/new")}
      >
        + Add Customer
      </button>

      {loading && <p>Loading customers...</p>}

      {error && (
        <div
          style={{
            marginBottom: "1rem",
            padding: "0.6rem",
            borderRadius: "0.5rem",
            background: "#fef2f2",
            color: "#b91c1c",
          }}
        >
          {error}
        </div>
      )}

      {!loading && customers.length === 0 && <p>No customers found.</p>}

      {!loading && customers.length > 0 && (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Staff ID</th>
                <th>Email</th>
                <th>Organization</th>
                <th>NUN Account</th>
                <th>Balance</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr
                  key={c.id}
                  className="clickable-row"
                  title="Click to view customer details"
                  onClick={() => navigate(`/customers/${c.id}`)}
                >
                  <td>{c.full_name}</td>
                  <td>{c.staff_id}</td>
                  <td>{c.email}</td>
                  <td>{c.organization?.name || "-"}</td>
                  <td>{c.nun_account_number || "-"}</td>
                  <td>{formatMoney(c.account_balance)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
