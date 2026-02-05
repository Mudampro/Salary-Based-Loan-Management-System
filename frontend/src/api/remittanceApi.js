import axiosClient from "./axiosClient";

export async function ingestRemittance(payload) {
  const res = await axiosClient.post("/remittance/ingest", payload);
  return res.data;
}
