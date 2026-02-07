// frontend/src/api/partnerAxiosClient.js

import axios from "axios";
import { getPartnerToken } from "../utils/partnerStorage";

const partnerAxiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000",
});

partnerAxiosClient.interceptors.request.use((config) => {
  const token = getPartnerToken();

  
  const url = config.url || "";
  const isInviteEndpoint =
    url.includes("/partner/invite/validate") ||
    url.includes("/partner/invite/complete");

  if (token && !isInviteEndpoint) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default partnerAxiosClient;
