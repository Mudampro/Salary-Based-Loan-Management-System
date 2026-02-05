import axiosClient from "./axiosClient";

export async function createRemittanceAccount(payload) {
  const res = await axiosClient.post("/remittance-accounts/", payload);
  return res.data;
}

export async function getRemittanceAccountsByOrg(organizationId) {
  const res = await axiosClient.get(
    `/remittance-accounts/org/${organizationId}`
  );
  return res.data;
}

export async function getActiveRemittanceAccountByOrg(organizationId) {
  const res = await axiosClient.get(
    `/remittance-accounts/org/${organizationId}/active`
  );
  return res.data;
}
