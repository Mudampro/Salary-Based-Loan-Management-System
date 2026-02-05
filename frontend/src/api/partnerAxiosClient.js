import axios from "axios";
import { getPartnerToken } from "../utils/partnerStorage";

const partnerAxiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000",
});

partnerAxiosClient.interceptors.request.use((config) => {
  const token = getPartnerToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default partnerAxiosClient;
