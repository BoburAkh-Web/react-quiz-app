import { useEffect, useState } from "react";
import { supabase } from "./supabase";

const API_URL = "/.netlify/functions/generate-questions";
const BATCH_SIZE = 5; // Har bir AI so'rovida nechta savol (server vaqt limitiga sig'ishi uchun)

const LETTERS = ["A", "B", "C", "D"];
const COUNT_PRESETS = [5, 10, 15, 20];
const DIFFICULTIES = [
  { value: "easy", label: "Oson" },
  { value: "medium", label: "O'rta" },
  { value: "hard", label: "Qiyin" },
  { value: "mixed", label: "Aralash" },
];
const LANGUAGES = [
  { value: "uz", label: "O'zbek" },
  { value: "ru", label: "Русский" },
  { value: "en", label: "English" },
];
const DIFFICULTY_LABEL = { easy: "Oson", medium: "O'rta", hard: "Qiyin" };
const DIFFICULTY_POINTS = { easy: 5, medium: 10, hard: 15 };
const TOPIC_EXAMPLES = [
  "JavaScript massiv metodlari",
  "React hooks",
  "CSS Flexbox va Grid",
  "Async/await va Promise",
];

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// To'g'ri javob o'rinlari: A/B/C/D teng taqsimlanadi va
// ketma-ket ikki savolda bir xil harf bo'lmaydi (masalan: C, A, D, B, A, C...)
function balancedPositions(n) {
  const result = [];
  while (result.length < n) {
    const block = shuffle([0, 1, 2, 3]);
    if (block[0] === result[result.length - 1])
      [block[0], block[3]] = [block[3], block[0]];
    result.push(...block);
  }
  return result.slice(0, n);
}

// AI'dan kelgan {correctAnswer, wrongAnswers} ni bazadagi formatga o'tkazish
function toQuizQuestions(rawQuestions) {
  const positions = balancedPositions(rawQuestions.length);

  return rawQuestions.map((q, i) => {
    const options = shuffle(q.wrongAnswers);
    options.splice(positions[i], 0, q.correctAnswer);
    return {
      id: crypto.randomUUID(),
      question: q.question,
      options,
      correctOption: positions[i],
      difficulty: q.difficulty,
      points: DIFFICULTY_POINTS[q.difficulty] ?? 10,
    };
  });
}

async function requestBatch(payload) {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  let data;
  try {
    data = await res.json();
  } catch {
    // `npm start` da Netlify Function ishlamaydi
    throw new Error(
      "AI servisi topilmadi. Lokal ishlatish uchun loyihani `npm run dev:netlify` bilan ishga tushiring.",
    );
  }
  if (!res.ok) throw new Error(data.error || "AI xatosi");
  return data.questions;
}

