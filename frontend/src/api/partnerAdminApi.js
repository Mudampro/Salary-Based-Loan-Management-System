// frontend/src/api/partnerAdminApi.js

import axiosClient from "./axiosClient";


export async function createPartnerInvite(payload) {
  const res = await axiosClient.post("/partner/invite/create", payload);
  return res.data;
}


export async function listPartnerUsers() {
  const res = await axiosClient.get("/partner/admin/users");
  return res.data;
}


export async function activatePartnerUser(id) {
  const res = await axiosClient.patch(`/partner/admin/users/${id}/activate`);
  return res.data;
}


export async function deactivatePartnerUser(id) {
  const res = await axiosClient.patch(`/partner/admin/users/${id}/deactivate`);
  return res.data;
}


export async function deletePartnerUser(id) {
  const res = await axiosClient.delete(`/partner/admin/users/${id}`);
  return res.data;
}
