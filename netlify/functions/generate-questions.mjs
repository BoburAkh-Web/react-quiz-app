// Netlify Function: Gemini yordamida test savollarini yaratadi.
// API kalit faqat serverda turadi (Netlify env: GEMINI_API_KEY) va brauzerga chiqmaydi.
// Faqat haqiqiy admin sessiyasi bilan ishlaydi, aks holda begonalar bepul limitni sarflab qo'yadi.
// Manzil: POST /.netlify/functions/generate-questions

import { SUPABASE_ANON_KEY, SUPABASE_URL } from "../../src/lib/supabaseConfig.js";

const MODEL = process.env.GEMINI_MODEL || "gemini-flash-lite-latest";
const MAX_PER_REQUEST = 10;
// Netlify funksiyani 30 soniyada to'xtatadi, undan oldin tushunarli xato qaytaramiz
const GEMINI_TIMEOUT_MS = 25000;

const DIFFICULTY_TEXT = {
  easy: "easy (beginner level, core concepts and definitions)",
  medium: "medium (requires practical understanding)",
  hard: "hard (deep knowledge, edge cases, tricky but fair distractors)",
  mixed: "a roughly even mix of easy, medium and hard",
};

const LANGUAGE_TEXT = {
  uz: "Uzbek (Latin script)",
  ru: "Russian",
  en: "English",
};

// AI to'g'ri javob o'rnini tanlamaydi: faqat to'g'ri va 3 ta noto'g'ri javob qaytaradi.
// Variantlarni frontend aralashtiradi.
const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    questions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          question: { type: "string" },
          correctAnswer: { type: "string" },
          wrongAnswers: {
            type: "array",
            items: { type: "string" },
            minItems: 3,
            maxItems: 3,
          },
          difficulty: { type: "string", enum: ["easy", "medium", "hard"] },
          explanation: { type: "string" },
        },
        required: ["question", "correctAnswer", "wrongAnswers", "difficulty", "explanation"],
      },
    },
  },
  required: ["questions"],
};

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function buildPrompt({ topic, count, difficulty, language, notes, avoid }) {
  return [
    `You are an expert teacher writing multiple-choice quiz questions.`,
    `Topic: ${topic}`,
    `Number of questions: exactly ${count}`,
    `Difficulty: ${DIFFICULTY_TEXT[difficulty]}`,
    `Language of questions and answers: ${LANGUAGE_TEXT[language]}`,
    notes && `Additional instructions from the teacher: ${notes}`,
    ``,
    `Rules:`,
    `- Each question has exactly ONE correct answer and exactly 3 wrong answers.`,
    `- Wrong answers must be plausible, clearly incorrect, and different from each other and from the correct answer.`,
    `- Keep answers short (preferably under 80 characters) and similar in length and style, so the correct one does not stand out.`,
    `- Do not use "all of the above" / "none of the above" style answers.`,
    `- Do not put letters or numbering (A, B, 1.) in front of answers.`,
    `- Code snippets are allowed inline using backticks.`,
    `- Facts must be accurate; double-check the correct answer.`,
    `- "explanation": 1–2 short, simple sentences in the same language explaining why the correct answer is right.`,
    avoid.length > 0 &&
      `- Do NOT repeat or rephrase these already generated questions:\n${avoid
        .map((q) => `  * ${q}`)
        .join("\n")}`,
  ]
    .filter(Boolean)
    .join("\n");
}

async function isAdminSession(token) {
  if (typeof token !== "string" || !token) return false;
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/verify_admin`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: SUPABASE_ANON_KEY },
      body: JSON.stringify({ p_token: token }),
      signal: AbortSignal.timeout(5000),
    });
    return res.ok && (await res.json()) === true;
  } catch (err) {
    console.error("Admin session check failed", err);
    return false;
  }
}

function clean(text) {
  return String(text ?? "").trim();
}

// AI javobini tekshirish: buzuq yoki takroriy variantli savollarni tashlab yuboramiz
function sanitize(rawQuestions) {
  if (!Array.isArray(rawQuestions)) return [];

  return rawQuestions
    .map((q) => ({
      question: clean(q?.question),
      correctAnswer: clean(q?.correctAnswer),
      wrongAnswers: Array.isArray(q?.wrongAnswers)
        ? q.wrongAnswers.map(clean).filter(Boolean).slice(0, 3)
        : [],
      difficulty: ["easy", "medium", "hard"].includes(q?.difficulty)
        ? q.difficulty
        : "medium",
      explanation: clean(q?.explanation).slice(0, 400),
    }))
    .filter((q) => {
      if (!q.question || !q.correctAnswer || q.wrongAnswers.length !== 3)
        return false;
      const all = [q.correctAnswer, ...q.wrongAnswers].map((a) => a.toLowerCase());
      return new Set(all).size === 4;
    });
}

export default async (req) => {
  if (req.method !== "POST") return json({ error: "Faqat POST so'rov" }, 405);

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey)
    return json({ error: "Serverda GEMINI_API_KEY sozlanmagan" }, 500);

  let body;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Noto'g'ri so'rov" }, 400);
  }

  if (!(await isAdminSession(body.adminToken)))
    return json({ error: "Admin sessiyasi tugagan, qaytadan kiring" }, 401);

  const topic = clean(body.topic).slice(0, 200);
  const count = Math.min(
    Math.max(parseInt(body.count, 10) || 0, 1),
    MAX_PER_REQUEST,
  );
  const difficulty = DIFFICULTY_TEXT[body.difficulty] ? body.difficulty : "medium";
  const language = LANGUAGE_TEXT[body.language] ? body.language : "uz";
  const notes = clean(body.notes).slice(0, 500);
  const avoid = Array.isArray(body.avoid)
    ? body.avoid.map(clean).filter(Boolean).slice(0, 40)
    : [];

  if (!topic) return json({ error: "Mavzuni kiriting" }, 400);

  let res;
  try {
    res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        signal: AbortSignal.timeout(GEMINI_TIMEOUT_MS),
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                { text: buildPrompt({ topic, count, difficulty, language, notes, avoid }) },
              ],
            },
          ],
          generationConfig: {
            responseMimeType: "application/json",
            responseJsonSchema: RESPONSE_SCHEMA,
            temperature: 0.9,
          },
        }),
      },
    );
  } catch (err) {
    console.error("Gemini fetch failed", err);
    if (err.name === "TimeoutError")
      return json({ error: "AI javob berishga ulgurmadi, qayta urinib ko'ring" }, 504);
    return json({ error: "AI serveriga ulanib bo'lmadi" }, 502);
  }

  if (!res.ok) {
    console.error("Gemini error", res.status, await res.text());
    if (res.status === 429)
      return json(
        { error: "AI limiti tugadi (bepul tarif). Birozdan so'ng qayta urinib ko'ring." },
        429,
      );
    return json({ error: `AI xatosi (${res.status})` }, 502);
  }

  const data = await res.json();
  const text = (data.candidates?.[0]?.content?.parts ?? [])
    .map((part) => part.text ?? "")
    .join("");

  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    console.error("Gemini returned non-JSON", text);
    return json({ error: "AI javobini o'qib bo'lmadi, qayta urinib ko'ring" }, 502);
  }

  const questions = sanitize(parsed.questions).slice(0, count);
  if (questions.length === 0)
    return json({ error: "AI yaroqli savol qaytarmadi, qayta urinib ko'ring" }, 502);

  return json({ questions });
};
