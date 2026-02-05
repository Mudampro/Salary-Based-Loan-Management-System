// frontend/src/pages/loanProducts/LoanProductsListPage.jsx
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getLoanProducts } from "../../api/loanProductsApi";

export default function LoanProductsListPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const data = await getLoanProducts();
        setProducts(data);
      } catch (err) {
        console.error(err);
        setError("Failed to load loan products.");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  return (
    <div>
      <div
        style={{
          marginBottom: "1rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h1 className="page-title">Loan Products</h1>
        <button
          onClick={() => navigate("/loan-products/new")}
          className="btn btn-primary"
        >
          + New Loan Product
        </button>
      </div>

      {loading && <p>Loading...</p>}
      {error && (
        <p style={{ color: "#b91c1c", marginBottom: "1rem" }}>{error}</p>
      )}

      {!loading && !error && products.length === 0 && (
        <p>No loan products yet. Click "New Loan Product" to create one.</p>
      )}

      {!loading && !error && products.length > 0 && (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Interest (%)</th>
                <th>Max Tenor (months)</th>
                <th>Min Amount</th>
                <th>Max Amount</th>
                <th>Repayment</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td>{p.name}</td>
                  <td>{p.interest_rate}</td>
                  <td>{p.max_tenor_months}</td>
                  <td>{p.min_amount ?? "-"}</td>
                  <td>{p.max_amount ?? "-"}</td>
                  <td>{p.repayment_frequency || "-"}</td>
                  <td>{p.is_active ? "Active" : "Inactive"}</td>
                  <td>
                    <Link
                      to={`/loan-products/${p.id}/edit`}
                      style={{ color: "#2563eb", fontSize: "0.85rem" }}
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
