// Tokenlar sessionStorage'da: umumiy kompyuterda tab yopilsa, keyingi bola boshqa hisobni ko'rmaydi
const STORAGE_KEYS = {
  student: "hq.studentToken",
  admin: "hq.adminToken",
};

export const SESSION_EXPIRED_EVENT = "hq:session-expired";

export function getToken(kind) {
  return sessionStorage.getItem(STORAGE_KEYS[kind]);
}

export function setToken(kind, token) {
  sessionStorage.setItem(STORAGE_KEYS[kind], token);
}

export function clearToken(kind) {
  sessionStorage.removeItem(STORAGE_KEYS[kind]);
}
