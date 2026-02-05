// frontend/src/hooks/useProtectedRoute.js
import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import useAuth from "./useAuth";

export default function useProtectedRoute() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname || "";

    
    const isPublic =
      path.startsWith("/apply/") ||
      path === "/login" ||
      path === "/forgot-password" ||
      path === "/reset-password";

    if (!token && !isPublic) {
      navigate("/login", { replace: true });
    }
  }, [token, navigate, location.pathname]);
}
