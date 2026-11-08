import { BookOpen, CircleCheck, Inbox, TrendingUp } from "lucide-react";
import { useStudentAuth } from "../context/StudentAuthContext";
import { useStudentTests } from "../hooks/useStudentTests";
import { percent } from "../lib/utils";
import TestCard from "../components/student/TestCard";
import EmptyState from "../components/ui/EmptyState";
import ErrorState from "../components/ui/ErrorState";
import PageHeader from "../components/ui/PageHeader";
import StatCard from "../components/ui/StatCard";

function getSummary(tests) {
  const completed = tests.filter((test) => test.best_score != null);
  const average = completed.length
    ? Math.round(
        completed.reduce((sum, test) => sum + percent(test.best_score, test.total_points), 0) /
          completed.length,
      )
    : null;
  return { total: tests.length, completed: completed.length, average };
}

function TestsPageSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-hidden="true">
      {[1, 2, 3].map((key) => (
        <div key={key} className="skeleton h-60 rounded-box" />
      ))}
    </div>
  );
}

function TestsPage() {
  const { student } = useStudentAuth();
  const { data: tests, isPending, error, refetch } = useStudentTests();

  return (
    <>
      <PageHeader
        title={`Salom, ${student.nickname}! 👋`}
        description="Bugun qaysi mavzuda bilimingizni sinaysiz?"
      />

      {isPending && <TestsPageSkeleton />}
      {error && <ErrorState error={error} onRetry={refetch} />}

      {tests && tests.length === 0 && (
        <EmptyState
          icon={Inbox}
          title="Hozircha testlar yo'q"
          description="O'qituvchingiz yangi test qo'shganda u shu yerda paydo bo'ladi."
        />
      )}

      {tests && tests.length > 0 && <TestsOverview tests={tests} />}
    </>
  );
}

function TestsOverview({ tests }) {
  const summary = getSummary(tests);

  return (
    <>
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <StatCard icon={BookOpen} label="Testlar" value={summary.total} />
        <StatCard icon={CircleCheck} label="Ishlangan" value={summary.completed} tone="success" />
        <StatCard
          icon={TrendingUp}
          label="O'rtacha"
          value={summary.average == null ? "—" : `${summary.average}%`}
          tone="secondary"
        />
      </div>

      <h2 className="mt-8 mb-4 text-lg font-semibold">Barcha testlar</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tests.map((test) => (
          <TestCard key={test.id} test={test} />
        ))}
      </div>
    </>
  );
}

export default TestsPage;