function AIGenerator({ onQuestionsAdded }) {
  const [topic, setTopic] = useState("");
  const [count, setCount] = useState(10);
  const [difficulty, setDifficulty] = useState("medium");
  const [language, setLanguage] = useState("uz");
  const [notes, setNotes] = useState("");

  const [generated, setGenerated] = useState([]);
  const [progress, setProgress] = useState(null); // { done, total } yaratish davomida
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState(null); // { type: "success" | "error", text }

  const isGenerating = progress !== null;

  useEffect(() => {
    if (message?.type !== "success") return;
    const id = setTimeout(() => setMessage(null), 4000);
    return () => clearTimeout(id);
  }, [message]);

  async function handleGenerate(e) {
    e.preventDefault();
    if (!topic.trim()) {
      setMessage({ type: "error", text: "Mavzuni kiriting" });
      return;
    }

    setMessage(null);
    setGenerated([]);
    setProgress({ done: 0, total: count });

    const collected = [];
    try {
      while (collected.length < count) {
        const batch = await requestBatch({
          topic,
          count: Math.min(BATCH_SIZE, count - collected.length),
          difficulty,
          language,
          notes,
          avoid: collected.map((q) => q.question),
        });
        collected.push(...batch);
        setProgress({ done: Math.min(collected.length, count), total: count });
      }
    } catch (err) {
      setMessage({
        type: "error",
        text:
          collected.length > 0
            ? `${err.message} (${collected.length} ta savol tayyor bo'ldi)`
            : err.message,
      });
    }

    setGenerated(toQuizQuestions(collected.slice(0, count)));
    setProgress(null);
  }

  function setCorrect(id, optionIndex) {
    setGenerated((qs) =>
      qs.map((q) => (q.id === id ? { ...q, correctOption: optionIndex } : q)),
    );
  }

  function removeQuestion(id) {
    setGenerated((qs) => qs.filter((q) => q.id !== id));
  }

  async function handleSave() {
    setIsSaving(true);

    const rows = generated.map(({ question, options, correctOption, points }) => ({
      question,
      options,
      correctOption,
      points,
    }));
    const { error } = await supabase.from("questions").insert(rows);

    setIsSaving(false);

    if (error) {
      setMessage({ type: "error", text: "Saqlashda xatolik: " + error.message });
      return;
    }

    setMessage({
      type: "success",
      text: `${rows.length} ta savol bazaga qo'shildi! 🎉`,
    });
    setGenerated([]);
    if (onQuestionsAdded) onQuestionsAdded();
  }

  const letterStats = LETTERS.map(
    (letter, i) =>
      `${letter}: ${generated.filter((q) => q.correctOption === i).length}`,
  ).join(" · ");

  return (
    <div className="add-question">
      <form className="aq-card ai-card" onSubmit={handleGenerate}>
        <div>
          <h2 className="aq-title">✨ AI bilan savol yaratish</h2>
          <p className="ai-subtitle">
            Mavzuni yozing — AI savollar, variantlar va to'g'ri javoblarni o'zi
            tayyorlaydi. Saqlashdan oldin tekshirib chiqasiz.
          </p>
        </div>

        <div className="aq-field">
          <label className="aq-label" htmlFor="ai-topic">
            Mavzu
          </label>
          <input
            id="ai-topic"
            className="aq-input"
            placeholder="Masalan: JavaScript'da closure va scope"
            value={topic}
            maxLength={200}
            onChange={(e) => setTopic(e.target.value)}
            disabled={isGenerating}
          />
          <div className="ai-examples">
            {TOPIC_EXAMPLES.map((example) => (
              <button
                key={example}
                type="button"
                className="ai-example"
                onClick={() => setTopic(example)}
                disabled={isGenerating}
              >
                {example}
              </button>
            ))}
          </div>
        </div>

        <div className="aq-field">
          <span className="aq-label">Savollar soni</span>
          <div className="aq-points">
            {COUNT_PRESETS.map((n) => (
              <button
                key={n}
                type="button"
                className={`aq-chip ${count === n ? "active" : ""}`}
                onClick={() => setCount(n)}
                disabled={isGenerating}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        <div className="aq-field">
          <span className="aq-label">Qiyinlik darajasi</span>
          <div className="aq-points">
            {DIFFICULTIES.map((d) => (
              <button
                key={d.value}
                type="button"
                className={`aq-chip ${difficulty === d.value ? "active" : ""}`}
                onClick={() => setDifficulty(d.value)}
                disabled={isGenerating}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        <div className="aq-field">
          <span className="aq-label">Til</span>
          <div className="aq-points">
            {LANGUAGES.map((l) => (
              <button
                key={l.value}
                type="button"
                className={`aq-chip ${language === l.value ? "active" : ""}`}
                onClick={() => setLanguage(l.value)}
                disabled={isGenerating}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>

        <div className="aq-field">
          <label className="aq-label" htmlFor="ai-notes">
            Qo'shimcha ko'rsatma
            <span className="aq-hint">ixtiyoriy</span>
          </label>
          <textarea
            id="ai-notes"
            className="aq-input aq-textarea ai-notes"
            rows={2}
            maxLength={500}
            placeholder="Masalan: ko'proq kod misollari bilan, ES6 sintaksisiga e'tibor bering"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={isGenerating}
          />
        </div>

        {isGenerating && (
          <div className="ai-progress" role="status">
            <div className="ai-progress-head">
              <span>AI savollar tuzmoqda...</span>
              <span>
                {progress.done}/{progress.total}
              </span>
            </div>
            <div className="ai-progress-track">
              <div
                className="ai-progress-bar"
                style={{
                  width: `${Math.max(6, (progress.done / progress.total) * 100)}%`,
                }}
              />
            </div>
          </div>
        )}

        {message && (
          <p className={`aq-message ${message.type}`}>{message.text}</p>
        )}

        <button
          type="submit"
          className="aq-submit ai-submit"
          disabled={isGenerating || isSaving}
        >
          {isGenerating ? (
            <>
              <span className="ai-spinner" /> Yaratilmoqda...
            </>
          ) : generated.length > 0 ? (
            "🔄 Qaytadan yaratish"
          ) : (
            `✨ ${count} ta savol yaratish`
          )}
        </button>
      </form>

      {generated.length > 0 && (
        <div className="aq-card ai-preview">
          <div className="ai-preview-head">
            <div>
              <h3 className="ai-preview-title">
                {generated.length} ta savol tayyor
              </h3>
              <p className="ai-preview-stats">To'g'ri javoblar: {letterStats}</p>
            </div>
            <p className="aq-hint">
              Noto'g'ri bo'lsa, to'g'ri variantni bosib almashtiring
            </p>
          </div>

          <ol className="ai-list">
            {generated.map((q, i) => (
              <li key={q.id} className="ai-q">
                <div className="ai-q-head">
                  <span className="ai-q-num">{i + 1}</span>
                  <span className={`ai-badge ai-badge--${q.difficulty}`}>
                    {DIFFICULTY_LABEL[q.difficulty]}
                  </span>
                  <span className="ai-q-points">{q.points} ball</span>
                  <button
                    type="button"
                    className="ai-q-remove"
                    onClick={() => removeQuestion(q.id)}
                    aria-label="Savolni olib tashlash"
                    title="Savolni olib tashlash"
                  >
                    ✕
                  </button>
                </div>

                <p className="ai-q-text">{q.question}</p>

                <div className="ai-q-options">
                  {q.options.map((opt, j) => (
                    <button
                      key={j}
                      type="button"
                      className={`ai-q-option ${q.correctOption === j ? "correct" : ""}`}
                      onClick={() => setCorrect(q.id, j)}
                      aria-pressed={q.correctOption === j}
                    >
                      <span className="ai-q-letter">
                        {q.correctOption === j ? "✓" : LETTERS[j]}
                      </span>
                      <span>{opt}</span>
                    </button>
                  ))}
                </div>
              </li>
            ))}
          </ol>

          <div className="ai-actions">
            <button
              type="button"
              className="ai-cancel"
              onClick={() => setGenerated([])}
              disabled={isSaving}
            >
              Bekor qilish
            </button>
            <button
              type="button"
              className="aq-submit ai-save"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving
                ? "Saqlanmoqda..."
                : `💾 ${generated.length} ta savolni bazaga saqlash`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default AIGenerator;
