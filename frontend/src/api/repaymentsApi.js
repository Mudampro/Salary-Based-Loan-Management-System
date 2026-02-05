// frontend/src/api/repaymentsApi.js
import axiosClient from "./axiosClient";

export async function getRepaymentsForLoan(loanId) {
  const res = await axiosClient.get(`/repayments/loan/${loanId}`);
  return res.data;
}

export async function markRepaymentPaid(repaymentId, payload) {
  const res = await axiosClient.patch(`/repayments/${repaymentId}/pay`, payload);
  return res.data;
}


export async function reverseRepayment(repaymentId, payload = {}) {
  const res = await axiosClient.patch(`/repayments/${repaymentId}/reverse`, payload);
  return res.data;
}
