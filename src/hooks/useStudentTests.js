import { useQuery } from "@tanstack/react-query";
import { studentApi } from "../lib/api";
import { queryKeys } from "../lib/queryClient";

export function useStudentTests() {
  return useQuery({ queryKey: queryKeys.studentTests, queryFn: studentApi.listTests });
}
