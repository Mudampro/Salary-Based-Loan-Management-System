// frontend/src/pages/loanLinks/LoanLinkCreatePage.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getOrganizations } from "../../api/organizationsApi";
import { getLoanProducts } from "../../api/loanProductsApi";
import { createLoanLink } from "../../api/loanLinksApi";

export default function LoanLinkCreatePage() {
  const navigate = useNavigate();

  const [organizations, setOrganizations] = useState([]);
  const [products, setProducts] = useState([]);
  const [organizationId, setOrganizationId] = useState("");
  const [productId, setProductId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [generatedLink, setGeneratedLink] = useState("");
  const [copyStatus, setCopyStatus] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [orgs, prods] = await Promise.all([
          getOrganizations(),
          getLoanProducts(),
        ]);
        setOrganizations(orgs);
        setProducts(prods);
      } catch (err) {
        console.error(err);
        setError("Failed to load organizations or products.");
      }
    }
    load();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setGeneratedLink("");
    setCopyStatus("");
    setSaving(true);

    try {
      const link = await createLoanLink(organizationId, productId);

      
      const frontendBase = window.location.origin;
      const url = `${frontendBase}/#/apply/${link.token}`;

      setGeneratedLink(url);
    } catch (err) {
      console.error(err);
      const msg =
        err?.response?.data?.detail ||
        "Failed to generate link. Please ensure the selection is valid.";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const copyGenerated = () => {
    if (!generatedLink) return;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard
        .writeText(generatedLink)
        .then(() => setCopyStatus("Copied!"))
        .catch((err) => {
          console.error("Clipboard write failed, falling back", err);
          fallbackCopy();
        });
    } else {
      fallbackCopy();
    }
  };

  const fallbackCopy = () => {
    try {
      const textarea = document.createElement("textarea");
      textarea.value = generatedLink;
      textarea.style.position = "fixed";
      textarea.style.left = "-9999px";
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopyStatus(ok ? "Copied!" : "Copy failed");
    } catch (err) {
      console.error("Fallback copy failed", err);
      setCopyStatus("Copy failed");
    }
  };

  const selectedOrg = organizations.find((o) => o.id === Number(organizationId));
  const selectedProduct = products.find((p) => p.id === Number(productId));

  return (
    <div className="card" style={{ maxWidth: 700 }}>
      <h1 className="page-title" style={{ fontSize: "1.3rem" }}>
        Generate Loan Link
      </h1>
      <p className="page-subtitle">
        Choose a partner organization and a loan product to create a unique
        application URL.
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
        <div style={{ marginBottom: "0.9rem" }}>
          <label
            style={{
              display: "block",
              marginBottom: "0.25rem",
              fontSize: "0.9rem",
            }}
          >
            Organization
          </label>
          <select
            value={organizationId}
            onChange={(e) => setOrganizationId(e.target.value)}
            required
            style={{
              width: "100%",
              padding: "0.5rem 0.75rem",
              borderRadius: "0.5rem",
              border: "1px solid #d1d5db",
            }}
          >
            <option value="">Select organization</option>
            {organizations.map((org) => (
              <option key={org.id} value={org.id}>
                {org.name}
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: "0.9rem" }}>
          <label
            style={{
              display: "block",
              marginBottom: "0.25rem",
              fontSize: "0.9rem",
            }}
          >
            Loan Product
          </label>
          <select
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            required
            style={{
              width: "100%",
              padding: "0.5rem 0.75rem",
              borderRadius: "0.5rem",
              border: "1px solid #d1d5db",
            }}
          >
            <option value="">Select loan product</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}{" "}
                {p.max_tenor_months ? `(${p.max_tenor_months} months)` : ""}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
          <button type="submit" className="btn btn-accent" disabled={saving}>
            {saving ? "Generating..." : "Generate Link"}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate("/loan-links")}
          >
            Back to List
          </button>
        </div>
      </form>

      {generatedLink && (
        <div
          style={{
            marginTop: "1rem",
            padding: "0.75rem",
            borderRadius: "0.75rem",
            background: "var(--accent-soft)",
            border: "1px dashed var(--accent)",
          }}
        >
          <div
            style={{
              fontSize: "0.9rem",
              marginBottom: "0.2rem",
              fontWeight: 600,
              color: "#9a3412",
            }}
          >
            {selectedOrg
              ? `${selectedOrg.name} – Application Link`
              : "Generated Application Link"}
          </div>

          {selectedProduct && (
            <div
              style={{
                fontSize: "0.8rem",
                marginBottom: "0.45rem",
                color: "#78350f",
              }}
            >
              Product: {selectedProduct.name}{" "}
              {selectedProduct.max_tenor_months
                ? `(${selectedProduct.max_tenor_months} months)`
                : ""}
            </div>
          )}

          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <input
              type="text"
              value={generatedLink}
              readOnly
              onFocus={(e) => e.target.select()}
              style={{
                flex: 1,
                padding: "0.4rem 0.5rem",
                borderRadius: "0.5rem",
                border: "1px solid #f97316",
                fontSize: "0.85rem",
              }}
            />
            <button
              type="button"
              className="btn btn-primary"
              onClick={copyGenerated}
            >
              Copy
            </button>
          </div>

          {copyStatus && (
            <div
              style={{
                marginTop: "0.3rem",
                fontSize: "0.8rem",
                color: copyStatus === "Copied!" ? "#166534" : "#991b1b",
              }}
            >
              {copyStatus}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
