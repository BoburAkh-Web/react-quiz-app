import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { FileQuestion, Plus, Search, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useAdminQuestions, useInvalidateAdmin } from "../../hooks/useAdminData";
import { adminApi } from "../../lib/api";
import ConfirmDialog from "../ui/ConfirmDialog";
import EmptyState from "../ui/EmptyState";
import ErrorState from "../ui/ErrorState";
import Loading from "../ui/Loading";
import QuestionFormModal from "./QuestionFormModal";
import QuestionItem from "./QuestionItem";

function QuestionsPanel({ testId, onOpenAI }) {
  const { data: questions, isPending, error, refetch } = useAdminQuestions(testId);
  const invalidate = useInvalidateAdmin();
  const [query, setQuery] = useState("");
  // null — yopiq, {} — yangi savol, savol obyekti — tahrirlash
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const deleteMutation = useMutation({
    mutationFn: (question) => adminApi.deleteQuestion(question.id),
    onSuccess: () => {
      invalidate();
      toast.success("Savol o'chirildi");
      setDeleting(null);
    },
    onError: (mutationError) => toast.error(mutationError.message),
  });

  if (isPending) return <Loading />;
  if (error) return <ErrorState error={error} onRetry={refetch} />;

  // Raqam butun ro'yxat bo'yicha, qidiruvdan oldin beriladi
  const numbered = questions.map((question, index) => ({ question, number: index + 1 }));
  const needle = query.trim().toLowerCase();
  const visible = needle
    ? numbered.filter(({ question }) => question.question.toLowerCase().includes(needle))
    : numbered;

  return (
    <>
      {questions.length === 0 ? (
        <EmptyState
          icon={FileQuestion}
          title="Bu testda hali savol yo'q"
          description="Savollarni qo'lda yozing yoki AI'ga mavzuni aytib, bir zumda yarating."
        >
          <button type="button" className="btn gap-2 btn-primary" onClick={() => setEditing({})}>
            <Plus className="size-4" /> Savol qo'shish
          </button>
          <button type="button" className="btn gap-2 btn-soft btn-secondary" onClick={onOpenAI}>
            <Sparkles className="size-4" /> AI bilan yaratish
          </button>
        </EmptyState>
      ) : (
        <>
          <div className="mb-4 flex flex-col gap-2 sm:flex-row">
            <label className="input w-full sm:flex-1">
              <Search className="size-4 opacity-50" />
              <input
                type="search"
                className="grow"
                placeholder="Savollar bo'yicha qidirish..."
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>
            <button type="button" className="btn gap-2 btn-primary" onClick={() => setEditing({})}>
              <Plus className="size-4" /> Savol qo'shish
            </button>
          </div>

          {visible.length === 0 ? (
            <p className="py-10 text-center text-base-content/60">Hech narsa topilmadi</p>
          ) : (
            <ol className="space-y-3">
              {visible.map(({ question, number }) => (
                <QuestionItem
                  key={question.id}
                  question={question}
                  number={number}
                  onEdit={setEditing}
                  onDelete={setDeleting}
                />
              ))}
            </ol>
          )}
        </>
      )}

      <QuestionFormModal
        open={editing !== null}
        testId={testId}
        question={editing?.id ? editing : null}
        onClose={() => setEditing(null)}
      />

      <ConfirmDialog
        open={deleting !== null}
        title="Savolni o'chirish"
        description="Savol testdan butunlay o'chiriladi. Bu amalni qaytarib bo'lmaydi."
        isPending={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate(deleting)}
        onClose={() => setDeleting(null)}
      />
    </>
  );
}

export default QuestionsPanel;
