// frontend/src/api/loanApplicationsApi.js
import axiosClient from "./axiosClient";


export async function getLoanApplications(params = {}) {
  const res = await axiosClient.get("/loan-applications", {
    params,
  });
  return res.data;
}


export async function getLoanApplication(id) {
  const res = await axiosClient.get(`/loan-applications/${id}`);
  return res.data;
}


export async function submitPublicLoanApplication(token, payload) {
  const res = await axiosClient.post(
    `/loan-applications/public/${token}`,
    payload
  );
  return res.data;
}


export async function updateLoanApplicationStatus(id, payload) {
  const res = await axiosClient.patch(
    `/loan-applications/${id}/status`,
    payload
  );
  return res.data;
}
