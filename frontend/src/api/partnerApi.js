// frontend/src/api/partnerApi.js

import partnerAxiosClient from "./partnerAxiosClient";

export async function partnerLogin(email, password) {
  const body = new URLSearchParams();
  body.append("username", email);
  body.append("password", password);

  const res = await partnerAxiosClient.post("/partner/auth/login", body, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });

  return res.data;
}


export async function validatePartnerInvite(token) {
  const res = await partnerAxiosClient.post("/partner/invite/validate", { token });
  return res.data;
}

export async function completePartnerInvite(payload) {
  const res = await partnerAxiosClient.post("/partner/invite/complete", payload);
  return res.data;
}

export async function partnerMe() {
  const res = await partnerAxiosClient.get("/partner/dashboard/me");
  return res.data;
}

export async function getMyRemittanceAccount() {
  const res = await partnerAxiosClient.get("/partner/dashboard/remittance-account");
  return res.data;
}

export async function getMyMonthlyDue(year, month) {
  const res = await partnerAxiosClient.get("/partner/dashboard/monthly-due", {
    params: { year, month },
  });
  return res.data;
}

export async function partnerRemit(payload) {
  const res = await partnerAxiosClient.post("/partner/dashboard/remit", payload);
  return res.data;
}

export async function getMyPartnerTransactions() {
  const res = await partnerAxiosClient.get("/partner/dashboard/transactions");
  return res.data;
}

export async function getMyStaffLoans() {
  const res = await partnerAxiosClient.get("/partner/dashboard/staff-loans");
  return res.data;
}

export async function getMyOrgLoans() {
  const res = await partnerAxiosClient.get("/partner/dashboard/loans");
  return res.data;
}
