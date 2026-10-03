import React, { useEffect, useRef, useState } from "react";
import { supabase } from "./supabase";

const LETTERS = ["A", "B", "C", "D"];
const POINT_PRESETS = [5, 10, 15, 20];
const EMPTY_OPTIONS = ["", "", "", ""];

function AddQuestions({ onQuestionAdded }) {
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(EMPTY_OPTIONS);
  const [correctOption, setCorrectOption] = useState(0);
  const [points, setPoints] = useState(10);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null); // { type: "success" | "error", text }

  const questionRef = useRef(null);
  const optionRefs = useRef([]);

  // Muvaffaqiyat xabari bir necha soniyadan keyin yo'qoladi
  useEffect(() => {
    if (message?.type !== "success") return;
    const id = setTimeout(() => setMessage(null), 3000);
    return () => clearTimeout(id);
  }, [message]);

  function handleOptionChange(i, value) {
    setOptions((opts) => opts.map((opt, j) => (j === i ? value : opt)));
    setMessage(null);
  }

  // Variantda Enter bosilsa keyingi variantga o'tish (oxirgisida forma yuboriladi)
  function handleOptionKeyDown(e, i) {
    if (e.key !== "Enter" || i === options.length - 1) return;
    e.preventDefault();
    optionRefs.current[i + 1]?.focus();
  }

  function validate() {
    if (!question.trim()) return "Savol matnini kiriting";
    if (options.some((opt) => !opt.trim()))
      return "Barcha 4 ta variantni to'ldiring";
    const normalized = options.map((opt) => opt.trim().toLowerCase());
    if (new Set(normalized).size !== normalized.length)
      return "Variantlar bir-biridan farq qilishi kerak";
    if (!(Number(points) > 0)) return "Ball 0 dan katta bo'lishi kerak";
    return null;
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const validationError = validate();
    if (validationError) {
      setMessage({ type: "error", text: validationError });
      return;
    }

    setLoading(true);

    const newQuestion = {
      question: question.trim(),
      options: options.map((opt) => opt.trim()),
      correctOption: Number(correctOption),
      points: Number(points),
    };

    const { error } = await supabase.from("questions").insert([newQuestion]);

    setLoading(false);

    if (error) {
      setMessage({ type: "error", text: "Xatolik: " + error.message });
      return;
    }

    setMessage({ type: "success", text: "Savol muvaffaqiyatli qo'shildi! 🎉" });
    setQuestion("");
    setOptions(EMPTY_OPTIONS);
    setCorrectOption(0);
    setPoints(10);
    questionRef.current?.focus();

    if (onQuestionAdded) onQuestionAdded();
  }

  async function handleClearAll() {
    const confirmClear = window.confirm(
      "Diqqat! Barcha savollar butunlay o'chiriladi va qaytarib bo'lmaydi. Davom etasizmi?",
    );
    if (!confirmClear) return;

    const { error } = await supabase.from("questions").delete().neq("id", 0);

    if (error) {
      setMessage({
        type: "error",
        text: "O'chirishda xatolik: " + error.message,
      });
      return;
    }

    setMessage({ type: "success", text: "Barcha savollar o'chirildi! 🗑️" });
    if (onQuestionAdded) onQuestionAdded();
  }

  return (
    <div className="add-question">
      <form className="aq-card" onSubmit={handleSubmit}>
        <h2 className="aq-title">Yangi savol qo'shish</h2>

        <div className="aq-field">
          <label className="aq-label" htmlFor="aq-question">
            Savol matni
          </label>
          <textarea
            id="aq-question"
            ref={questionRef}
            className="aq-input aq-textarea"
            rows={3}
            placeholder="Masalan: JavaScript'da qaysi kalit so'z o'zgarmas o'zgaruvchi e'lon qiladi?"
            value={question}
            onChange={(e) => {
              setQuestion(e.target.value);
              setMessage(null);
            }}
          />
        </div>

        <div className="aq-field">
          <span className="aq-label">
            Variantlar
            <span className="aq-hint">
              To'g'ri javobni chapdagi harfni bosib belgilang
            </span>
          </span>

          <div className="aq-options">
            {options.map((opt, i) => (
              <div
                key={LETTERS[i]}
                className={`aq-option ${correctOption === i ? "correct" : ""}`}
              >
                <button
                  type="button"
                  className="aq-letter"
                  title="To'g'ri javob sifatida belgilash"
                  aria-pressed={correctOption === i}
                  onClick={() => setCorrectOption(i)}
                >
                  {correctOption === i ? "✓" : LETTERS[i]}
                </button>
                <input
                  ref={(el) => (optionRefs.current[i] = el)}
                  className="aq-option-input"
                  type="text"
                  placeholder={`${LETTERS[i]} variant`}
                  value={opt}
                  onChange={(e) => handleOptionChange(i, e.target.value)}
                  onKeyDown={(e) => handleOptionKeyDown(e, i)}
                />
                {correctOption === i && (
                  <span className="aq-correct-tag">To'g'ri</span>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="aq-field">
          <span className="aq-label">Ball</span>
          <div className="aq-points">
            {POINT_PRESETS.map((p) => (
              <button
                key={p}
                type="button"
                className={`aq-chip ${Number(points) === p ? "active" : ""}`}
                onClick={() => setPoints(p)}
              >
                {p}
              </button>
            ))}
            <input
              className="aq-input aq-points-input"
              type="number"
              min={1}
              value={points}
              onChange={(e) => setPoints(e.target.value)}
              aria-label="Boshqa ball"
            />
          </div>
        </div>

        {message && (
          <p className={`aq-message ${message.type}`}>{message.text}</p>
        )}

        <button type="submit" className="aq-submit" disabled={loading}>
          {loading ? "Saqlanmoqda..." : "➕ Savolni qo'shish"}
        </button>
      </form>

      <div className="aq-danger">
        <div>
          <strong>Xavfli zona</strong>
          <p>Bazadagi barcha savollar butunlay o'chiriladi.</p>
        </div>
        <button type="button" className="aq-danger-btn" onClick={handleClearAll}>
          🗑️ Hammasini o'chirish
        </button>
      </div>
    </div>
  );
}

export default AddQuestions;
