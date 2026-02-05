// frontend/src/api/usersApi.js
import axiosClient from "./axiosClient";


export async function getUsers(params = {}) {
  const res = await axiosClient.get("/users", { params });
  return res.data;
}


export async function createUser(payload) {
  const res = await axiosClient.post("/users", payload);
  return res.data;
}


export async function getMe() {
  const res = await axiosClient.get("/users/me");
  return res.data;
}


export async function changeMyPassword(payload) {
  const res = await axiosClient.post("/users/change-password", payload);
  return res.data;
}


export async function adminResetUserPassword(userId, payload) {
  const res = await axiosClient.post(`/users/${userId}/reset-password`, payload);
  return res.data;
}


export async function forgotPassword(payload) {
  const res = await axiosClient.post("/users/forgot-password", payload);
  return res.data;
}


export async function resetPassword(payload) {
  const res = await axiosClient.post("/users/reset-password", payload);
  return res.data;
}
