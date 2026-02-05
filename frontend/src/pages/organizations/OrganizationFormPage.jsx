// frontend/src/pages/organizations/OrganizationFormPage.jsx
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  createOrganization,
  getOrganization,
  updateOrganization,
} from "../../api/organizationsApi";

export default function OrganizationFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    contact_person_name: "",
    contact_person_email: "",
    contact_person_phone: "",
  });

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEdit);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchOrg() {
      if (!isEdit) return;
      try {
        setInitialLoading(true);
        const data = await getOrganization(id);

        setForm({
          name: data?.name || "",
          email: data?.email || "",
          phone: data?.phone || "",
          address: data?.address || "",
          contact_person_name: data?.contact_person_name || "",
          contact_person_email: data?.contact_person_email || "",
          contact_person_phone: data?.contact_person_phone || "",
        });
      } catch (err) {
        console.error(err);
        setError("Failed to load organization.");
      } finally {
        setInitialLoading(false);
      }
    }
    fetchOrg();
  }, [id, isEdit]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        address: form.address.trim() || null,
        contact_person_name: form.contact_person_name.trim() || null,
        contact_person_email: form.contact_person_email.trim() || null,
        contact_person_phone: form.contact_person_phone.trim() || null,
      };

      if (isEdit) {
        await updateOrganization(id, payload);
      } else {
        await createOrganization(payload);
      }

      navigate("/organizations");
    } catch (err) {
      console.error(err);
      const msg =
        err?.response?.data?.detail ||
        "Failed to save organization. Please check the fields.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) return <p>Loading organization...</p>;

  return (
    <div className="card" style={{ maxWidth: 700 }}>
      <h1 className="page-title" style={{ fontSize: "1.25rem" }}>
        {isEdit ? "Edit Organization" : "New Organization"}
      </h1>

      {error && (
        <div
          style={{
            marginBottom: "1rem",
            padding: "0.5rem 0.75rem",
            borderRadius: "0.5rem",
            background: "#fee2e2",
            color: "#991b1b",
            fontSize: "0.875rem",
          }}
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        
        <div style={{ marginBottom: "0.75rem" }}>
          <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.875rem" }}>
            Organization Name *
          </label>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            required
            style={{
              width: "100%",
              padding: "0.5rem 0.75rem",
              borderRadius: "0.5rem",
              border: "1px solid #d1d5db",
            }}
          />
        </div>

        
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "0.75rem",
            marginBottom: "0.75rem",
          }}
        >
          <div>
            <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.875rem" }}>
              Organization Email
            </label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              style={{
                width: "100%",
                padding: "0.5rem 0.75rem",
                borderRadius: "0.5rem",
                border: "1px solid #d1d5db",
              }}
            />
          </div>

          <div>
            <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.875rem" }}>
              Organization Phone
            </label>
            <input
              name="phone"
              value={form.phone}
              onChange={handleChange}
              style={{
                width: "100%",
                padding: "0.5rem 0.75rem",
                borderRadius: "0.5rem",
                border: "1px solid #d1d5db",
              }}
            />
          </div>
        </div>

        
        <div style={{ marginBottom: "0.75rem" }}>
          <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.875rem" }}>
            Address
          </label>
          <textarea
            name="address"
            value={form.address}
            onChange={handleChange}
            rows={3}
            style={{
              width: "100%",
              padding: "0.5rem 0.75rem",
              borderRadius: "0.5rem",
              border: "1px solid #d1d5db",
              resize: "vertical",
            }}
          />
        </div>

        
        <div
          style={{
            marginTop: "1rem",
            marginBottom: "0.75rem",
            padding: "0.75rem",
            borderRadius: "0.75rem",
            border: "1px solid #e5e7eb",
            background: "#f9fafb",
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: "0.75rem" }}>
            Contact Person (HR / Accounts)
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "0.75rem",
              marginBottom: "0.75rem",
            }}
          >
            <div>
              <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.875rem" }}>
                Full Name
              </label>
              <input
                name="contact_person_name"
                value={form.contact_person_name}
                onChange={handleChange}
                style={{
                  width: "100%",
                  padding: "0.5rem 0.75rem",
                  borderRadius: "0.5rem",
                  border: "1px solid #d1d5db",
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.875rem" }}>
                Email
              </label>
              <input
                type="email"
                name="contact_person_email"
                value={form.contact_person_email}
                onChange={handleChange}
                style={{
                  width: "100%",
                  padding: "0.5rem 0.75rem",
                  borderRadius: "0.5rem",
                  border: "1px solid #d1d5db",
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.875rem" }}>
              Phone
            </label>
            <input
              name="contact_person_phone"
              value={form.contact_person_phone}
              onChange={handleChange}
              style={{
                width: "100%",
                padding: "0.5rem 0.75rem",
                borderRadius: "0.5rem",
                border: "1px solid #d1d5db",
              }}
            />
          </div>
        </div>

        
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button type="submit" disabled={loading} className="btn btn-primary">
            {loading ? "Saving..." : "Save"}
          </button>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate("/organizations")}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
