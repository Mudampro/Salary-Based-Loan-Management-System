// frontend/src/api/axiosClient.js
import axios from "axios";
import { getToken } from "../utils/storage";


const API_BASE_URL =
  (import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || "").trim();


const FALLBACK_LOCAL_URL = "http://localhost:8000";


const baseURL = API_BASE_URL || FALLBACK_LOCAL_URL;

const axiosClient = axios.create({
  baseURL,
  timeout: 30000,
  headers: {
    Accept: "application/json",
  },
});


axiosClient.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default axiosClient;
