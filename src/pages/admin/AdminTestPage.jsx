import { useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeft, ChartNoAxesColumn, ListChecks, SearchX, Settings, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useAdminTests, useInvalidateAdmin } from "../../hooks/useAdminData";
import { adminApi } from "../../lib/api";
import AIGeneratorPanel from "../../components/admin/AIGeneratorPanel";
import QuestionStatsPanel from "../../components/admin/QuestionStatsPanel";
import QuestionsPanel from "../../components/admin/QuestionsPanel";
import TestFormModal from "../../components/admin/TestFormModal";
import EmptyState from "../../components/ui/EmptyState";
import ErrorState from "../../components/ui/ErrorState";
import Loading from "../../components/ui/Loading";

const TABS = [
  { id: "questions", label: "Savollar", icon: ListChecks },
  { id: "ai", label: "AI generator", icon: Sparkles },
  { id: "stats", label: "Statistika", icon: ChartNoAxesColumn },
];

function PublishToggle({ test }) {
  const invalidate = useInvalidateAdmin();
  const mutation = useMutation({
    mutationFn: (isPublished) => adminApi.saveTest({ id: test.id, is_published: isPublished }),
    onSuccess: (saved) => {
      invalidate();
      toast.success(saved.is_published ? "Test o'quvchilarga ochildi" : "Test yopildi");
    },
    onError: (error) => toast.error(error.message),
  });

  return (
    <label className="flex cursor-pointer items-center gap-2.5 rounded-field border border-white/5 bg-base-100/60 px-3 py-2">
      <input
        type="checkbox"
        className="toggle toggle-success toggle-sm"
        checked={test.is_published}
        onChange={(event) => mutation.mutate(event.target.checked)}
        disabled={mutation.isPending}
      />
      <span className="text-sm font-medium">{test.is_published ? "Ochiq" : "Yopiq"}</span>
    </label>
  );
}

function AdminTestPage() {
  const { testId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: tests, isPending, error, refetch } = useAdminTests();
  const [isEditing, setIsEditing] = useState(false);

  const activeTab = TABS.some((tab) => tab.id === searchParams.get("tab"))
    ? searchParams.get("tab")
    : "questions";
  const selectTab = (tabId) => setSearchParams(tabId === "questions" ? {} : { tab: tabId }, { replace: true });

  if (isPending) return <Loading />;
  if (error) return <ErrorState error={error} onRetry={refetch} />;

  const test = tests.find((item) => item.id === testId);
  if (!test) {
    return (
      <EmptyState icon={SearchX} title="Test topilmadi" description="Bu test o'chirilgan bo'lishi mumkin.">
        <Link to="/admin/tests" className="btn btn-primary">
          Testlarga qaytish
        </Link>
      </EmptyState>
    );
  }

  return (
    <>
      <Link to="/admin/tests" className="btn mb-4 gap-2 btn-ghost btn-sm">
        <ArrowLeft className="size-4" /> Testlar
      </Link>

      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-balance sm:text-3xl">{test.title}</h1>
          <p className="mt-1 text-base-content/60">
            {test.question_count} savol · {test.total_points} ball · {test.seconds_per_question} s / savol
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <PublishToggle test={test} />
          <button type="button" className="btn gap-2 btn-ghost" onClick={() => setIsEditing(true)}>
            <Settings className="size-4" /> Sozlamalar
          </button>
        </div>
      </div>

      <div role="tablist" className="tabs-box mb-6 tabs w-full overflow-x-auto sm:w-fit">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={activeTab === id}
            className={`tab flex-1 gap-2 whitespace-nowrap sm:flex-none ${activeTab === id ? "tab-active" : ""}`}
            onClick={() => selectTab(id)}
          >
            <Icon className="size-4" />
            {label}
            {id === "questions" && <span className="badge badge-ghost badge-xs">{test.question_count}</span>}
          </button>
        ))}
      </div>

      {activeTab === "questions" && <QuestionsPanel testId={test.id} onOpenAI={() => selectTab("ai")} />}
      {activeTab === "ai" && (
        <AIGeneratorPanel testId={test.id} testTitle={test.title} onSaved={() => selectTab("questions")} />
      )}
      {activeTab === "stats" && <QuestionStatsPanel testId={test.id} />}

      <TestFormModal open={isEditing} test={test} onClose={() => setIsEditing(false)} />
    </>
  );
}

export default AdminTestPage;
