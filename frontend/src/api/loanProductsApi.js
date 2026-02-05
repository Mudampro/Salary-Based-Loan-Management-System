// frontend/src/api/loanProductsApi.js
import axiosClient from "./axiosClient";

export async function getLoanProducts() {
  const res = await axiosClient.get("/loan-products");
  return res.data;
}

export async function getLoanProduct(id) {
  const res = await axiosClient.get(`/loan-products/${id}`);
  return res.data;
}

export async function createLoanProduct(payload) {
  const res = await axiosClient.post("/loan-products", payload);
  return res.data;
}

export async function updateLoanProduct(id, payload) {
  const res = await axiosClient.put(`/loan-products/${id}`, payload);
  return res.data;
}
