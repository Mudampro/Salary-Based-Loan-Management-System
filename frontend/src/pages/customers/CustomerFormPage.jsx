import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createCustomer } from "../../api/customersApi";
import { getOrganizations } from "../../api/organizationsApi";

export default function CustomerFormPage() {
  const navigate = useNavigate();

  const [organizations, setOrganizations] = useState([]);
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    staff_id: "",
    organization_id: "",
    net_monthly_salary: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadOrganizations() {
      try {
        const data = await getOrganizations();
        setOrganizations(data);
      } catch (err) {
        console.error(err);
      }
    }

    loadOrganizations();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await createCustomer({
        ...form,
        organization_id: Number(form.organization_id),
        net_monthly_salary: Number(form.net_monthly_salary),
      });

      navigate("/customers");
    } catch (err) {
      console.error(err);
      setError(
        err?.response?.data?.detail || "Failed to create customer."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="page-title">Add Customer</h1>

      {error && (
        <div
          style={{
            marginBottom: "1rem",
            padding: "0.6rem",
            borderRadius: "0.5rem",
            background: "#fef2f2",
            color: "#b91c1c",
          }}
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="form">
        <input
          name="full_name"
          placeholder="Full Name"
          required
          value={form.full_name}
          onChange={handleChange}
        />

        <input
          name="staff_id"
          placeholder="Staff ID"
          required
          value={form.staff_id}
          onChange={handleChange}
        />

        <input
          name="email"
          type="email"
          placeholder="Email"
          required
          value={form.email}
          onChange={handleChange}
        />

        <input
          name="phone"
          placeholder="Phone"
          required
          value={form.phone}
          onChange={handleChange}
        />

        <select
          name="organization_id"
          required
          value={form.organization_id}
          onChange={handleChange}
        >
          <option value="">Select Organization</option>
          {organizations.map((org) => (
            <option key={org.id} value={org.id}>
              {org.name}
            </option>
          ))}
        </select>

        <input
          name="net_monthly_salary"
          type="number"
          placeholder="Net Monthly Salary"
          required
          value={form.net_monthly_salary}
          onChange={handleChange}
        />

        <button className="btn btn-primary" disabled={loading}>
          {loading ? "Saving..." : "Save Customer"}
        </button>
      </form>
    </div>
  );
}
