import axiosClient from "./axiosClient";


export async function getAdminRemittanceSummary(organizationId) {
  const res = await axiosClient.get("/admin/remittances/summary", {
    params: { organization_id: organizationId },
  });
  return res.data;
}


export async function getAdminRemittanceTransactions(organizationId) {
  const res = await axiosClient.get("/admin/remittances/transactions", {
    params: { organization_id: organizationId },
  });
  return res.data;
}


export async function getTransactionAllocations(transactionId) {
  const res = await axiosClient.get(
    `/admin/remittances/transactions/${transactionId}/allocations`
  );
  return res.data;
}


export async function applyInboundTransaction(transactionId) {
  const res = await axiosClient.post(
    `/admin/remittances/transactions/${transactionId}/apply`
  );
  return res.data;
}


export async function reverseInboundTransaction(transactionId) {
  const res = await axiosClient.post(
    `/admin/remittances/transactions/${transactionId}/reverse`
  );
  return res.data;
}
