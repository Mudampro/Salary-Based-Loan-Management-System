// frontend/src/pages/loanLinks/LoanLinksListPage.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getLoanLinks } from "../../api/loanLinksApi";

export default function LoanLinksListPage() {
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copiedToken, setCopiedToken] = useState(null);

  const navigate = useNavigate();
  const frontendBase = window.location.origin;

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError("");
        const data = await getLoanLinks();
        setLinks(data || []);
      } catch (err) {
        console.error(err);
        setError("Failed to load loan links.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleCopy = async (text, token) => {
    if (!text) return;

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.style.position = "fixed";
        textarea.style.left = "-9999px";
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }

      setCopiedToken(token);
      setTimeout(() => setCopiedToken(null), 2000);
    } catch (err) {
      console.error("Copy failed", err);
      alert("Copy failed. Please copy the link manually.");
    }
  };

  return (
    <div>
      <h1 className="page-title">Loan Links</h1>
      <p className="page-subtitle">
        Unique application links generated for each partner organization and
        loan product.
      </p>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "1rem",
          gap: "0.5rem",
          flexWrap: "wrap",
        }}
      >
        <button
          className="btn btn-primary"
          onClick={() => navigate("/loan-links/new")}
        >
          + Generate New Link
        </button>
      </div>

      {loading && <p>Loading...</p>}

      {error && (
        <p style={{ color: "#b91c1c", marginBottom: "1rem" }}>{error}</p>
      )}

      {!loading && !error && links.length === 0 && (
        <p>No links yet. Click &quot;Generate New Link&quot; to create one.</p>
      )}

      {!loading && !error && links.length > 0 && (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Organization</th>
                <th>Loan Product</th>
                <th>Token</th>
                <th>Application Link</th>
                <th>Active</th>
                <th>Created</th>
              </tr>
            </thead>

            <tbody>
              {links.map((link) => {
                
                const url = `${frontendBase}/#/apply/${link.token}`;

                const isCopied = copiedToken === link.token;

                const orgName =
                  link.organization?.name || link.organization_name || "-";

                const productName =
                  link.product?.name || link.loan_product_name || "-";

                return (
                  <tr key={link.id}>
                    <td>{orgName}</td>
                    <td>{productName}</td>
                    <td>{link.token}</td>

                    <td>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                          maxWidth: "260px",
                        }}
                      >
                        <div
                          style={{
                            flex: 1,
                            fontSize: "0.8rem",
                            padding: "0.25rem 0.4rem",
                            borderRadius: "0.4rem",
                            border: "1px solid #e5e7eb",
                            backgroundColor: "#f9fafb",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                          title={url}
                        >
                          {url}
                        </div>

                        <button
                          className="btn btn-secondary"
                          type="button"
                          onClick={() => handleCopy(url, link.token)}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.25rem",
                            fontSize: "0.8rem",
                            padding: "0.3rem 0.6rem",
                            whiteSpace: "nowrap",
                          }}
                        >
                          <span aria-hidden="true">{isCopied ? "✅" : "📋"}</span>
                          <span>{isCopied ? "Copied!" : "Copy"}</span>
                        </button>
                      </div>
                    </td>

                    <td>{link.is_active ? "Yes" : "No"}</td>

                    <td>
                      {link.created_at
                        ? new Date(link.created_at).toLocaleString()
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
