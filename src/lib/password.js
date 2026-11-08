// Serverdagi quiz.is_valid_password bilan bir xil qoidalar
export const PASSWORD_RULES = [
  { label: "Kamida 8 ta belgi", test: (value) => value.length >= 8 },
  { label: "Harf", test: (value) => /[a-zA-Z]/.test(value) },
  { label: "Raqam", test: (value) => /[0-9]/.test(value) },
];

export function isValidPassword(value) {
  return value.length <= 72 && PASSWORD_RULES.every((rule) => rule.test(value));
}
