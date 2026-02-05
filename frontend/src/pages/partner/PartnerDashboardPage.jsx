import React, { useEffect, useMemo, useState } from "react";
import { getPartnerUser } from "../../utils/partnerStorage";
import {
  getMyPartnerTransactions,
  partnerRemit,
  getMyMonthlyDue,
} from "../../api/partnerApi";

function monthOptions() {
  return [
    { value: 1, label: "January" },
    { value: 2, label: "February" },
    { value: 3, label: "March" },
    { value: 4, label: "April" },
    { value: 5, label: "May" },
    { value: 6, label: "June" },
    { value: 7, label: "July" },
    { value: 8, label: "August" },
    { value: 9, label: "September" },
    { value: 10, label: "October" },
    { value: 11, label: "November" },
    { value: 12, label: "December" },
  ];
}

function makePaidAtISO(year, month) {
  const d = new Date(Number(year), Number(month) - 1, 15, 12, 0, 0);
  return d.toISOString();
}

export default function PartnerDashboardPage() {
  const partnerUser = useMemo(() => getPartnerUser(), []);

  const now = new Date();
  const defaultYear = now.getFullYear();
  const defaultMonth = now.getMonth() + 1;

  const [monthlyDue, setMonthlyDue] = useState(null);

  const [selectedYear, setSelectedYear] = useState(defaultYear);
  const [selectedMonth, setSelectedMonth] = useState(defaultMonth);
  const [dueLoading, setDueLoading] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitMsg, setSubmitMsg] = useState("");

  const [form, setForm] = useState({
    amount: "",
    narration: "",
    sender_name: "",
  });

  const formatNaira = (n) => `₦${Number(n || 0).toLocaleString()}`;

  async function loadBase() {
    
    try {
      await getMyPartnerTransactions();
    } catch (e) {
      
    }
  }

  async function loadMonthlyDue(year, month, autoFill = false) {
    setDueLoading(true);
    setError("");
    try {
      const m = await getMyMonthlyDue(Number(year), Number(month));
      setMonthlyDue(m);

      if (autoFill && m?.amount_due != null) {
        setForm((p) => ({ ...p, amount: String(m.amount_due) }));
      }
    } catch (e) {
      console.error(e);
      setError(
        e?.response?.data?.detail || "Failed to load expected monthly remittance."
      );
    } finally {
      setDueLoading(false);
    }
  }

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError("");
      try {
        await loadBase();
        await loadMonthlyDue(defaultYear, defaultMonth, true);
      } finally {
        setLoading(false);
      }
    })();
    
  }, []);

  const onLoadSelectedMonth = async () => {
    await loadMonthlyDue(selectedYear, selectedMonth, true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const handleRemit = async (e) => {
    e.preventDefault();
    setSubmitMsg("");
    setError("");

    if (!partnerUser?.organization_id) {
      setError("Organization not found on your account.");
      return;
    }

    const amt = Number(form.amount);
    if (!Number.isFinite(amt) || amt <= 0) {
      setError("Enter a valid amount greater than 0.");
      return;
    }

    setSubmitLoading(true);
    try {
      const payload = {
        organization_id: Number(partnerUser.organization_id),
        amount: amt,
        narration: form.narration ? String(form.narration).trim() : null,
        sender_name: form.sender_name ? String(form.sender_name).trim() : null,
        paid_at: makePaidAtISO(selectedYear, selectedMonth),
      };

      const res = await partnerRemit(payload);

      setSubmitMsg(res?.message || "Remittance received. Pending bank allocation.");

      setForm({ amount: "", narration: "", sender_name: "" });

      await loadBase();
      await loadMonthlyDue(selectedYear, selectedMonth, true);
    } catch (e2) {
      console.error(e2);
      setError(e2?.response?.data?.detail || "Failed to submit remittance.");
    } finally {
      setSubmitLoading(false);
    }
  };

  const months = monthOptions();
  const yearOptions = [];
  for (let y = defaultYear - 3; y <= defaultYear + 3; y++) yearOptions.push(y);

  return (
    <div>
      <h1 className="page-title">Remittance Dashboard</h1>
      <p className="page-subtitle">
        View expected remittance and submit remittance for a selected month.
      </p>

      {error && (
        <div
          style={{
            marginBottom: "1rem",
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

      {submitMsg && (
        <div
          style={{
            marginBottom: "1rem",
            padding: "0.6rem 0.75rem",
            borderRadius: "0.5rem",
            background: "#ecfdf3",
            color: "#166534",
            fontSize: "0.9rem",
            whiteSpace: "pre-wrap",
          }}
        >
          {submitMsg}
        </div>
      )}

      {loading ? (
        <p style={{ color: "#6b7280" }}>Loading...</p>
      ) : (
        <>
          
          <div className="card" style={{ marginBottom: "1rem" }}>
            <h2 style={{ fontSize: "1.05rem", fontWeight: 600, marginBottom: "0.75rem" }}>
              Expected Remittance (Select Month)
            </h2>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr auto",
                gap: ".75rem",
                maxWidth: 700,
              }}
            >
              <div>
                <label style={{ display: "block", fontSize: "0.9rem", marginBottom: "0.25rem" }}>
                  Month
                </label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  style={{
                    width: "100%",
                    padding: "0.55rem 0.7rem",
                    borderRadius: "0.5rem",
                    border: "1px solid #d1d5db",
                  }}
                >
                  {months.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.9rem", marginBottom: "0.25rem" }}>
                  Year
                </label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  style={{
                    width: "100%",
                    padding: "0.55rem 0.7rem",
                    borderRadius: "0.5rem",
                    border: "1px solid #d1d5db",
                  }}
                >
                  {yearOptions.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>

              <button
                className="btn btn-accent"
                type="button"
                onClick={onLoadSelectedMonth}
                disabled={dueLoading}
                style={{ height: 40 }}
              >
                {dueLoading ? "Loading..." : "Load"}
              </button>
            </div>

            <div style={{ marginTop: "1rem", fontSize: "0.95rem" }}>
              {monthlyDue ? (
                <>
                  <div>
                    <strong>Total Due:</strong> {formatNaira(monthlyDue.amount_due)}
                  </div>
                  <div style={{ color: "#6b7280", marginTop: "0.25rem" }}>
                    {monthlyDue.repayments_count} installment(s) due in {selectedMonth}/{selectedYear}
                  </div>
                </>
              ) : (
                <div style={{ color: "#6b7280" }}>No due data loaded yet.</div>
              )}
            </div>
          </div>

          
          <div className="card" style={{ marginBottom: "1rem" }}>
            <h2 style={{ fontSize: "1.05rem", fontWeight: 600, marginBottom: "0.75rem" }}>
              Submit Remittance (for {selectedMonth}/{selectedYear})
            </h2>

            <div style={{ marginBottom: "0.75rem", fontSize: "0.9rem", color: "#374151" }}>
              <strong>Transfer Reference:</strong>
              <div style={{ marginTop: 4, color: "#6b7280" }}>
                Will be generated automatically after submission.
              </div>
            </div>

            <form onSubmit={handleRemit}>
              <div style={{ display: "grid", gap: "0.75rem", maxWidth: 560 }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.9rem", marginBottom: "0.25rem" }}>
                    Amount (₦)
                  </label>
                  <input
                    type="number"
                    name="amount"
                    value={form.amount}
                    onChange={handleChange}
                    required
                    min="0"
                    step="0.01"
                    style={{
                      width: "100%",
                      padding: "0.55rem 0.7rem",
                      borderRadius: "0.5rem",
                      border: "1px solid #d1d5db",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.9rem", marginBottom: "0.25rem" }}>
                    Sender Name (optional)
                  </label>
                  <input
                    type="text"
                    name="sender_name"
                    value={form.sender_name}
                    onChange={handleChange}
                    placeholder="e.g. Organization Accounts Dept"
                    style={{
                      width: "100%",
                      padding: "0.55rem 0.7rem",
                      borderRadius: "0.5rem",
                      border: "1px solid #d1d5db",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.9rem", marginBottom: "0.25rem" }}>
                    Narration (optional)
                  </label>
                  <input
                    type="text"
                    name="narration"
                    value={form.narration}
                    onChange={handleChange}
                    placeholder="Optional note"
                    style={{
                      width: "100%",
                      padding: "0.55rem 0.7rem",
                      borderRadius: "0.5rem",
                      border: "1px solid #d1d5db",
                    }}
                  />
                </div>
              </div>

              <button
                className="btn btn-primary"
                type="submit"
                disabled={submitLoading}
                style={{ marginTop: "1rem" }}
              >
                {submitLoading ? "Submitting..." : "Submit Remittance"}
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
