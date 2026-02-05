import axiosClient from "./axiosClient";

export async function getCustomers() {
  const res = await axiosClient.get("/customers");
  return res.data;
}

export async function createCustomer(data) {
  const res = await axiosClient.post("/customers", data);
  return res.data;
}

export async function getCustomerById(id) {
  const res = await axiosClient.get(`/customers/${id}`);
  return res.data;
}

export async function getCustomerLoanHistory(id) {
  const res = await axiosClient.get(`/customers/${id}/loan-history`);
  return res.data;
}

export async function getCustomerLoans(id) {
  const res = await axiosClient.get(`/customers/${id}/loans`);
  return res.data;
}
