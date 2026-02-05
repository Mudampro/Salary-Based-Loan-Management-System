import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";

import {
  getLoanApplication,
  updateLoanApplicationStatus,
} from "../../api/loanApplicationsApi";
import { disburseApprovedApplication } from "../../api/disbursementsApi";

const STATUS_OPTIONS = [
  { value: "PENDING", label: "Pending" },
  { value: "UNDER_REVIEW", label: "Under Review" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
  { value: "DISBURSED", label: "Disbursed" },
];

export default function LoanApplicationDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  
  const [statusValue, setStatusValue] = useState("");
  const [approvedAmount, setApprovedAmount] = useState("");
  const [comment, setComment] = useState("");
  const [savingStatus, setSavingStatus] = useState(false);

 
  const [disburseAmount, setDisburseAmount] = useState("");
  const [narration, setNarration] = useState("");
  const [reference, setReference] = useState("");
  const [disbursing, setDisbursing] = useState(false);
  const [disburseError, setDisburseError] = useState("");

  const isApproved = useMemo(
    () => application?.status === "APPROVED",
    [application]
  );
  const isDisbursed = useMemo(
    () => application?.status === "DISBURSED",
    [application]
  );

  async function load() {
    setLoading(true);
    setPageError("");
    setDisburseError("");

    try {
      const data = await getLoanApplication(id);
      setApplication(data);

      setStatusValue(data?.status || "PENDING");
      setApprovedAmount(
        data?.approved_amount !== null && data?.approved_amount !== undefined
          ? String(data.approved_amount)
          : ""
      );
      setComment(data?.officer_comment || "");

      setDisburseAmount(
        data?.approved_amount !== null && data?.approved_amount !== undefined
          ? String(data.approved_amount)
          : ""
      );
      setNarration("");
      setReference("");
    } catch (err) {
      console.error(err);
      setPageError(
        err?.response?.data?.detail || "Failed to load loan application."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
   
  }, [id]);

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    setSavingStatus(true);
    setPageError("");

    try {
      const payload = {
        status: statusValue,
        officer_comment: comment?.trim() || null,
      };

      if (statusValue === "APPROVED") {
        if (!approvedAmount || Number(approvedAmount) <= 0) {
          throw new Error("approved_amount is required and must be > 0");
        }
        payload.approved_amount = Number(approvedAmount);
      } else {
        payload.approved_amount = approvedAmount
          ? Number(approvedAmount)
          : null;
      }

      await updateLoanApplicationStatus(id, payload);
      await load();
    } catch (err) {
      console.error(err);
      setPageError(
        err?.response?.data?.detail ||
          err?.message ||
          "Failed to update status."
      );
    } finally {
      setSavingStatus(false);
    }
  };

  const handleDisburse = async (e) => {
    e.preventDefault();
    setDisburseError("");
    setDisbursing(true);

    try {
      const payload = {
        narration: narration?.trim() || null,
        reference: reference?.trim() || null,
      };

      if (disburseAmount && Number(disburseAmount) > 0) {
        payload.disburse_amount = Number(disburseAmount);
      }

      const result = await disburseApprovedApplication(id, payload);

      const loanId = result?.loan?.id;
      if (loanId) {
        navigate(`/loans/${loanId}`);
        return;
      }

      await load();
      setDisburseError(
        "Disbursed, but could not detect loan id to open loan details."
      );
    } catch (err) {
      console.error(err);
      setDisburseError(
        err?.response?.data?.detail || "Failed to disburse loan."
      );
    } finally {
      setDisbursing(false);
    }
  };

  if (loading) return <p>Loading application...</p>;
  if (!application) return null;

  return (
    <div style={{ display: "grid", gap: "1rem" }}>
      
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <div>
          <h1 className="page-title">Loan Application #{application.id}</h1>
          <div style={{ color: "#6b7280" }}>
            Status: <b>{application.status}</b>
          </div>
        </div>

        <div style={{ display: "flex", gap: "0.5rem" }}>
          <Link to="/loan-applications" className="btn btn-secondary">
            Back
          </Link>
          <Link to="/loans" className="btn btn-secondary">
            View Loans
          </Link>
        </div>
      </div>

      
      <div className="card" style={{ maxWidth: 900 }}>
        <h2>Application Details</h2>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Detail
            label="Customer"
            value={application.customer?.full_name || "-"}
          />
          <Detail
            label="Organization"
            value={application.customer?.organization?.name || "-"}
          />
          <Detail
            label="Product"
            value={application.product?.name || "-"}
          />
          <Detail
            label="Requested Amount"
            value={application.requested_amount}
          />
          <Detail
            label="Approved Amount"
            value={application.approved_amount || "-"}
          />
          <Detail
            label="Tenor (Months)"
            value={application.tenor_months}
          />
        </div>
      </div>

      
      <div className="card" style={{ maxWidth: 900 }}>
        <h2>Update Status</h2>

        <form onSubmit={handleUpdateStatus} style={{ display: "grid", gap: 12 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label>Status</label>
              <select
                value={statusValue}
                onChange={(e) => setStatusValue(e.target.value)}
                style={inputStyle}
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label>Approved Amount</label>
              <input
                value={approvedAmount}
                onChange={(e) => setApprovedAmount(e.target.value)}
                style={inputStyle}
              />
            </div>
          </div>

          <div>
            <label>Comment</label>
            <textarea
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              style={{ ...inputStyle, resize: "vertical" }}
            />
          </div>

          
          <button
            className="btn btn-primary"
            disabled={savingStatus}
            style={{
              width: "100%",
              display: "flex",
              justifyContent: "center",
              textAlign: "center",
            }}
          >
            {savingStatus ? "Saving..." : "Save Status"}
          </button>
        </form>
      </div>

      
      <div className="card" style={{ maxWidth: 900 }}>
        <h2>Disbursement</h2>

        {isDisbursed && (
          <p style={{ color: "#0f766e" }}>
            Application already disbursed.
          </p>
        )}

        {isApproved && !isDisbursed && (
          <form onSubmit={handleDisburse} style={{ display: "grid", gap: 12 }}>
            <input
              placeholder="Disburse Amount"
              value={disburseAmount}
              onChange={(e) => setDisburseAmount(e.target.value)}
              style={inputStyle}
            />
            <input
              placeholder="Reference (optional)"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              style={inputStyle}
            />
            <input
              placeholder="Narration (optional)"
              value={narration}
              onChange={(e) => setNarration(e.target.value)}
              style={inputStyle}
            />

            
            <button
              className="btn btn-primary"
              disabled={disbursing}
              style={{
                width: "100%",
                display: "flex",
                justifyContent: "center",
                textAlign: "center",
              }}
            >
              {disbursing
                ? "Disbursing..."
                : "Disburse Now (opens Loan & Schedule)"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div style={{ border: "1px solid #e5e7eb", padding: 10, borderRadius: 8 }}>
      <div style={{ fontSize: 12, color: "#6b7280" }}>{label}</div>
      <div style={{ fontWeight: 600 }}>{value}</div>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: "0.5rem 0.75rem",
  borderRadius: "0.5rem",
  border: "1px solid #d1d5db",
};
