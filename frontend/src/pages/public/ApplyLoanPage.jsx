// frontend/src/pages/public/ApplyLoanPage.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

import { getLoanLinkByToken } from "../../api/loanLinksApi";
import { submitPublicLoanApplication } from "../../api/loanApplicationsApi";

export default function ApplyLoanPage() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [linkData, setLinkData] = useState(null);
  const [loadingLink, setLoadingLink] = useState(true);
  const [linkError, setLinkError] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    staff_id: "",
    bvn: "",
    net_pay: "",
    requested_amount: "",
    tenor_months: "",
    purpose: "",
  });

  
  useEffect(() => {
    async function loadLink() {
      try {
        setLoadingLink(true);
        setLinkError("");
        const data = await getLoanLinkByToken(token);
        setLinkData(data);
      } catch (err) {
        console.error(err);
        const msg =
          err?.response?.data?.detail ||
          "This application link is invalid, expired, or unavailable.";
        setLinkError(msg);
      } finally {
        setLoadingLink(false);
      }
    }

    if (token) {
      loadLink();
    }
  }, [token]);

  const handleChange = (e) => {
    const { name, value } = e.target;

   
    if (name === "bvn") {
      const digitsOnly = value.replace(/\D/g, "").slice(0, 11);
      setForm((prev) => ({ ...prev, [name]: digitsOnly }));
      return;
    }

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError("");
    setSubmitting(true);

    try {
      const payload = {
        full_name: form.full_name,
        email: form.email,
        phone: form.phone,
        staff_id: form.staff_id,
        bvn: form.bvn,
        net_pay: Number(form.net_pay) || 0,
        requested_amount: Number(form.requested_amount) || 0,
        tenor_months: Number(form.tenor_months) || 0,
        purpose: form.purpose,
      };

      const created = await submitPublicLoanApplication(token, payload);

      
      const applicationId = created?.id ?? created?.application_id ?? "";

      navigate(
        `/apply/${token}/result?outcome=success&applicationId=${encodeURIComponent(
          applicationId
        )}`
      );
    } catch (err) {
      console.error(err);
      const msg =
        err?.response?.data?.detail ||
        "Failed to submit application. Please check your details and try again.";

      
      navigate(
        `/apply/${token}/result?outcome=declined&reason=${encodeURIComponent(
          msg
        )}`
      );

      
      setSubmitError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const isLinkInactive = linkData && linkData.is_active === false;

  const organizationLabel = linkData
    ? linkData.organization_name || `Organization #${linkData.organization_id}`
    : "";

  const productLabel = linkData
    ? linkData.loan_product_name || `Product #${linkData.product_id}`
    : "";

  return (
    <div
      className="page public-apply-page"
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        padding: "2rem 1rem",
        backgroundColor: "#f3f4f6",
      }}
    >
      <div
        className="card"
        style={{
          width: "100%",
          maxWidth: "640px",
          margin: "0 auto",
          padding: "1.75rem 1.5rem",
        }}
      >
        
        <div style={{ marginBottom: "1.25rem" }}>
          <h1
            style={{
              fontSize: "1.3rem",
              fontWeight: 700,
              marginBottom: "0.25rem",
            }}
          >
            {loadingLink
              ? "Loading application..."
              : isLinkInactive
              ? "Application link inactive"
              : "Loan Application"}
          </h1>

          {!loadingLink && !linkError && !isLinkInactive && (
            <p
              style={{
                fontSize: "0.9rem",
                color: "#4b5563",
                margin: 0,
              }}
            >
              Applying for <strong>{productLabel}</strong> from{" "}
              <strong>{organizationLabel}</strong>.
            </p>
          )}

          {linkError && (
            <p
              style={{
                marginTop: "0.4rem",
                fontSize: "0.9rem",
                color: "#b91c1c",
              }}
            >
              {linkError}
            </p>
          )}

          {isLinkInactive && !linkError && (
            <p
              style={{
                marginTop: "0.4rem",
                fontSize: "0.9rem",
                color: "#b91c1c",
              }}
            >
              This link is not active. Please contact your organization or the
              microfinance bank for more information.
            </p>
          )}
        </div>

        {loadingLink && (
          <p style={{ fontSize: "0.9rem", color: "#6b7280" }}>
            Please wait while we verify your application link...
          </p>
        )}

        {!loadingLink && linkData && !isLinkInactive && !linkError && (
          <>
            
            {submitError && (
              <div
                style={{
                  marginBottom: "0.75rem",
                  padding: "0.6rem 0.75rem",
                  borderRadius: "0.5rem",
                  background: "#fef2f2",
                  color: "#b91c1c",
                  fontSize: "0.85rem",
                }}
              >
                {submitError}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: "0.75rem" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.9rem",
                    marginBottom: "0.25rem",
                  }}
                >
                  Full Name
                </label>
                <input
                  type="text"
                  name="full_name"
                  value={form.full_name}
                  onChange={handleChange}
                  required
                  style={{
                    width: "100%",
                    padding: "0.5rem 0.75rem",
                    borderRadius: "0.5rem",
                    border: "1px solid #d1d5db",
                    fontSize: "0.9rem",
                  }}
                />
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "0.75rem",
                  marginBottom: "0.75rem",
                }}
              >
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.9rem",
                      marginBottom: "0.25rem",
                    }}
                  >
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    required
                    style={{
                      width: "100%",
                      padding: "0.5rem 0.75rem",
                      borderRadius: "0.5rem",
                      border: "1px solid #d1d5db",
                      fontSize: "0.9rem",
                    }}
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.9rem",
                      marginBottom: "0.25rem",
                    }}
                  >
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    required
                    style={{
                      width: "100%",
                      padding: "0.5rem 0.75rem",
                      borderRadius: "0.5rem",
                      border: "1px solid #d1d5db",
                      fontSize: "0.9rem",
                    }}
                  />
                </div>
              </div>

              
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "0.75rem",
                  marginBottom: "0.75rem",
                }}
              >
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.9rem",
                      marginBottom: "0.25rem",
                    }}
                  >
                    Staff ID / Employee Number
                  </label>
                  <input
                    type="text"
                    name="staff_id"
                    value={form.staff_id}
                    onChange={handleChange}
                    required
                    style={{
                      width: "100%",
                      padding: "0.5rem 0.75rem",
                      borderRadius: "0.5rem",
                      border: "1px solid #d1d5db",
                      fontSize: "0.9rem",
                    }}
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.9rem",
                      marginBottom: "0.25rem",
                    }}
                  >
                    BVN (11 digits)
                  </label>
                  <input
                    type="text"
                    name="bvn"
                    value={form.bvn}
                    onChange={handleChange}
                    required
                    maxLength={11}
                    pattern="[0-9]{11}"
                    title="BVN must be exactly 11 digits"
                    style={{
                      width: "100%",
                      padding: "0.5rem 0.75rem",
                      borderRadius: "0.5rem",
                      border: "1px solid #d1d5db",
                      fontSize: "0.9rem",
                    }}
                  />
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "0.75rem",
                  marginBottom: "0.75rem",
                }}
              >
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.9rem",
                      marginBottom: "0.25rem",
                    }}
                  >
                    Net Monthly Salary (₦)
                  </label>
                  <input
                    type="number"
                    name="net_pay"
                    value={form.net_pay}
                    onChange={handleChange}
                    required
                    min="0"
                    step="0.01"
                    style={{
                      width: "100%",
                      padding: "0.5rem 0.75rem",
                      borderRadius: "0.5rem",
                      border: "1px solid #d1d5db",
                      fontSize: "0.9rem",
                    }}
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.9rem",
                      marginBottom: "0.25rem",
                    }}
                  >
                    Requested Amount (₦)
                  </label>
                  <input
                    type="number"
                    name="requested_amount"
                    value={form.requested_amount}
                    onChange={handleChange}
                    required
                    min="0"
                    step="0.01"
                    style={{
                      width: "100%",
                      padding: "0.5rem 0.75rem",
                      borderRadius: "0.5rem",
                      border: "1px solid #d1d5db",
                      fontSize: "0.9rem",
                    }}
                  />
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "0.75rem",
                  marginBottom: "0.75rem",
                }}
              >
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.9rem",
                      marginBottom: "0.25rem",
                    }}
                  >
                    Tenor (months)
                  </label>
                  <input
                    type="number"
                    name="tenor_months"
                    value={form.tenor_months}
                    onChange={handleChange}
                    required
                    min="1"
                    style={{
                      width: "100%",
                      padding: "0.5rem 0.75rem",
                      borderRadius: "0.5rem",
                      border: "1px solid #d1d5db",
                      fontSize: "0.9rem",
                    }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: "0.9rem" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.9rem",
                    marginBottom: "0.25rem",
                  }}
                >
                  Purpose of Loan
                </label>
                <textarea
                  name="purpose"
                  value={form.purpose}
                  onChange={handleChange}
                  rows={3}
                  style={{
                    width: "100%",
                    padding: "0.5rem 0.75rem",
                    borderRadius: "0.5rem",
                    border: "1px solid #d1d5db",
                    fontSize: "0.9rem",
                    resize: "vertical",
                  }}
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={submitting}
              >
                {submitting ? "Submitting..." : "Submit Application"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
