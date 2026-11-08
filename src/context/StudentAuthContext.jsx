import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { studentApi } from "../lib/api";
import { queryClient } from "../lib/queryClient";
import { clearToken, getToken, SESSION_EXPIRED_EVENT, setToken } from "../lib/session";

const StudentAuthContext = createContext(null);

export function StudentAuthProvider({ children }) {
  const [student, setStudent] = useState(null);
  // Saqlangan token bo'lsa, server tasdiqlaguncha "tekshirilmoqda" holatida turamiz
  const [isChecking, setIsChecking] = useState(() => Boolean(getToken("student")));

  useEffect(() => {
    if (!getToken("student")) return;
    studentApi
      .getSession()
      .then(setStudent)
      .catch(() => clearToken("student"))
      .finally(() => setIsChecking(false));
  }, []);

  useEffect(() => {
    function handleExpired(event) {
      if (event.detail === "student") setStudent(null);
    }
    window.addEventListener(SESSION_EXPIRED_EVENT, handleExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, handleExpired);
  }, []);

  const startSession = useCallback(({ token, student: nextStudent }) => {
    setToken("student", token);
    setStudent(nextStudent);
  }, []);

  const login = useCallback(
    async (nickname, password) => startSession(await studentApi.login(nickname, password)),
    [startSession],
  );

  const register = useCallback(
    async (nickname, password) => startSession(await studentApi.register(nickname, password)),
    [startSession],
  );

  const logout = useCallback(() => {
    const token = getToken("student");
    clearToken("student");
    setStudent(null);
    queryClient.removeQueries({ queryKey: ["student"] });
    if (token) studentApi.logout(token).catch(() => {});
  }, []);

  const value = useMemo(
    () => ({ student, isChecking, login, register, logout }),
    [student, isChecking, login, register, logout],
  );

  return <StudentAuthContext.Provider value={value}>{children}</StudentAuthContext.Provider>;
}

export function useStudentAuth() {
  const context = useContext(StudentAuthContext);
  if (!context) throw new Error("useStudentAuth must be used inside StudentAuthProvider");
  return context;
}
