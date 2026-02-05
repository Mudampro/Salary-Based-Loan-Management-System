// frontend/src/pages/users/UsersListPage.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getUsers } from "../../api/usersApi";

export default function UsersListPage() {
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError("");
        const data = await getUsers();
        setUsers(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
        setError("Failed to load users.");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const handleRowClick = (id) => {
    navigate(`/users/${id}/edit`);
  };

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
        <h1 className="page-title">Users</h1>
        <button
          onClick={() => navigate("/users/new")}
          className="btn btn-primary"
        >
          + New User
        </button>
      </div>

      {loading && <p>Loading...</p>}
      {error && (
        <p style={{ color: "#b91c1c", marginBottom: "1rem" }}>{error}</p>
      )}

      {!loading && !error && users.length === 0 && (
        <p>No users yet. Click "New User" to create one.</p>
      )}

      {!loading && !error && users.length > 0 && (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Full Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Active</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr
                  key={u.id}
                  className="clickable-row"
                  onClick={() => handleRowClick(u.id)}
                  style={{ cursor: "pointer" }}
                >
                  <td>{u.id}</td>
                  <td>{u.full_name}</td>
                  <td>{u.email}</td>
                  <td>{u.role}</td>
                  <td>{u.is_active ? "Yes" : "No"}</td>
                  <td>
                    {u.created_at
                      ? new Date(u.created_at).toLocaleDateString("en-GB", {
                          year: "numeric",
                          month: "short",
                          day: "2-digit",
                        })
                      : "-"}
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
