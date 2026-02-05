// frontend/src/pages/loanProducts/LoanProductFormPage.jsx
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  createLoanProduct,
  getLoanProduct,
  updateLoanProduct,
} from "../../api/loanProductsApi";

export default function LoanProductFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    description: "",
    interest_rate: "",
    max_tenor_months: "",
    min_amount: "",
    max_amount: "",
    repayment_frequency: "monthly",
    is_active: true,
  });

  const [initialLoading, setInitialLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  
  useEffect(() => {
    async function load() {
      if (!isEdit) {
        setInitialLoading(false);
        return;
      }

      try {
        setInitialLoading(true);
        const product = await getLoanProduct(id);

        setForm({
          name: product.name || "",
          description: product.description || "",
          interest_rate:
            product.interest_rate !== undefined
              ? product.interest_rate.toString()
              : "",
          max_tenor_months:
            product.max_tenor_months !== undefined
              ? product.max_tenor_months.toString()
              : "",
          min_amount:
            product.min_amount !== undefined && product.min_amount !== null
              ? product.min_amount.toString()
              : "",
          max_amount:
            product.max_amount !== undefined && product.max_amount !== null
              ? product.max_amount.toString()
              : "",
          repayment_frequency: product.repayment_frequency || "monthly",
          is_active:
            product.is_active !== undefined ? product.is_active : true,
        });
      } catch (err) {
        console.error("LOAD LOAN PRODUCT ERROR:", err);
        setError("Failed to load loan product.");
      } finally {
        setInitialLoading(false);
      }
    }

    load();
  }, [id, isEdit]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      const interestRate = Number(form.interest_rate);
      const maxTenor = Number(form.max_tenor_months);

      if (!form.name.trim() || Number.isNaN(interestRate) || Number.isNaN(maxTenor)) {
        setError("Please provide name, interest rate and max tenor correctly.");
        setSaving(false);
        return;
      }

      const payload = {
        name: form.name.trim(),
        description: form.description || "",
        interest_rate: interestRate,
        max_tenor_months: maxTenor,
        repayment_frequency: form.repayment_frequency || "monthly",
        is_active: Boolean(form.is_active),
      };

      if (form.min_amount !== "") {
        const minAmount = Number(form.min_amount);
        if (Number.isNaN(minAmount)) {
          setError("Minimum amount must be a number.");
          setSaving(false);
          return;
        }
        payload.min_amount = minAmount;
      }

      if (form.max_amount !== "") {
        const maxAmount = Number(form.max_amount);
        if (Number.isNaN(maxAmount)) {
          setError("Maximum amount must be a number.");
          setSaving(false);
          return;
        }
        payload.max_amount = maxAmount;
      }

      if (isEdit) {
        await updateLoanProduct(id, payload);
      } else {
        await createLoanProduct(payload);
      }

      navigate("/loan-products");
    } catch (err) {
      console.error("SAVE LOAN PRODUCT ERROR:", err);
      const detail = err?.response?.data?.detail;
      let msg = "Failed to save loan product.";

      if (Array.isArray(detail)) {
        msg =
          detail
            .map((d) => d.msg || JSON.stringify(d))
            .join(" | ") || msg;
      } else if (typeof detail === "string") {
        msg = detail;
      }

      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  if (initialLoading) {
    return <p>Loading...</p>;
  }

  return (
    <div className="card" style={{ maxWidth: 700 }}>
      <h1 className="page-title" style={{ fontSize: "1.25rem" }}>
        {isEdit ? "Edit Loan Product" : "New Loan Product"}
      </h1>
      <p className="page-subtitle">
        Define name, pricing, limits and tenor for this loan product.
      </p>

      {error && (
        <div
          style={{
            marginBottom: "1rem",
            padding: "0.6rem 0.75rem",
            borderRadius: "0.5rem",
            background: "#fee2e2",
            color: "#991b1b",
            fontSize: "0.9rem",
          }}
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        
        <div style={{ marginBottom: "0.75rem" }}>
          <label
            style={{
              display: "block",
              marginBottom: "0.25rem",
              fontSize: "0.875rem",
            }}
          >
            Name
          </label>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            required
            style={{
              width: "100%",
              padding: "0.5rem 0.75rem",
              borderRadius: "0.5rem",
              border: "1px solid #d1d5db",
            }}
          />
        </div>

        
        <div style={{ display: "flex", gap: "0.75rem", marginBottom: "0.75rem" }}>
          <div style={{ flex: 1 }}>
            <label
              style={{
                display: "block",
                marginBottom: "0.25rem",
                fontSize: "0.875rem",
              }}
            >
              Interest Rate (% per annum)
            </label>
            <input
              type="number"
              step="0.01"
              name="interest_rate"
              value={form.interest_rate}
              onChange={handleChange}
              required
              style={{
                width: "100%",
                padding: "0.5rem 0.75rem",
                borderRadius: "0.5rem",
                border: "1px solid #d1d5db",
              }}
            />
          </div>

          <div style={{ flex: 1 }}>
            <label
              style={{
                display: "block",
                marginBottom: "0.25rem",
                fontSize: "0.875rem",
              }}
            >
              Max Tenor (months)
            </label>
            <input
              type="number"
              name="max_tenor_months"
              value={form.max_tenor_months}
              onChange={handleChange}
              required
              style={{
                width: "100%",
                padding: "0.5rem 0.75rem",
                borderRadius: "0.5rem",
                border: "1px solid #d1d5db",
              }}
            />
          </div>
        </div>

        
        <div style={{ display: "flex", gap: "0.75rem", marginBottom: "0.75rem" }}>
          <div style={{ flex: 1 }}>
            <label
              style={{
                display: "block",
                marginBottom: "0.25rem",
                fontSize: "0.875rem",
              }}
            >
              Minimum Amount (optional)
            </label>
            <input
              type="number"
              name="min_amount"
              value={form.min_amount}
              onChange={handleChange}
              style={{
                width: "100%",
                padding: "0.5rem 0.75rem",
                borderRadius: "0.5rem",
                border: "1px solid #d1d5db",
              }}
            />
          </div>

          <div style={{ flex: 1 }}>
            <label
              style={{
                display: "block",
                marginBottom: "0.25rem",
                fontSize: "0.875rem",
              }}
            >
              Maximum Amount (optional)
            </label>
            <input
              type="number"
              name="max_amount"
              value={form.max_amount}
              onChange={handleChange}
              style={{
                width: "100%",
                padding: "0.5rem 0.75rem",
                borderRadius: "0.5rem",
                border: "1px solid #d1d5db",
              }}
            />
          </div>
        </div>

        
        <div style={{ marginBottom: "0.75rem" }}>
          <label
            style={{
              display: "block",
              marginBottom: "0.25rem",
              fontSize: "0.875rem",
            }}
          >
            Repayment Frequency
          </label>
          <select
            name="repayment_frequency"
            value={form.repayment_frequency}
            onChange={handleChange}
            style={{
              width: "100%",
              padding: "0.5rem 0.75rem",
              borderRadius: "0.5rem",
              border: "1px solid #d1d5db",
            }}
          >
            <option value="monthly">Monthly</option>
            <option value="weekly">Weekly</option>
            <option value="biweekly">Biweekly</option>
          </select>
        </div>

        
        <div style={{ marginBottom: "0.75rem" }}>
          <label
            style={{
              display: "block",
              marginBottom: "0.25rem",
              fontSize: "0.875rem",
            }}
          >
            Description
          </label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            rows={3}
            style={{
              width: "100%",
              padding: "0.5rem 0.75rem",
              borderRadius: "0.5rem",
              border: "1px solid #d1d5db",
              resize: "vertical",
            }}
          />
        </div>

        
        <div
          style={{
            marginBottom: "1rem",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <input
            id="is_active"
            type="checkbox"
            name="is_active"
            checked={form.is_active}
            onChange={handleChange}
          />
          <label htmlFor="is_active" style={{ fontSize: "0.9rem" }}>
            Product is active / available
          </label>
        </div>

        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={saving}
          >
            {saving ? "Saving..." : "Save"}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate("/loan-products")}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
