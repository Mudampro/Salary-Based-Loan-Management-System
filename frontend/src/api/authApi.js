// frontend/src/api/authApi.js
import axiosClient from "./axiosClient";


export async function loginApi(email, password) {
  const form = new URLSearchParams();
  form.append("username", email);   
  form.append("password", password);

  const res = await axiosClient.post("/auth/login", form, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });

  
  return res.data;
}
