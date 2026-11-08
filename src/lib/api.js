import { supabase } from "./supabase";
import { clearToken, getToken, SESSION_EXPIRED_EVENT } from "./session";

// Serverdagi xato kodlari (supabase/migrations) → foydalanuvchiga ko'rinadigan matn
const MESSAGES = {
  invalid_credentials: "Nickname yoki parol noto'g'ri",
  invalid_nickname: "Nickname 2–30 ta belgidan iborat bo'lishi kerak",
  weak_password: "Parol kamida 8 ta belgi, harf va raqamdan iborat bo'lishi kerak",
  nickname_taken: "Bu nickname band, boshqasini tanlang",
  session_expired: "Sessiya tugadi, qaytadan kiring",
  test_not_found: "Test topilmadi yoki yopilgan",
  attempt_not_found: "Urinish topilmadi",
  attempt_closed: "Test vaqti tugagan",
  already_answered: "Bu savolga allaqachon javob berilgan",
  question_not_found: "Savol topilmadi",
  invalid_option: "Noto'g'ri variant tanlandi",
  invalid_question:
    "Savolni to'liq to'ldiring: matn, kamida 2 ta har xil variant va to'g'ri javob",
  invalid_test: "Test nomi va sozlamalarini tekshiring",
  student_not_found: "O'quvchi topilmadi",
  admin_not_configured:
    "Admin paroli hali o'rnatilmagan. Supabase SQL Editor'da quiz.set_admin_password(...) ni ishga tushiring",
  admin_locked: "Juda ko'p xato urinish. 5 daqiqadan so'ng qayta urinib ko'ring",
  network: "Internet aloqasini tekshiring va qayta urinib ko'ring",
  server_not_ready:
    "Server hali sozlanmagan yoki yangilanmoqda. Birozdan so'ng qayta urinib ko'ring",
};

// PostgREST: chaqirilgan funksiya bazada yo'q (migratsiya ishga tushirilmagan)
const FUNCTION_NOT_FOUND = "PGRST202";

export class ApiError extends Error {
  constructor(code, message = MESSAGES[code]) {
    super(message ?? "Xatolik yuz berdi. Qayta urinib ko'ring");
    this.name = "ApiError";
    this.code = code;
  }
}

function toApiError(error) {
  if (error.message in MESSAGES) return new ApiError(error.message);
  if (error.code === FUNCTION_NOT_FOUND) return new ApiError("server_not_ready");
  if (/fetch|network/i.test(error.message)) return new ApiError("network");
  return new ApiError("unknown");
}

async function rpc(fn, params) {
  const { data, error } = await supabase.rpc(fn, params);
  if (error) throw toApiError(error);
  return data;
}

// Token talab qiladigan chaqiruv. Sessiya tugasa, tokenni o'chirib, ilovaga xabar beradi
async function authedRpc(kind, fn, params = {}) {
  try {
    return await rpc(fn, { p_token: getToken(kind), ...params });
  } catch (error) {
    if (error.code === "session_expired") {
      clearToken(kind);
      window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT, { detail: kind }));
    }
    throw error;
  }
}

export const studentApi = {
  register: (nickname, password) =>
    rpc("register_student", { p_nickname: nickname, p_password: password }),
  login: (nickname, password) =>
    rpc("login_student", { p_nickname: nickname, p_password: password }),
  logout: (token) => rpc("logout", { p_token: token }),
  getSession: () => authedRpc("student", "get_student_session"),
  listTests: () => authedRpc("student", "list_tests"),
  startAttempt: (testId) => authedRpc("student", "start_attempt", { p_test_id: testId }),
  submitAnswer: (attemptId, questionId, option) =>
    authedRpc("student", "submit_answer", {
      p_attempt_id: attemptId,
      p_question_id: questionId,
      p_option: option,
    }),
  finishAttempt: (attemptId) =>
    authedRpc("student", "finish_attempt", { p_attempt_id: attemptId }),
};

const GENERATE_URL = "/.netlify/functions/generate-questions";

export const adminApi = {
  async login(password) {
    // Xato parolda server exception emas, { error } qaytaradi (urinishlar hisobi saqlanishi uchun)
    const result = await rpc("admin_login", { p_password: password });
    if (result.error) throw new ApiError(result.error);
    return result.token;
  },
  verify: (token) => rpc("verify_admin", { p_token: token }),
  logout: (token) => rpc("logout", { p_token: token }),
  listTests: () => authedRpc("admin", "admin_list_tests"),
  saveTest: (test) => authedRpc("admin", "admin_save_test", { p_test: test }),
  deleteTest: (testId) => authedRpc("admin", "admin_delete_test", { p_test_id: testId }),
  listQuestions: (testId) =>
    authedRpc("admin", "admin_list_questions", { p_test_id: testId }),
  saveQuestion: (question) =>
    authedRpc("admin", "admin_save_question", { p_question: question }),
  addQuestions: (testId, questions) =>
    authedRpc("admin", "admin_add_questions", { p_test_id: testId, p_questions: questions }),
  deleteQuestion: (questionId) =>
    authedRpc("admin", "admin_delete_question", { p_question_id: questionId }),
  questionStats: (testId) =>
    authedRpc("admin", "admin_question_stats", { p_test_id: testId }),
  results: (testId = null) => authedRpc("admin", "admin_results", { p_test_id: testId }),
  studentAttempts: (studentId) =>
    authedRpc("admin", "admin_student_attempts", { p_student_id: studentId }),
  resetStudentPassword: (studentId, password) =>
    authedRpc("admin", "admin_reset_student_password", {
      p_student_id: studentId,
      p_password: password,
    }),
  deleteStudent: (studentId) =>
    authedRpc("admin", "admin_delete_student", { p_student_id: studentId }),

  async generateQuestions(payload) {
    let response;
    try {
      response = await fetch(GENERATE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, adminToken: getToken("admin") }),
      });
    } catch {
      throw new ApiError("network");
    }

    const data = await response.json().catch(() => null);
    if (!data) {
      // `npm run dev` da Netlify Function ishlamaydi
      throw new ApiError(
        "ai_unavailable",
        "AI servisi topilmadi. Lokal ishlatish uchun `npm run dev:netlify` ni ishga tushiring",
      );
    }
    if (!response.ok) throw new ApiError("ai_error", data.error ?? "AI xatosi");
    return data.questions;
  },
};
