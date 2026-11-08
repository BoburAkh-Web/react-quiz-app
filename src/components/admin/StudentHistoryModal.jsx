import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { KeyRound, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useInvalidateAdmin, useStudentHistory } from "../../hooks/useAdminData";
import { adminApi } from "../../lib/api";
import { isValidPassword } from "../../lib/password";
import { formatDateTime, percent, scoreToneClasses } from "../../lib/utils";
import Avatar from "../ui/Avatar";
import ConfirmDialog from "../ui/ConfirmDialog";
import ErrorState from "../ui/ErrorState";
import Loading from "../ui/Loading";
import Modal from "../ui/Modal";
import PasswordInput from "../ui/PasswordInput";

function AttemptRow({ attempt }) {
  const value = attempt.max_score ? percent(attempt.score, attempt.max_score) : null;
  const tone = value == null ? null : scoreToneClasses(value);

  return (
    <li className="flex items-center gap-3 rounded-xl bg-base-200/60 px-3 py-2.5">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">
          {attempt.test_title ?? <span className="text-base-content/50 italic">O'chirilgan test</span>}
          {attempt.is_legacy && <span className="ml-2 badge badge-ghost badge-xs">eski</span>}
        </p>
        <p className="text-xs text-base-content/50">
          {formatDateTime(attempt.finished_at)}
          {attempt.correct_count != null && ` · ✓ ${attempt.correct_count}  ✗ ${attempt.wrong_count}`}
        </p>
      </div>
      <div className="text-right">
        <p className={`font-bold ${tone?.text ?? ""}`}>{value == null ? attempt.score : `${value}%`}</p>
        {attempt.max_score && (
          <p className="text-xs text-base-content/50">
            {attempt.score}/{attempt.max_score}
          </p>
        )}
      </div>
    </li>
  );
}

function ResetPasswordForm({ studentId }) {
  const [password, setPassword] = useState("");
  const mutation = useMutation({
    mutationFn: () => adminApi.resetStudentPassword(studentId, password),
    onSuccess: () => {
      toast.success("Parol yangilandi. O'quvchi yangi parol bilan kiradi");
      setPassword("");
    },
    onError: (error) => toast.error(error.message),
  });

  return (
    <form
      className="space-y-2"
      onSubmit={(event) => {
        event.preventDefault();
        mutation.mutate();
      }}
    >
      <p className="flex items-center gap-2 text-sm font-medium">
        <KeyRound className="size-4" /> Parolni tiklash
      </p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="sm:flex-1">
          <PasswordInput
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Yangi parol (8+ belgi, harf va raqam)"
            autoComplete="new-password"
          />
        </div>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={!isValidPassword(password) || mutation.isPending}
        >
          {mutation.isPending && <span className="loading loading-spinner loading-sm" />}
          Saqlash
        </button>
      </div>
    </form>
  );
}

function StudentHistory({ studentId, onDeleted }) {
  const { data, isPending, error, refetch } = useStudentHistory(studentId);
  const invalidate = useInvalidateAdmin();
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: () => adminApi.deleteStudent(studentId),
    onSuccess: () => {
      invalidate();
      toast.success("O'quvchi o'chirildi");
      setIsConfirmingDelete(false);
      onDeleted();
    },
    onError: (mutationError) => toast.error(mutationError.message),
  });

  if (isPending) return <Loading />;
  if (error) return <ErrorState error={error} onRetry={refetch} />;

  const { student, attempts } = data;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Avatar name={student.nickname} />
        <div className="min-w-0">
          <p className="truncate font-semibold">{student.nickname}</p>
          <p className="text-xs text-base-content/50">
            Ro'yxatdan o'tgan: {formatDateTime(student.created_at)}
          </p>
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium">Urinishlar ({attempts.length})</p>
        {attempts.length === 0 ? (
          <p className="rounded-xl bg-base-200/60 px-3 py-4 text-center text-sm text-base-content/60">
            Hali test ishlamagan
          </p>
        ) : (
          <ul className="max-h-72 space-y-1.5 overflow-y-auto">
            {attempts.map((attempt) => (
              <AttemptRow key={attempt.id} attempt={attempt} />
            ))}
          </ul>
        )}
      </div>

      <div className="divider my-0" />
      <ResetPasswordForm studentId={student.id} />

      <button
        type="button"
        className="btn w-full gap-2 btn-soft btn-error"
        onClick={() => setIsConfirmingDelete(true)}
      >
        <Trash2 className="size-4" /> O'quvchini o'chirish
      </button>

      <ConfirmDialog
        open={isConfirmingDelete}
        title="O'quvchini o'chirish"
        description={`${student.nickname} va uning barcha natijalari butunlay o'chiriladi.`}
        isPending={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate()}
        onClose={() => setIsConfirmingDelete(false)}
      />
    </div>
  );
}

function StudentHistoryModal({ studentId, onClose }) {
  return (
    <Modal open={Boolean(studentId)} onClose={onClose} title="O'quvchi" wide>
      <StudentHistory studentId={studentId} onDeleted={onClose} />
    </Modal>
  );
}

export default StudentHistoryModal;
