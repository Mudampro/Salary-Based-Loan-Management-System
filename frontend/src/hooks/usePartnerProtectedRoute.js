import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getPartnerToken } from "../utils/partnerStorage";

export default function usePartnerProtectedRoute() {
  const navigate = useNavigate();

  useEffect(() => {
    const token = getPartnerToken();
    if (!token) {
      navigate("/partner/login");
    }
  }, [navigate]);
}
