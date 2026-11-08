import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      // Sessiya tugagan bo'lsa, qayta urinish foydasiz
      retry: (failureCount, error) => error?.code !== "session_expired" && failureCount < 1,
    },
  },
});

export const queryKeys = {
  studentTests: ["student", "tests"],
  adminTests: ["admin", "tests"],
  adminQuestions: (testId) => ["admin", "questions", testId],
  adminQuestionStats: (testId) => ["admin", "question-stats", testId],
  adminResults: (testId) => ["admin", "results", testId ?? "all"],
  adminStudent: (studentId) => ["admin", "student", studentId],
};
