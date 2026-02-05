// frontend/src/pages/loans/LoanDetailPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

import { getLoan } from "../../api/loansApi";
import {
  getRepaymentsForLoan,
  markRepaymentPaid,
  reverseRepayment,
} from "../../api/repaymentsApi";
import useAuth from "../../hooks/useAuth";

function normalizeRole(rawRole) {
  if (!rawRole) return "";
  let r = String(rawRole).trim();
  if (r.includes(",")) r = r.split(",")[0].trim();
  if (r.includes(".")) r = r.split(".").pop().trim();
  return r.toUpperCase();
}

function toNum(value) {
  if (value === null || value === undefined) return 0;
  const n = Number(value);
  return Number.isNaN(n) ? 0 : n;
}

function money(value) {
  if (value === null || value === undefined) return "-";
  const n = Number(value);
  if (Number.isNaN(n)) return String(value);
  return n.toLocaleString("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 2,
  });
}

function dateOnly(value) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString("en-GB", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

function dateTime(value) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString("en-GB", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function isPastDay(dateValue) {
  if (!dateValue) return false;
  const d = new Date(dateValue);
  if (Number.isNaN(d.getTime())) return false;

  const now = new Date();
  const dd = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const nn = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  return dd < nn;
}

function isDueSoon(dateValue, days = 7) {
  if (!dateValue) return false;
  const d = new Date(dateValue);
  if (Number.isNaN(d.getTime())) return false;

  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const end = start + days * 24 * 60 * 60 * 1000;

  const dd = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  return dd >= start && dd <= end;
}

export default function LoanDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loan, setLoan] = useState(null);
  const [repayments, setRepayments] = useState([]);

  const [loadingLoan, setLoadingLoan] = useState(true);
  const [loadingRepayments, setLoadingRepayments] = useState(true);

  const [error, setError] = useState("");

  
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState(null); 
  const [selectedRepayment, setSelectedRepayment] = useState(null);
  const [working, setWorking] = useState(false);

  
  const [toast, setToast] = useState(null); 

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  const role = normalizeRole(user?.role);

  const canMarkAsPaid = useMemo(() => {
    return ["ADMIN", "CASHIER", "LOAN_OFFICER", "MANAGER"].includes(role);
  }, [role]);

  
  const canReversePayment = useMemo(() => {
    return ["ADMIN", "MANAGER"].includes(role) || canMarkAsPaid;
  }, [role, canMarkAsPaid]);

  const loadLoan = async () => {
    try {
      setLoadingLoan(true);
      setError("");
      const data = await getLoan(id);
      setLoan(data);
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.detail || err?.message || "Failed to load loan.");
    } finally {
      setLoadingLoan(false);
    }
  };

  const loadRepayments = async () => {
    try {
      setLoadingRepayments(true);
      const data = await getRepaymentsForLoan(id);
      setRepayments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setToast({ type: "error", message: "Failed to load repayment schedule." });
      setRepayments([]);
    } finally {
      setLoadingRepayments(false);
    }
  };

  useEffect(() => {
    if (!id) return;
    loadLoan();
    loadRepayments();
    
  }, [id]);

 
  const summary = useMemo(() => {
    const totalPayable = toNum(loan?.total_payable);
    const totalPaid = repayments.reduce((sum, r) => sum + toNum(r.amount_paid), 0);
    const outstanding = Math.max(0, totalPayable - totalPaid);

    const paidInstallments = repayments.filter((r) => Boolean(r.is_paid)).length;
    const totalInstallments = repayments.length;

    const nextUnpaid = repayments
      .filter((r) => !r.is_paid)
      .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())[0];

    const overdueCount = repayments.filter((r) => !r.is_paid && isPastDay(r.due_date)).length;

    const progressPct =
      totalInstallments > 0 ? Math.round((paidInstallments / totalInstallments) * 100) : 0;

    return {
      totalPayable,
      totalPaid,
      outstanding,
      paidInstallments,
      totalInstallments,
      nextDueDate: nextUnpaid?.due_date || null,
      overdueCount,
      progressPct,
    };
  }, [loan, repayments]);


  const tagForRow = (rep) => {
    if (rep.is_paid) return { label: "PAID", tone: "success" };

    const overdue = isPastDay(rep.due_date);
    if (overdue) return { label: "OVERDUE", tone: "danger" };

    const soon = isDueSoon(rep.due_date, 7);
    if (soon) return { label: "DUE SOON", tone: "warn" };

    return { label: "PENDING", tone: "pending" };
  };

  const statusBadge = (tag) => {
    let bg = "#e5e7eb";
    let color = "#374151";

    if (tag.tone === "success") {
      bg = "#dcfce7";
      color = "#166534";
    } else if (tag.tone === "danger") {
      bg = "#fee2e2";
      color = "#b91c1c";
    } else if (tag.tone === "warn") {
      bg = "#ffedd5";
      color = "#9a3412";
    } else if (tag.tone === "pending") {
      bg = "#fef3c7";
      color = "#92400e";
    }

    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          padding: "0.15rem 0.6rem",
          borderRadius: "9999px",
          fontSize: "0.75rem",
          fontWeight: 800,
          backgroundColor: bg,
          color,
        }}
      >
        {tag.label}
      </span>
    );
  };

  const openPayModal = (repayment) => {
    if (!canMarkAsPaid) {
      setToast({
        type: "error",
        message: `Access denied. Your role is "${role || "UNKNOWN"}".`,
      });
      return;
    }
    if (!repayment || repayment.is_paid) return;

    setSelectedRepayment(repayment);
    setModalMode("PAY");
    setModalOpen(true);
  };

  const openReverseModal = (repayment) => {
    if (!canReversePayment) {
      setToast({
        type: "error",
        message: `Access denied. Your role is "${role || "UNKNOWN"}".`,
      });
      return;
    }
    if (!repayment || !repayment.is_paid) return;

    setSelectedRepayment(repayment);
    setModalMode("REVERSE");
    setModalOpen(true);
  };

  const closeModal = () => {
    if (working) return;
    setModalOpen(false);
    setSelectedRepayment(null);
    setModalMode(null);
  };

  const handleConfirm = async () => {
    if (!selectedRepayment || !modalMode) return;

    const repId = selectedRepayment.id;

    try {
      setWorking(true);

      if (modalMode === "PAY") {
        
        setRepayments((prev) =>
          prev.map((r) =>
            r.id === repId
              ? {
                  ...r,
                  amount_paid: r.amount_due,
                  is_paid: true,
                  paid_at: new Date().toISOString(),
                }
              : r
          )
        );

        const payload = {
          amount_paid: selectedRepayment.amount_due,
          paid_at: new Date().toISOString(),
        };

        await markRepaymentPaid(repId, payload);
        setToast({ type: "success", message: "Installment marked as paid ✅" });
      }

      if (modalMode === "REVERSE") {
        
        setRepayments((prev) =>
          prev.map((r) =>
            r.id === repId
              ? {
                  ...r,
                  amount_paid: 0,
                  is_paid: false,
                  paid_at: null,
                }
              : r
          )
        );

        await reverseRepayment(repId, {});
        setToast({ type: "success", message: "Payment reversed ✅" });
      }

      closeModal();

      
      await loadRepayments();
      await loadLoan();
    } catch (err) {
      console.error(err);

      
      await loadRepayments();
      await loadLoan();

      const msg =
        err?.response?.data?.detail ||
        err?.message ||
        (modalMode === "REVERSE"
          ? "Failed to reverse payment."
          : "Failed to mark repayment as paid.");

      setToast({ type: "error", message: msg });
    } finally {
      setWorking(false);
    }
  };

  const modalTitle = modalMode === "REVERSE" ? "Reverse Payment" : "Confirm Repayment";

  const modalBody =
    modalMode === "REVERSE"
      ? `Reverse installment #${selectedRepayment?.installment_number}? This will set Amount Paid to ₦0.00 and mark it as Pending again.`
      : `Mark installment #${selectedRepayment?.installment_number} as paid for ${money(
          selectedRepayment?.amount_due
        )}?`;

  const confirmText = modalMode === "REVERSE" ? "Yes, Reverse" : "Confirm";

  return (
    <div style={{ position: "relative" }}>
      
      {toast && (
        <div
          style={{
            position: "fixed",
            right: "1.5rem",
            bottom: "1.5rem",
            zIndex: 60,
            padding: "0.75rem 1rem",
            borderRadius: "0.75rem",
            background: toast.type === "success" ? "#ecfdf3" : "#fef2f2",
            color: toast.type === "success" ? "#166534" : "#b91c1c",
            fontSize: "0.9rem",
            boxShadow: "0 4px 12px rgba(15, 23, 42, 0.25)",
            maxWidth: "360px",
          }}
        >
          {toast.message}
        </div>
      )}

      
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "0.75rem",
          alignItems: "center",
        }}
      >
        <div>
          <h1 className="page-title">Loan Detail</h1>
          <p className="page-subtitle">
            ID: <strong>{id}</strong>{" "}
            <span style={{ marginLeft: "0.5rem", color: "#6b7280", fontSize: "0.85rem" }}>
              (Role: <strong>{role || "UNKNOWN"}</strong>)
            </span>
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate(-1)}
          style={{
            padding: "0.5rem 1rem",
            borderRadius: "999px",
            border: "1px solid #e5e7eb",
            background: "#f9fafb",
            fontSize: "0.85rem",
            cursor: "pointer",
          }}
        >
          ← Back
        </button>
      </div>

      {loadingLoan && <p>Loading loan...</p>}

      {!loadingLoan && error && (
        <div
          style={{
            marginBottom: "0.75rem",
            padding: "0.6rem 0.75rem",
            borderRadius: "0.5rem",
            background: "#fef2f2",
            color: "#b91c1c",
            fontSize: "0.9rem",
          }}
        >
          {error}
        </div>
      )}

      {!loadingLoan && !error && !loan && <p>Loan not found.</p>}

      {!loadingLoan && !error && loan && (
        <>
          
          <div
            style={{
              background: "#ffffff",
              borderRadius: "0.9rem",
              padding: "1rem 1.25rem",
              boxShadow: "0 1px 3px rgba(15, 23, 42, 0.08)",
              border: "1px solid #e5e7eb",
              marginBottom: "1rem",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: "1rem",
                flexWrap: "wrap",
                alignItems: "center",
                marginBottom: "0.75rem",
              }}
            >
              <div style={{ fontSize: "0.9rem", color: "#6b7280" }}>
                Loan Status: <strong>{loan.status || "-"}</strong>
              </div>

              <div style={{ fontSize: "0.9rem", color: "#6b7280" }}>
                Next Due:{" "}
                <strong>{summary.nextDueDate ? dateOnly(summary.nextDueDate) : "-"}</strong>
                {summary.overdueCount > 0 && (
                  <span style={{ marginLeft: "0.5rem", color: "#b91c1c", fontWeight: 800 }}>
                    ({summary.overdueCount} overdue)
                  </span>
                )}
              </div>
            </div>

            
            <div style={{ marginBottom: "0.9rem" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "0.85rem",
                  color: "#6b7280",
                  marginBottom: "0.35rem",
                }}
              >
                <div>
                  Repayment Progress:{" "}
                  <strong>
                    {summary.totalInstallments > 0
                      ? `${summary.paidInstallments}/${summary.totalInstallments} paid`
                      : "No schedule"}
                  </strong>
                </div>
                <div>
                  <strong>{summary.progressPct}%</strong>
                </div>
              </div>

              <div
                style={{
                  height: "10px",
                  borderRadius: "999px",
                  background: "#e5e7eb",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${Math.min(100, Math.max(0, summary.progressPct))}%`,
                    height: "100%",
                    background: "#0ea5e9",
                    borderRadius: "999px",
                    transition: "width 220ms ease",
                  }}
                />
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: "0.75rem 1.25rem",
              }}
            >
              <SummaryItem label="Total Payable" value={money(summary.totalPayable)} />
              <SummaryItem label="Total Paid" value={money(summary.totalPaid)} />
              <SummaryItem label="Outstanding" value={money(summary.outstanding)} />

              <SummaryItem label="Principal" value={money(loan.principal_amount)} />
              <SummaryItem label="Interest Rate" value={`${Number(loan.interest_rate).toFixed(4)}%`} />
              <SummaryItem label="Start" value={dateTime(loan.start_date)} />
              <SummaryItem label="End" value={dateTime(loan.end_date)} />
            </div>
          </div>

          
          <h2 style={{ fontSize: "1.05rem", fontWeight: 900, marginBottom: "0.5rem" }}>
            Repayment Schedule
          </h2>

          {loadingRepayments && <p>Loading repayment schedule...</p>}

          {!loadingRepayments && repayments.length === 0 && (
            <div
              style={{
                padding: "0.75rem",
                borderRadius: "0.75rem",
                background: "#fff7ed",
                border: "1px solid #fed7aa",
                color: "#9a3412",
              }}
            >
              No repayment schedule found for this loan.
              <div style={{ marginTop: "0.4rem", fontSize: "0.85rem", color: "#6b7280" }}>
                This usually means the schedule wasn’t generated at disbursement time, or loan.start_date is null.
              </div>
            </div>
          )}

          {!loadingRepayments && repayments.length > 0 && (
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Due Date</th>
                    <th>Amount Due</th>
                    <th>Amount Paid</th>
                    <th>Status</th>
                    <th>Paid At</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {repayments.map((rep) => {
                    const tag = tagForRow(rep);
                    const isPaid = Boolean(rep.is_paid);

                    const rowBg =
                      tag.tone === "danger"
                        ? "rgba(185, 28, 28, 0.06)"
                        : tag.tone === "warn"
                        ? "rgba(154, 52, 18, 0.06)"
                        : "transparent";

                    return (
                      <tr key={rep.id} style={{ background: rowBg, opacity: isPaid ? 0.92 : 1 }}>
                        <td>{rep.installment_number}</td>
                        <td>{dateOnly(rep.due_date)}</td>
                        <td>{money(rep.amount_due)}</td>
                        <td>{money(rep.amount_paid)}</td>
                        <td>{statusBadge(tag)}</td>
                        <td>{dateTime(rep.paid_at)}</td>
                        <td style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
                          {!isPaid ? (
                            <button
                              type="button"
                              className="btn btn-primary"
                              style={{
                                padding: "0.3rem 0.9rem",
                                fontSize: "0.8rem",
                                whiteSpace: "nowrap",
                              }}
                              onClick={() => openPayModal(rep)}
                              disabled={!canMarkAsPaid}
                              title={!canMarkAsPaid ? "Not allowed for your role" : "Mark this installment as paid"}
                            >
                              Mark as Paid
                            </button>
                          ) : (
                            <>
                              <span style={{ fontSize: "0.8rem", color: "#16a34a", fontWeight: 800 }}>
                                ✓ Done
                              </span>

                              <button
                                type="button"
                                className="btn btn-secondary"
                                style={{
                                  padding: "0.3rem 0.75rem",
                                  fontSize: "0.8rem",
                                  whiteSpace: "nowrap",
                                }}
                                onClick={() => openReverseModal(rep)}
                                disabled={!canReversePayment}
                                title={!canReversePayment ? "Not allowed for your role" : "Reverse this payment"}
                              >
                                Reverse
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <div style={{ marginTop: "0.6rem", fontSize: "0.85rem", color: "#6b7280" }}>
                Tags: <strong>OVERDUE</strong> = unpaid and past due date,{" "}
                <strong>DUE SOON</strong> = unpaid and due within 7 days.
              </div>
            </div>
          )}
        </>
      )}

      
      {modalOpen && selectedRepayment && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15,23,42,0.55)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "440px",
              background: "#ffffff",
              borderRadius: "1rem",
              padding: "1.25rem 1.5rem",
              boxShadow: "0 20px 60px rgba(15,23,42,0.35)",
            }}
          >
            <h3 style={{ fontSize: "1.05rem", fontWeight: 900, marginBottom: "0.5rem" }}>
              {modalTitle}
            </h3>

            <p style={{ fontSize: "0.9rem", color: "#4b5563", marginBottom: "0.85rem" }}>
              {modalBody}
            </p>

            {modalMode === "REVERSE" && (
              <div
                style={{
                  background: "#fff7ed",
                  border: "1px solid #fed7aa",
                  borderRadius: "0.75rem",
                  padding: "0.65rem 0.75rem",
                  fontSize: "0.85rem",
                  color: "#9a3412",
                  marginBottom: "0.9rem",
                }}
              >
                <b>Note:</b> This is for correcting mistakes in the system. It does not “refund cash” physically.
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
              <button
                type="button"
                onClick={closeModal}
                disabled={working}
                style={{
                  padding: "0.45rem 0.9rem",
                  borderRadius: "999px",
                  border: "1px solid #e5e7eb",
                  background: "#ffffff",
                  fontSize: "0.85rem",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirm}
                disabled={working}
                className="btn btn-primary"
                style={{
                  padding: "0.45rem 1.1rem",
                  fontSize: "0.85rem",
                  opacity: working ? 0.85 : 1,
                }}
              >
                {working ? "Processing..." : confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryItem({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: "0.8rem", color: "#6b7280" }}>{label}</div>
      <div style={{ fontWeight: 800, fontSize: "0.95rem" }}>{value}</div>
    </div>
  );
}
