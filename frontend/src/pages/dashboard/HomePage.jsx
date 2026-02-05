// frontend/src/pages/dashboard/HomePage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { getOrganizations } from "../../api/organizationsApi";
import { getLoanProducts } from "../../api/loanProductsApi";
import { getLoanLinks } from "../../api/loanLinksApi";
import { getLoanApplications } from "../../api/loanApplicationsApi";
import { getLoans } from "../../api/loansApi";
import { getUsers } from "../../api/usersApi";


import { getUser } from "../../utils/storage";

function normalizeRole(role) {
  if (!role) return "UNKNOWN";

  
  if (typeof role === "string") return role.toUpperCase();

  
  if (typeof role === "object") {
    if (role.value) return String(role.value).toUpperCase();
    if (role.name) return String(role.name).toUpperCase();
  }

  return "UNKNOWN";
}

export default function HomePage() {
  const navigate = useNavigate();

  const currentUser = useMemo(() => getUser(), []);
  const userId = currentUser?.id ?? "-";
  const userRole = normalizeRole(currentUser?.role);

  const [orgCount, setOrgCount] = useState(0);
  const [productCount, setProductCount] = useState(0);
  const [linkCount, setLinkCount] = useState(0);
  const [appCount, setAppCount] = useState(0);
  const [loanCount, setLoanCount] = useState(0);
  const [userCount, setUserCount] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDashboardData() {
      setLoading(true);
      setError("");

      try {
        const results = await Promise.allSettled([
          getOrganizations(),
          getLoanProducts(),
          getLoanLinks(),
          getLoanApplications(),
          getLoans(),
          getUsers(),
        ]);

        const [orgRes, productRes, linkRes, appRes, loanRes, userRes] = results;

        let hadError = false;

        if (orgRes.status === "fulfilled") {
          const orgs = orgRes.value;
          setOrgCount(Array.isArray(orgs) ? orgs.length : 0);
        } else {
          console.error("Failed to load organizations:", orgRes.reason);
          hadError = true;
        }

        if (productRes.status === "fulfilled") {
          const products = productRes.value;
          setProductCount(Array.isArray(products) ? products.length : 0);
        } else {
          console.error("Failed to load loan products:", productRes.reason);
          hadError = true;
        }

        if (linkRes.status === "fulfilled") {
          const links = linkRes.value;
          setLinkCount(Array.isArray(links) ? links.length : 0);
        } else {
          console.error("Failed to load loan links:", linkRes.reason);
          hadError = true;
        }

        if (appRes.status === "fulfilled") {
          const apps = appRes.value;
          setAppCount(Array.isArray(apps) ? apps.length : 0);
        } else {
          console.error("Failed to load loan applications:", appRes.reason);
          hadError = true;
        }

        if (loanRes.status === "fulfilled") {
          const loans = loanRes.value;
          setLoanCount(Array.isArray(loans) ? loans.length : 0);
        } else {
          console.error("Failed to load loans:", loanRes.reason);
          setLoanCount(0);
          hadError = true;
        }

        if (userRes.status === "fulfilled") {
          const users = userRes.value;
          setUserCount(Array.isArray(users) ? users.length : 0);
        } else {
          console.error("Failed to load users:", userRes.reason);
          hadError = true;
        }

        if (hadError) {
          setError(
            "Some stats could not be loaded completely. One or more counts may be inaccurate."
          );
        }
      } catch (err) {
        console.error("Unexpected error loading dashboard:", err);
        setError("Failed to load dashboard data. Some stats may be missing.");
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  return (
    <div>
      <h1 className="page-title">Welcome to the Loan Management Dashboard</h1>
      <p className="page-subtitle">
        Quick overview of what you can manage within the system.
      </p>

      
      <div
        style={{
          marginBottom: "1rem",
          padding: "0.6rem 0.75rem",
          borderRadius: "0.5rem",
          background: "#eff6ff",
          color: "#1e3a8a",
          fontSize: "0.9rem",
          border: "1px solid #dbeafe",
        }}
      >
        <strong>ID:</strong> {userId}{" "}
        <span style={{ marginLeft: 8 }}>
          (<strong>Your role:</strong> {userRole})
        </span>
      </div>

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

      <div className="card-grid">
        
        <div
          className="card"
          onClick={() => navigate("/organizations")}
          style={{ cursor: "pointer" }}
        >
          <h2 style={{ fontSize: "1.1rem", marginBottom: "0.4rem", fontWeight: 600 }}>
            Partner Organizations
          </h2>
          <p style={{ fontSize: "0.9rem", color: "#6b7280", marginBottom: "0.75rem" }}>
            Companies whose staff can apply for salary-based loans.
          </p>

          <p style={{ fontSize: "1.4rem", marginBottom: "0.5rem", fontWeight: 500 }}>
            {loading ? "Loading count..." : `${orgCount} organization(s)`}
          </p>

          <button className="btn btn-primary" type="button">
            Go to Organizations
          </button>
        </div>

        
        <div
          className="card"
          onClick={() => navigate("/loan-products")}
          style={{ cursor: "pointer" }}
        >
          <h2 style={{ fontSize: "1.1rem", marginBottom: "0.4rem", fontWeight: 600 }}>
            Loan Products
          </h2>
          <p style={{ fontSize: "0.9rem", color: "#6b7280", marginBottom: "0.75rem" }}>
            Configure the types of loans staff can access.
          </p>

          <p style={{ fontSize: "1.4rem", marginBottom: "0.5rem", fontWeight: 500 }}>
            {loading ? "Loading count..." : `${productCount} product(s)`}
          </p>

          <button className="btn btn-accent" type="button">
            View Loan Products
          </button>
        </div>

        
        <div
          className="card"
          onClick={() => navigate("/loan-links")}
          style={{ cursor: "pointer" }}
        >
          <h2 style={{ fontSize: "1.1rem", marginBottom: "0.4rem", fontWeight: 600 }}>
            Loan Application Links
          </h2>
          <p style={{ fontSize: "0.9rem", color: "#6b7280", marginBottom: "0.75rem" }}>
            Unique links per organization for staff loan requests.
          </p>

          <p style={{ fontSize: "1.4rem", marginBottom: "0.5rem", fontWeight: 500 }}>
            {loading ? "Loading count..." : `${linkCount} link(s)`}
          </p>

          <button className="btn btn-primary" type="button">
            Manage Loan Links
          </button>
        </div>

        
        <div
          className="card"
          onClick={() => navigate("/loan-applications")}
          style={{ cursor: "pointer" }}
        >
          <h2 style={{ fontSize: "1.1rem", marginBottom: "0.4rem", fontWeight: 600 }}>
            Loan Applications
          </h2>
          <p style={{ fontSize: "0.9rem", color: "#6b7280", marginBottom: "0.75rem" }}>
            Monitor applications coming from your partner organizations.
          </p>

          <p style={{ fontSize: "1.4rem", marginBottom: "0.5rem", fontWeight: 500 }}>
            {loading ? "Loading count..." : `${appCount} application(s)`}
          </p>

          <button className="btn btn-accent" type="button">
            View Applications
          </button>
        </div>

        
        <div
          className="card"
          onClick={() => navigate("/loans")}
          style={{ cursor: "pointer" }}
        >
          <h2 style={{ fontSize: "1.1rem", marginBottom: "0.4rem", fontWeight: 600 }}>
            Loans
          </h2>
          <p style={{ fontSize: "0.9rem", color: "#6b7280", marginBottom: "0.75rem" }}>
            Total number of active or disbursed loans in the system.
          </p>

          <p style={{ fontSize: "1.4rem", marginBottom: "0.5rem", fontWeight: 500 }}>
            {loading ? "Loading count..." : `${loanCount} loan(s)`}
          </p>

          <button className="btn btn-primary" type="button">
            View Loans
          </button>
        </div>

        
        <div
          className="card"
          onClick={() => navigate("/users")}
          style={{ cursor: "pointer" }}
        >
          <h2 style={{ fontSize: "1.1rem", marginBottom: "0.4rem", fontWeight: 600 }}>
            System Users
          </h2>
          <p style={{ fontSize: "0.9rem", color: "#6b7280", marginBottom: "0.75rem" }}>
            Admin, Loan Officers, Managers, Cashiers and Authorizers using the system.
          </p>

          <p style={{ fontSize: "1.4rem", marginBottom: "0.5rem", fontWeight: 500 }}>
            {loading ? "Loading count..." : `${userCount} user(s)`}
          </p>

          <button className="btn btn-accent" type="button">
            Manage Users
          </button>
        </div>
      </div>
    </div>
  );
}
