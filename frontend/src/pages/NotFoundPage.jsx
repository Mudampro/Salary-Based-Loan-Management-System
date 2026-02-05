import React from "react";
import { useNavigate } from "react-router-dom";

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div>
      <h1 className="page-title">Page not found</h1>
      <p style={{ marginBottom: "1rem", color: "#6b7280" }}>
        The page you are trying to open does not exist.
      </p>

      <button className="btn btn-primary" onClick={() => navigate("/")}>
        Go Home
      </button>
    </div>
  );
}
