import { describe, expect, it } from "vitest";
import { initialQuizState, quizReducer, toAnswer, toAttempt } from "./useQuizAttempt";

const payload = {
  attempt_id: "a1",
  test: { id: "t1", title: "Massivlar" },
  started_at: "2026-01-01T10:00:00.000Z",
  ends_at: "2026-01-01T10:01:00.000Z",
  server_now: "2026-01-01T10:00:00.000Z",
  max_score: 30,
  questions: [
    { id: "q1", question: "1?", options: ["a", "b", "c", "d"], points: 10 },
    { id: "q2", question: "2?", options: ["a", "b"], points: 20 },
  ],
  answers: [],
};

describe("toAttempt", () => {
  it("server soati farqini hisobga oladi va variantlarni aralashtiradi", () => {
    // Mahalliy soat serverdan 5 soniya oldinda
    const receivedAt = Date.parse("2026-01-01T10:00:05.000Z");
    const attempt = toAttempt(payload, receivedAt);

    expect(attempt.totalSeconds).toBe(60);
    expect(attempt.endsAt).toBe(Date.parse("2026-01-01T10:01:05.000Z"));
    expect([...attempt.questions[0].order].sort()).toEqual([0, 1, 2, 3]);
    expect([...attempt.questions[1].order].sort()).toEqual([0, 1]);
  });
});

describe("quizReducer", () => {
  const attempt = toAttempt(payload);

  it("davom ettirilganda birinchi javobsiz savoldan boshlaydi", () => {
    const answers = { q1: toAnswer({ is_correct: true, correct_option: 1, points_awarded: 10 }, 1) };
    const state = quizReducer(initialQuizState, { type: "start_success", attempt, answers });
    expect(state.status).toBe("active");
    expect(state.index).toBe(1);
  });

  it("javob xatosida tanlov bekor qilinadi", () => {
    let state = quizReducer(initialQuizState, { type: "start_success", attempt, answers: {} });
    state = quizReducer(state, { type: "answer_request", questionId: "q1", option: 2 });
    expect(state.answers.q1).toEqual({ selected: 2, isPending: true });
    state = quizReducer(state, { type: "answer_failure", questionId: "q1" });
    expect(state.answers.q1).toBeUndefined();
  });

  it("next oxirgi savoldan o'tib ketmaydi", () => {
    let state = quizReducer(initialQuizState, { type: "start_success", attempt, answers: {} });
    state = quizReducer(state, { type: "next" });
    state = quizReducer(state, { type: "next" });
    expect(state.index).toBe(1);
  });

  it("yakunlash xatosida test davom etadi", () => {
    let state = quizReducer(initialQuizState, { type: "start_success", attempt, answers: {} });
    state = quizReducer(state, { type: "finish_request" });
    expect(state.status).toBe("finishing");
    state = quizReducer(state, { type: "finish_failure" });
    expect(state.status).toBe("active");
  });
});
