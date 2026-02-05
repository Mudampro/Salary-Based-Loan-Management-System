import React from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

function useQuery() {
  const { search } = useLocation();
  return React.useMemo(() => new URLSearchParams(search), [search]);
}

export default function LoanApplicationResultPage() {
  const navigate = useNavigate();
  const { token } = useParams();
  const query = useQuery();

  const outcome = query.get("outcome") || "success"; 
  const applicationId = query.get("applicationId");
  const reason = query.get("reason");

  const isSuccess = outcome === "success";
  const isDeclined = outcome === "declined";

  let title = "Submission Result";
  if (isSuccess) title = "Application Submitted";
  else if (isDeclined) title = "Application Declined";
  else title = "Submission Error";

  let message = "Your request has been processed.";
  if (isSuccess)
    message = "Your application has been submitted successfully. You will be contacted after review.";
  else if (isDeclined)
    message = "Your application could not be approved at this time.";
  else message = "Something went wrong while submitting. Please try again.";

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#f3f4f6",
        padding: "2rem 1rem",
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "640px",
          background: "white",
          borderRadius: "0.75rem",
          padding: "1.75rem 1.5rem",
          boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
        }}
      >
        <h1 style={{ fontSize: "1.3rem", fontWeight: 700, marginBottom: "0.75rem" }}>
          {title}
        </h1>

        <div
          style={{
            marginBottom: "0.9rem",
            padding: "0.75rem",
            borderRadius: "0.5rem",
            background: isSuccess ? "#ecfdf3" : isDeclined ? "#fef2f2" : "#fff7ed",
            color: isSuccess ? "#166534" : isDeclined ? "#b91c1c" : "#9a3412",
            fontSize: "0.9rem",
          }}
        >
          {message}
          {reason ? (
            <div style={{ marginTop: "0.5rem", fontSize: "0.85rem", opacity: 0.95 }}>
              Reason: {reason}
            </div>
          ) : null}
        </div>

        {applicationId ? (
          <p style={{ fontSize: "0.9rem", margin: 0, color: "#374151" }}>
            Reference: <strong>#{applicationId}</strong>
          </p>
        ) : null}

        <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.25rem" }}>
          <button
            onClick={() => navigate(`/apply/${token}`)}
            style={{
              padding: "0.55rem 0.9rem",
              borderRadius: "0.5rem",
              border: "1px solid #d1d5db",
              background: "white",
              cursor: "pointer",
              fontSize: "0.9rem",
            }}
          >
            Back
          </button>

          <button
            onClick={() => navigate("/login")}
            style={{
              padding: "0.55rem 0.9rem",
              borderRadius: "0.5rem",
              border: "1px solid #111827",
              background: "#111827",
              color: "white",
              cursor: "pointer",
              fontSize: "0.9rem",
            }}
          >
            Staff Login
          </button>
        </div>
      </div>
    </div>
  );
}
