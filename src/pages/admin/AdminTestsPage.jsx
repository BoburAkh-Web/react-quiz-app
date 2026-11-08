import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { BookPlus, Plus } from "lucide-react";
import { toast } from "sonner";
import { useAdminTests, useInvalidateAdmin } from "../../hooks/useAdminData";
import { adminApi } from "../../lib/api";
import AdminTestCard from "../../components/admin/AdminTestCard";
import TestFormModal from "../../components/admin/TestFormModal";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import EmptyState from "../../components/ui/EmptyState";
import ErrorState from "../../components/ui/ErrorState";
import PageHeader from "../../components/ui/PageHeader";

function AdminTestsPage() {
  const navigate = useNavigate();
  const { data: tests, isPending, error, refetch } = useAdminTests();
  const invalidate = useInvalidateAdmin();

  // null — yopiq, {} — yangi test, test obyekti — tahrirlash
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const deleteMutation = useMutation({
    mutationFn: (test) => adminApi.deleteTest(test.id),
    onSuccess: () => {
      invalidate();
      toast.success("Test o'chirildi");
      setDeleting(null);
    },
    onError: (mutationError) => toast.error(mutationError.message),
  });

  const openCreate = () => setEditing({});

  return (
    <>
      <PageHeader
        title="Testlar"
        description="Test yarating, savollar qo'shing va o'quvchilarga oching"
      >
        <button type="button" className="btn gap-2 btn-primary" onClick={openCreate}>
          <Plus className="size-4" /> Yangi test
        </button>
      </PageHeader>

      {isPending && (
        <div className="grid gap-4 md:grid-cols-2" aria-hidden="true">
          {[1, 2].map((key) => (
            <div key={key} className="skeleton h-52 rounded-box" />
          ))}
        </div>
      )}
      {error && <ErrorState error={error} onRetry={refetch} />}

      {tests?.length === 0 && (
        <EmptyState
          icon={BookPlus}
          title="Hali test yo'q"
          description="Birinchi testni yarating, keyin unga qo'lda yoki AI yordamida savollar qo'shing."
        >
          <button type="button" className="btn gap-2 btn-primary" onClick={openCreate}>
            <Plus className="size-4" /> Test yaratish
          </button>
        </EmptyState>
      )}

      {tests?.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {tests.map((test) => (
            <AdminTestCard key={test.id} test={test} onEdit={setEditing} onDelete={setDeleting} />
          ))}
        </div>
      )}

      <TestFormModal
        open={editing !== null}
        test={editing?.id ? editing : null}
        onClose={() => setEditing(null)}
        onSaved={(saved) => {
          if (!editing?.id) navigate(`/admin/tests/${saved.id}`);
        }}
      />

      <ConfirmDialog
        open={deleting !== null}
        title="Testni o'chirish"
        description={`"${deleting?.title}" testi va uning barcha savollari o'chiriladi. O'quvchilarning natijalari tarixda saqlanib qoladi.`}
        isPending={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate(deleting)}
        onClose={() => setDeleting(null)}
      />
    </>
  );
}

export default AdminTestsPage;
