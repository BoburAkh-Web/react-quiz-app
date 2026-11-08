import { ChartNoAxesColumn } from "lucide-react";
import { useQuestionStats } from "../../hooks/useAdminData";
import { scoreToneClasses } from "../../lib/utils";
import EmptyState from "../ui/EmptyState";
import ErrorState from "../ui/ErrorState";
import Loading from "../ui/Loading";

function QuestionStatsPanel({ testId }) {
  const { data: stats, isPending, error, refetch } = useQuestionStats(testId);

  if (isPending) return <Loading />;
  if (error) return <ErrorState error={error} onRetry={refetch} />;

  const answered = stats.filter((item) => item.answer_count > 0);
  if (answered.length === 0) {
    return (
      <EmptyState
        icon={ChartNoAxesColumn}
        title="Hali statistika yo'q"
        description="O'quvchilar testni ishlay boshlagach, har bir savol bo'yicha natijalar shu yerda ko'rinadi."
      />
    );
  }

  return (
    <div className="surface rounded-box p-4 sm:p-6">
      <p className="text-sm text-base-content/60">
        Eng ko'p xato qilingan savollar tepada — ularni darsda qayta tushuntirish foydali.
      </p>
      <ul className="mt-5 space-y-5">
        {stats.map((item) => {
          const hasAnswers = item.answer_count > 0;
          const tone = hasAnswers ? scoreToneClasses(item.correct_percent) : null;
          return (
            <li key={item.id}>
              <div className="flex items-start justify-between gap-4">
                <p className="line-clamp-2 text-sm font-medium">{item.question}</p>
                <span className={`shrink-0 text-sm font-bold ${tone?.text ?? "text-base-content/40"}`}>
                  {hasAnswers ? `${item.correct_percent}%` : "—"}
                </span>
              </div>
              <progress
                className={`progress mt-2 h-2 ${tone?.progress ?? ""}`}
                value={item.correct_percent ?? 0}
                max="100"
              />
              <p className="mt-1 text-xs text-base-content/50">
                {hasAnswers
                  ? `${item.answer_count} ta javobdan ${item.correct_count} tasi to'g'ri`
                  : "Hali javob berilmagan"}
              </p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default QuestionStatsPanel;
