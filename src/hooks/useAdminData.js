import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "../lib/api";
import { queryKeys } from "../lib/queryClient";

export function useAdminTests() {
  return useQuery({ queryKey: queryKeys.adminTests, queryFn: adminApi.listTests });
}

export function useAdminQuestions(testId) {
  return useQuery({
    queryKey: queryKeys.adminQuestions(testId),
    queryFn: () => adminApi.listQuestions(testId),
  });
}

export function useQuestionStats(testId) {
  return useQuery({
    queryKey: queryKeys.adminQuestionStats(testId),
    queryFn: () => adminApi.questionStats(testId),
  });
}

export function useAdminResults(testId) {
  return useQuery({
    queryKey: queryKeys.adminResults(testId),
    queryFn: () => adminApi.results(testId),
  });
}

export function useStudentHistory(studentId) {
  return useQuery({
    queryKey: queryKeys.adminStudent(studentId),
    queryFn: () => adminApi.studentAttempts(studentId),
    enabled: Boolean(studentId),
  });
}

// Admin ma'lumotlari kichik: har qanday o'zgarishdan keyin hammasini yangilash eng ishonchli yo'l
export function useInvalidateAdmin() {
  const queryClient = useQueryClient();
  return useCallback(() => queryClient.invalidateQueries({ queryKey: ["admin"] }), [queryClient]);
}
