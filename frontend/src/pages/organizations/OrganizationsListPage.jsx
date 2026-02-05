// frontend/src/pages/organizations/OrganizationsListPage.jsx
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getOrganizations } from "../../api/organizationsApi";

export default function OrganizationsListPage() {
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const data = await getOrganizations();
        setOrganizations(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
        setError("Failed to load organizations.");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  return (
    <div>
      <div
        style={{
          marginBottom: "1rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h1 className="page-title">Organizations</h1>
        <button
          onClick={() => navigate("/organizations/new")}
          className="btn btn-primary"
        >
          + New Organization
        </button>
      </div>

      {loading && <p>Loading...</p>}
      {error && <p style={{ color: "#b91c1c", marginBottom: "1rem" }}>{error}</p>}

      {!loading && !error && organizations.length === 0 && (
        <p>No organizations yet. Click "New Organization" to create one.</p>
      )}

      {!loading && !error && organizations.length > 0 && (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Contact Person</th>
                <th>Contact Phone</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {organizations.map((org) => (
                <tr key={org.id}>
                  <td>{org.name}</td>
                  <td>{org.email || "-"}</td>
                  <td>{org.phone || "-"}</td>
                  <td>{org.contact_person_name || "-"}</td>
                  <td>{org.contact_person_phone || "-"}</td>
                  <td>
                    <Link
                      to={`/organizations/${org.id}/edit`}
                      style={{ color: "#2563eb", fontSize: "0.85rem" }}
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
