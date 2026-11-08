import { useCallback, useReducer, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { studentApi } from "../lib/api";
import { queryKeys } from "../lib/queryClient";
import { shuffle } from "../lib/utils";

export const initialQuizState = {
  status: "idle", // idle | starting | active | finishing | finished | error
  attempt: null,
  answers: {}, // questionId → { selected, isPending, isCorrect, correctOption, pointsAwarded, explanation }
  index: 0,
  result: null,
  error: null,
};

// Server javobini ilova formatiga o'tkazadi. Variantlar har bir o'quvchi uchun aralashtiriladi,
// lekin serverga variantning asl indeksi yuboriladi.
export function toAttempt(payload, receivedAt = Date.now()) {
  const clockOffset = receivedAt - Date.parse(payload.server_now);
  return {
    id: payload.attempt_id,
    title: payload.test.title,
    maxScore: payload.max_score,
    totalSeconds: (Date.parse(payload.ends_at) - Date.parse(payload.started_at)) / 1000,
    endsAt: Date.parse(payload.ends_at) + clockOffset,
    questions: payload.questions.map((question) => ({
      ...question,
      order: shuffle(question.options.map((_, index) => index)),
    })),
  };
}

export function toAnswer(result, selected) {
  return {
    selected,
    isPending: false,
    isCorrect: result.is_correct,
    correctOption: result.correct_option,
    pointsAwarded: result.points_awarded,
    explanation: result.explanation,
  };
}

export function quizReducer(state, action) {
  switch (action.type) {
    case "start_request":
      return { ...initialQuizState, status: "starting" };

    case "start_success": {
      const { attempt, answers } = action;
      const firstOpen = attempt.questions.findIndex((question) => !answers[question.id]);
      return {
        ...state,
        status: "active",
        attempt,
        answers,
        index: firstOpen === -1 ? attempt.questions.length - 1 : firstOpen,
      };
    }

    case "start_failure":
      return { ...state, status: "error", error: action.message };

    case "answer_request":
      return {
        ...state,
        answers: { ...state.answers, [action.questionId]: { selected: action.option, isPending: true } },
      };

    case "answer_success":
      return { ...state, answers: { ...state.answers, [action.questionId]: action.answer } };

    case "answer_failure": {
      const answers = { ...state.answers };
      delete answers[action.questionId];
      return { ...state, answers };
    }

    case "next":
      return { ...state, index: Math.min(state.index + 1, state.attempt.questions.length - 1) };

    case "finish_request":
      return { ...state, status: "finishing" };

    case "finish_success":
      return { ...state, status: "finished", result: action.result };

    case "finish_failure":
      return { ...state, status: "active" };

    case "reset":
      return initialQuizState;

    default:
      throw new Error(`Unknown quiz action: ${action.type}`);
  }
}

export function useQuizAttempt(testId) {
  const [state, dispatch] = useReducer(quizReducer, initialQuizState);
  const queryClient = useQueryClient();
  // Taymer tugashi va "Yakunlash" bir vaqtda kelsa, ikki marta yakunlanmasin
  const isFinishingRef = useRef(false);

  const question = state.attempt?.questions[state.index] ?? null;
  const answeredCount = Object.values(state.answers).filter((answer) => !answer.isPending).length;
  const score = Object.values(state.answers).reduce(
    (sum, answer) => sum + (answer.pointsAwarded ?? 0),
    0,
  );

  const start = useCallback(async () => {
    dispatch({ type: "start_request" });
    try {
      const payload = await studentApi.startAttempt(testId);
      const answers = Object.fromEntries(
        payload.answers.map((answer) => [answer.question_id, toAnswer(answer, answer.selected_option)]),
      );
      isFinishingRef.current = false;
      dispatch({ type: "start_success", attempt: toAttempt(payload), answers });
    } catch (error) {
      dispatch({ type: "start_failure", message: error.message });
    }
  }, [testId]);

  const finish = useCallback(async () => {
    if (!state.attempt || isFinishingRef.current) return;
    isFinishingRef.current = true;
    dispatch({ type: "finish_request" });
    try {
      const result = await studentApi.finishAttempt(state.attempt.id);
      dispatch({ type: "finish_success", result });
      queryClient.invalidateQueries({ queryKey: queryKeys.studentTests });
    } catch (error) {
      isFinishingRef.current = false;
      dispatch({ type: "finish_failure" });
      toast.error(error.message);
    }
  }, [state.attempt, queryClient]);

  const answer = useCallback(
    async (option) => {
      if (!question || state.answers[question.id]) return null;

      dispatch({ type: "answer_request", questionId: question.id, option });
      try {
        const result = await studentApi.submitAnswer(state.attempt.id, question.id, option);
        dispatch({ type: "answer_success", questionId: question.id, answer: toAnswer(result, option) });
        return result;
      } catch (error) {
        dispatch({ type: "answer_failure", questionId: question.id });
        if (error.code === "attempt_closed") finish();
        else toast.error(error.message);
        return null;
      }
    },
    [question, state.answers, state.attempt, finish],
  );

  const next = useCallback(() => dispatch({ type: "next" }), []);
  const reset = useCallback(() => dispatch({ type: "reset" }), []);

  return {
    ...state,
    question,
    currentAnswer: question ? state.answers[question.id] : undefined,
    isLastQuestion: state.attempt ? state.index === state.attempt.questions.length - 1 : false,
    answeredCount,
    score,
    start,
    answer,
    next,
    finish,
    reset,
  };
}
