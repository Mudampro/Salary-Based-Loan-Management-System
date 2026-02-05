// frontend/src/layouts/PartnerLayout.jsx
import React, { useEffect, useMemo, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { clearPartnerAuth, getPartnerUser } from "../utils/partnerStorage";
import { getMyRemittanceAccount } from "../api/partnerApi";

export default function PartnerLayout() {
  const navigate = useNavigate();
  const user = useMemo(() => getPartnerUser(), []);

  const displayName = user?.full_name || user?.email || "Partner";
  const orgLabel = user?.organization_id
    ? `Org #${user.organization_id}`
    : "Organization";

  
  const [acct, setAcct] = useState(null);
  const [acctLoading, setAcctLoading] = useState(false);
  const [acctError, setAcctError] = useState("");
  const [showAcct, setShowAcct] = useState(false);

  
  useEffect(() => {
    (async () => {
      try {
        setAcctLoading(true);
        const a = await getMyRemittanceAccount();
        setAcct(a);
      } catch (e) {
        console.error(e);
        setAcct(null);
        setAcctError(
          e?.response?.data?.detail || "Failed to load remittance account."
        );
      } finally {
        setAcctLoading(false);
      }
    })();
  }, []);

  const linkClass = ({ isActive }) =>
    "sidebar-link" + (isActive ? " sidebar-link-active" : "");

  const handleLogout = () => {
    clearPartnerAuth();
    navigate("/partner/login");
  };

  const toggleAccount = async () => {
    const next = !showAcct;
    setShowAcct(next);

    if (next && !acct && !acctLoading) {
      setAcctLoading(true);
      setAcctError("");
      try {
        const a = await getMyRemittanceAccount();
        setAcct(a);
      } catch (e) {
        console.error(e);
        setAcct(null);
        setAcctError(
          e?.response?.data?.detail || "Failed to load remittance account."
        );
      } finally {
        setAcctLoading(false);
      }
    }
  };

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div style={{ fontWeight: 700, lineHeight: 1.1 }}>
            Organization Dashboard
          </div>
          <div style={{ fontSize: "0.82rem", opacity: 0.85, marginTop: "0.2rem" }}>
            Salary Loan Remittance
          </div>

          <div
            style={{
              marginTop: "0.75rem",
              padding: "0.6rem 0.65rem",
              borderRadius: "0.7rem",
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <div style={{ fontSize: "0.9rem", fontWeight: 600 }}>
              {displayName}
            </div>
            <div
              style={{
                fontSize: "0.75rem",
                opacity: 0.85,
                marginTop: "0.15rem",
              }}
            >
              {orgLabel}
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          
          <button
            type="button"
            onClick={toggleAccount}
            className={"sidebar-link" + (showAcct ? " sidebar-link-active" : "")}
            style={{
              textAlign: "left",
              width: "100%",
              background: "transparent",
              border: "none",
              cursor: "pointer",
            }}
          >
            Remittance Account{" "}
            <span style={{ float: "right", opacity: 0.75 }}>
              {showAcct ? "▾" : "▸"}
            </span>
          </button>

          {showAcct && (
            <div
              style={{
                marginTop: "0.5rem",
                padding: "0.6rem 0.65rem",
                borderRadius: "0.7rem",
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              {acctLoading ? (
                <div style={{ fontSize: "0.78rem", opacity: 0.85 }}>
                  Loading account...
                </div>
              ) : acctError ? (
                <div style={{ fontSize: "0.78rem", color: "#fecaca" }}>
                  {acctError}
                </div>
              ) : acct ? (
                <div style={{ fontSize: "0.78rem", lineHeight: 1.35 }}>
                  <div>
                    <span style={{ opacity: 0.8 }}>Bank:</span>{" "}
                    <strong>{acct.bank_name}</strong>
                  </div>
                  <div style={{ marginTop: 4 }}>
                    <span style={{ opacity: 0.8 }}>Account No:</span>{" "}
                    <strong>{acct.account_number}</strong>
                  </div>
                  <div style={{ marginTop: 4 }}>
                    <span style={{ opacity: 0.8 }}>Name:</span>{" "}
                    <strong>{acct.account_name}</strong>
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: "0.78rem", opacity: 0.85 }}>
                  No active remittance account.
                </div>
              )}
            </div>
          )}

          
          <NavLink to="/partner/dashboard" end className={linkClass}>
            Remittance
          </NavLink>

          <NavLink to="/partner/staff-loans" className={linkClass}>
            Staff Loans
          </NavLink>

          <NavLink to="/partner/transactions" className={linkClass}>
            Transactions
          </NavLink>
        </nav>

        <button className="sidebar-logout" onClick={handleLogout}>
          Logout
        </button>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
