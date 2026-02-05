// frontend/src/api/loansApi.js
import axiosClient from "./axiosClient";


export async function getLoans(params = {}) {
  const finalParams = { ...params };

  
  if (finalParams.status_filter && !finalParams.status) {
    finalParams.status = finalParams.status_filter;
  }

  const res = await axiosClient.get("/loans", { params: finalParams });
  return res.data;
}


export async function getLoan(id) {
  const res = await axiosClient.get(`/loans/${id}`);
  return res.data;
}
