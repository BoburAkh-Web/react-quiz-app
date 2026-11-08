export const OPTION_LETTERS = ["A", "B", "C", "D", "E", "F"];

export function shuffle(items) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function percent(value, total) {
  return total > 0 ? Math.round((value / total) * 100) : 0;
}

export function formatClock(totalSeconds) {
  const safe = Math.max(0, Math.ceil(totalSeconds));
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(Math.floor(safe / 60))}:${pad(safe % 60)}`;
}

export function formatMinutes(totalSeconds) {
  return `${Math.max(1, Math.ceil(totalSeconds / 60))} daqiqa`;
}

export function formatDateTime(value) {
  if (!value) return "—";
  const date = new Date(value);
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()}, ${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
}

// Natija foiziga qarab rang: progress bar va badge'lar uchun
export function scoreTone(value) {
  if (value >= 80) return "success";
  if (value >= 50) return "warning";
  return "error";
}

// Tailwind faqat to'liq yozilgan klass nomlarini topadi, shuning uchun ular shu yerda
const TONE_CLASSES = {
  success: { text: "text-success", progress: "progress-success", badge: "badge-success" },
  warning: { text: "text-warning", progress: "progress-warning", badge: "badge-warning" },
  error: { text: "text-error", progress: "progress-error", badge: "badge-error" },
};

export function scoreToneClasses(value) {
  return TONE_CLASSES[scoreTone(value)];
}
