// frontend/src/context/AuthContext.jsx
import React, { createContext, useEffect, useState } from "react";
import {
  setToken,
  getToken,
  clearAuth,
  setUser,
  getUser,
} from "../utils/storage";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setTokenState] = useState(getToken());
  const [user, setUserState] = useState(getUser());

  // keep localStorage in sync
  useEffect(() => {
    if (token) {
      setToken(token);
    } else {
      clearAuth();
    }
  }, [token]);

  useEffect(() => {
    if (user) {
      setUser(user);
    }
  }, [user]);

  const login = (accessToken, userData) => {
    setTokenState(accessToken);
    setUserState(userData);
  };

  const logout = () => {
    clearAuth();
    setTokenState(null);
    setUserState(null);
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        isAuthenticated: !!token,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
