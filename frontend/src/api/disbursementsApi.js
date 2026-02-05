// frontend/src/api/disbursementsApi.js
import axiosClient from "./axiosClient";


export async function disburseApprovedApplication(applicationId, payload = {}) {
  const res = await axiosClient.post(
    `/disbursements/application/${applicationId}`,
    payload
  );
  return res.data;
}
