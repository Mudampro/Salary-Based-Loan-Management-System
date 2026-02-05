import React, { useMemo } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";

export default function DashboardLayout() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const roleLabel = useMemo(() => {
    const r = user?.role || "";
    return String(r).replaceAll("_", " ").toUpperCase();
  }, [user]);

  const displayName = user?.full_name || user?.email || "Dashboard";

  const linkClass = ({ isActive }) =>
    "sidebar-link" + (isActive ? " sidebar-link-active" : "");

  const canSeeUsers = String(user?.role || "").toUpperCase() === "ADMIN";
  const canSeePartnerUsers = canSeeUsers; 
  const canSeeRemittanceLedger =
    ["ADMIN", "MANAGER", "CASHIER"].includes(String(user?.role || "").toUpperCase());

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div style={{ fontWeight: 700 }}>NUN MFB</div>
          <div style={{ fontSize: "0.82rem", opacity: 0.85 }}>
            Salary Loan Dashboard
          </div>

          <div
            style={{
              marginTop: "0.75rem",
              padding: "0.6rem",
              borderRadius: "0.7rem",
              background: "rgba(255,255,255,0.06)",
            }}
          >
            <div style={{ fontSize: "0.9rem", fontWeight: 600 }}>
              {displayName}
            </div>
            <div style={{ fontSize: "0.75rem", opacity: 0.85 }}>
              {roleLabel}
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <NavLink to="/" end className={linkClass}>
            Home
          </NavLink>
          <NavLink to="/organizations" className={linkClass}>
            Organizations
          </NavLink>
          <NavLink to="/customers" className={linkClass}>
            Customers
          </NavLink>
          <NavLink to="/loan-products" className={linkClass}>
            Loan Products
          </NavLink>
          <NavLink to="/loan-links" className={linkClass}>
            Loan Links
          </NavLink>
          <NavLink to="/loan-applications" className={linkClass}>
            Loan Applications
          </NavLink>
          <NavLink to="/loans" className={linkClass}>
            Loans
          </NavLink>

          
          {canSeeRemittanceLedger && (
            <NavLink to="/remittance-ledger" className={linkClass}>
              Remittance Ledger
            </NavLink>
          )}

          
          {canSeePartnerUsers && (
            <NavLink to="/partner-users" className={linkClass}>
              Partner Users
            </NavLink>
          )}

          {canSeeUsers && (
            <NavLink to="/users" className={linkClass}>
              Users
            </NavLink>
          )}

          <NavLink to="/reports/org-monthly" className={linkClass}>
            Reports
          </NavLink>
          <NavLink to="/account" className={linkClass}>
            Settings
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
