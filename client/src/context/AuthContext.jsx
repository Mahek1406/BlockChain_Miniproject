import { createContext, useContext, useMemo, useState } from "react";
import api from "../services/api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => {
    const token = localStorage.getItem("insurance_token");
    const user = JSON.parse(localStorage.getItem("insurance_user") || "null");
    return token && user ? { token, user } : null;
  });

  const value = useMemo(
    () => ({
      session,
      async login(credentials) {
        const { data } = await api.post("/auth/login", credentials);
        localStorage.setItem("insurance_token", data.token);
        localStorage.setItem("insurance_user", JSON.stringify(data.user));
        setSession({ token: data.token, user: data.user });
      },
      async register(details) {
        const { data } = await api.post("/auth/register", details);
        localStorage.setItem("insurance_token", data.token);
        localStorage.setItem("insurance_user", JSON.stringify(data.user));
        setSession({ token: data.token, user: data.user });
      },
      logout() {
        localStorage.removeItem("insurance_token");
        localStorage.removeItem("insurance_user");
        setSession(null);
      }
    }),
    [session]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
