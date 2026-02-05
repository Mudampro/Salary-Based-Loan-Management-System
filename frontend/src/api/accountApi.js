// frontend/src/api/accountApi.js
import axiosClient from "./axiosClient";


export async function changeMyPassword(payload) {
  const res = await axiosClient.patch("/users/me/change-password", payload);
  return res.data;
}


export async function forgotPassword(payload) {
  const res = await axiosClient.post("/users/forgot-password", payload);
  return res.data;
}


export async function resetPasswordWithToken(payload) {
  const res = await axiosClient.post("/users/reset-password", payload);
  return res.data;
}
