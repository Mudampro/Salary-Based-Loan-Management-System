// frontend/src/api/loanLinksApi.js
import axiosClient from "./axiosClient";


export async function getLoanLinks() {
  const res = await axiosClient.get("/loan-links");
  return res.data;
}


export async function createLoanLink(organizationId, loanProductId) {
  const res = await axiosClient.post(
    "/loan-links",
    null, 
    {
      params: {
        organization_id: Number(organizationId),
        product_id: Number(loanProductId),
      },
    }
  );
  return res.data;
}


export async function getLoanLinkByToken(token) {
  const res = await axiosClient.get(`/loan-links/public/${token}`);
  return res.data;
}
