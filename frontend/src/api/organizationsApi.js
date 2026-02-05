// frontend/src/api/organizationsApi.js
import axiosClient from "./axiosClient";

export async function getOrganizations() {
  const res = await axiosClient.get("/organizations");
  return res.data;
}

export async function getOrganization(id) {
  const res = await axiosClient.get(`/organizations/${id}`);
  return res.data;
}

export async function createOrganization(payload) {
  const res = await axiosClient.post("/organizations", payload);
  return res.data;
}

export async function updateOrganization(id, payload) {
  const res = await axiosClient.put(`/organizations/${id}`, payload);
  return res.data;
}
