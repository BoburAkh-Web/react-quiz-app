import { createContext, useContext, useReducer, useEffect } from "react";
import { supabase } from "../components/supabase";

const AuthContext = createContext();

const initialState = {
  currentStudent: null,
  isLoading: false,
  error: "",
};

function reducer(state, action) {
  switch (action.type) {
    case "loading":
      return { ...state, isLoading: true, error: "" };

    case "success":
      return { ...state, isLoading: false, currentStudent: action.payload };

    case "error":
      return { ...state, isLoading: false, error: action.payload };

    case "logout":
      return { ...state, currentStudent: null };

    default:
      throw new Error("Unknown action type");
  }
}

// Parol qoidasi: kamida 8 ta belgi, harf va raqamdan iborat
function isPasswordValid(password) {
  return (
    password.length >= 8 && /[a-zA-Z]/.test(password) && /[0-9]/.test(password)
  );
}

function AuthProvider({ children }) {
  const [{ currentStudent, isLoading, error }, dispatch] = useReducer(
    reducer,
    initialState,
  );

  // Sahifa yangilanganda, sessionStorage'dan o'quvchini tiklash
  useEffect(() => {
    const saved = sessionStorage.getItem("currentStudent");
    if (saved) dispatch({ type: "success", payload: JSON.parse(saved) });
  }, []);

  async function register(nickname, password) {
    dispatch({ type: "loading" });

    if (!nickname.trim()) {
      dispatch({ type: "error", payload: "Nickname kiriting" });
      return false;
    }
    if (!isPasswordValid(password)) {
      dispatch({
        type: "error",
        payload:
          "Parol kamida 8 ta belgi, harf va raqamdan iborat bo'lishi kerak",
      });
      return false;
    }

    const { data, error } = await supabase
      .from("students")
      .insert([{ nickname, password }])
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        dispatch({
          type: "error",
          payload: "Bu nickname band, boshqasini tanlang",
        });
      } else {
        dispatch({
          type: "error",
          payload: "Xatolik yuz berdi, qayta urinib ko'ring",
        });
      }
      return false;
    }

    sessionStorage.setItem("currentStudent", JSON.stringify(data));
    dispatch({ type: "success", payload: data });
    return true;
  }

  async function login(nickname, password) {
    dispatch({ type: "loading" });

    const { data, error } = await supabase
      .from("students")
      .select("*")
      .eq("nickname", nickname)
      .eq("password", password)
      .single();

    if (error || !data) {
      dispatch({ type: "error", payload: "Nickname yoki parol noto'g'ri" });
      return false;
    }

    sessionStorage.setItem("currentStudent", JSON.stringify(data));
    dispatch({ type: "success", payload: data });
    return true;
  }

  function logout() {
    sessionStorage.removeItem("currentStudent");
    dispatch({ type: "logout" });
  }

  return (
    <AuthContext.Provider
      value={{ currentStudent, isLoading, error, register, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined)
    throw new Error("AuthContext was used outside of AuthProvider");
  return context;
}

export { AuthProvider, useAuth };
