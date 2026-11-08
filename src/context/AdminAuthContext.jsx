import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { adminApi } from "../lib/api";
import { queryClient } from "../lib/queryClient";
import { clearToken, getToken, SESSION_EXPIRED_EVENT, setToken } from "../lib/session";

const AdminAuthContext = createContext(null);

export function AdminAuthProvider({ children }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isChecking, setIsChecking] = useState(() => Boolean(getToken("admin")));

  useEffect(() => {
    const token = getToken("admin");
    if (!token) return;
    adminApi
      .verify(token)
      .then((isValid) => {
        if (isValid) setIsAdmin(true);
        else clearToken("admin");
      })
      .catch(() => clearToken("admin"))
      .finally(() => setIsChecking(false));
  }, []);

  useEffect(() => {
    function handleExpired(event) {
      if (event.detail === "admin") setIsAdmin(false);
    }
    window.addEventListener(SESSION_EXPIRED_EVENT, handleExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, handleExpired);
  }, []);

  const login = useCallback(async (password) => {
    setToken("admin", await adminApi.login(password));
    setIsAdmin(true);
  }, []);

  const logout = useCallback(() => {
    const token = getToken("admin");
    clearToken("admin");
    setIsAdmin(false);
    queryClient.removeQueries({ queryKey: ["admin"] });
    if (token) adminApi.logout(token).catch(() => {});
  }, []);

  const value = useMemo(
    () => ({ isAdmin, isChecking, login, logout }),
    [isAdmin, isChecking, login, logout],
  );

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) throw new Error("useAdminAuth must be used inside AdminAuthProvider");
  return context;
}
