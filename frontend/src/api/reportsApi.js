// frontend/src/api/reportsApi.js
import axiosClient from "./axiosClient";


export async function getOrgMonthlyReport(params) {
  const res = await axiosClient.get("/reports/org-monthly", {
    params: {
      organization_id: params.organization_id,
      year: params.year,
      month: params.month,
    },
  });
  return res.data;
}


export async function getOrgMonthlyReportV2(params) {
  const res = await axiosClient.get("/reports/org-monthly-v2", {
    params: {
      organization_id: params.organization_id,
      year: params.year,
      month: params.month,
    },
  });
  return res.data;
}
