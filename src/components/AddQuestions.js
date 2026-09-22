import React, { useState } from "react";
import { supabase } from "./supabase";
function AddQuestions({ onQuestionAdded }) {
  const [question, setQuestion] = useState("");
  const [option1, setOption1] = useState("");
  const [option2, setOption2] = useState("");
  const [option3, setOption3] = useState("");
  const [option4, setOption4] = useState("");
  const [correctOption, setCorrectOption] = useState(0);
  const [points, setPoints] = useState(10);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();

    if (!question || !option1 || !option2 || !option3 || !option4) {
      alert("Iltimos, barcha maydonlarni to'ldiring!");
      return;
    }

    setLoading(true);

    const newQuestion = {
      question,
      options: [option1, option2, option3, option4],
      correctOption: Number(correctOption),
      points: Number(points),
    };

    const { error } = await supabase.from("questions").insert([newQuestion]);

    setLoading(false);

    if (error) {
      alert("Xatolik: " + error.message);
      return;
    }

    alert("Yangi savol muvaffaqiyatli qo'shildi! 🎉");
    setQuestion("");
    setOption1("");
    setOption2("");
    setOption3("");
    setOption4("");
    setCorrectOption(0);
    setPoints(10);

    if (onQuestionAdded) onQuestionAdded();
  }
  return (
    <div
      className="add-question-container"
      style={{ margin: "20px 0", textAlign: "left" }}
    >
      <h2>➕ Yangi Savol Qo'shish (Admin Panel)</h2>
      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", flexDirection: "column", gap: "10px" }}
      >
        <label>
          Savol matni:
          <input
            type="text"
            className="btn"
            style={{ width: "100%", textTransform: "none" }}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
          />
        </label>

        <label>Variant 1 (Indeks 0):</label>
        <input
          type="text"
          className="btn"
          style={{ textTransform: "none" }}
          value={option1}
          onChange={(e) => setOption1(e.target.value)}
        />

        <label>Variant 2 (Indeks 1):</label>
        <input
          type="text"
          className="btn"
          style={{ textTransform: "none" }}
          value={option2}
          onChange={(e) => setOption2(e.target.value)}
        />

        <label>Variant 3 (Indeks 2):</label>
        <input
          type="text"
          className="btn"
          style={{ textTransform: "none" }}
          value={option3}
          onChange={(e) => setOption3(e.target.value)}
        />

        <label>Variant 4 (Indeks 3):</label>
        <input
          type="text"
          className="btn"
          style={{ textTransform: "none" }}
          value={option4}
          onChange={(e) => setOption4(e.target.value)}
        />

        <label>
          To'g'ri variant indeksi (0, 1, 2 yoki 3):
          <select
            className="btn"
            value={correctOption}
            onChange={(e) => setCorrectOption(e.target.value)}
          >
            <option value={0}>Variant 1 (Indeks 0)</option>
            <option value={1}>Variant 2 (Indeks 1)</option>
            <option value={2}>Variant 3 (Indeks 2)</option>
            <option value={3}>Variant 4 (Indeks 3)</option>
          </select>
        </label>

        <label>
          Balla (Points):
          <input
            type="number"
            className="btn"
            value={points}
            onChange={(e) => setPoints(e.target.value)}
          />
        </label>

        <button type="submit" className="btn btn-ui" disabled={loading}>
          {loading ? "Saqlanmoqda..." : "Savolni Bazaga Qo'shish"}
        </button>
      </form>
    </div>
  );
}

export default AddQuestions;
