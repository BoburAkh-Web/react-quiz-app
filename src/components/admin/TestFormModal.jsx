import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useInvalidateAdmin } from "../../hooks/useAdminData";
import { adminApi } from "../../lib/api";
import ChoiceGroup from "../ui/ChoiceGroup";
import Field from "../ui/Field";
import Modal from "../ui/Modal";

const DURATION_OPTIONS = [15, 30, 45, 60].map((value) => ({ value, label: `${value} s` }));

function TestForm({ test, onClose, onSaved }) {
  const [title, setTitle] = useState(test?.title ?? "");
  const [description, setDescription] = useState(test?.description ?? "");
  const [seconds, setSeconds] = useState(test?.seconds_per_question ?? 30);
  const [isPublished, setIsPublished] = useState(test?.is_published ?? false);
  const [error, setError] = useState("");
  const invalidate = useInvalidateAdmin();

  const mutation = useMutation({
    mutationFn: adminApi.saveTest,
    onSuccess: (saved) => {
      invalidate();
      toast.success(test ? "Test saqlandi" : "Test yaratildi");
      onSaved?.(saved);
      onClose();
    },
    onError: (mutationError) => setError(mutationError.message),
  });

  function handleSubmit(event) {
    event.preventDefault();
    if (!title.trim()) {
      setError("Test nomini kiriting");
      return;
    }
    mutation.mutate({
      id: test?.id,
      title,
      description,
      seconds_per_question: Number(seconds),
      is_published: isPublished,
    });
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit} noValidate>
      <Field label="Test nomi" htmlFor="test-title">
        <input
          id="test-title"
          className="input w-full"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Masalan: Massiv metodlari"
          maxLength={120}
          autoFocus
        />
      </Field>

      <Field label="Tavsif" htmlFor="test-description" hint="ixtiyoriy">
        <textarea
          id="test-description"
          className="textarea w-full"
          rows={2}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="O'quvchilar test kartasida ko'radigan qisqa izoh"
          maxLength={500}
        />
      </Field>

      <Field label="Har bir savolga vaqt">
        <div className="flex flex-wrap items-center gap-2">
          <ChoiceGroup
            name="test-duration"
            label="Har bir savolga vaqt"
            options={DURATION_OPTIONS}
            value={Number(seconds)}
            onChange={setSeconds}
          />
          <input
            type="number"
            className="input input-sm w-24 sm:input-md"
            min={5}
            max={600}
            value={seconds}
            onChange={(event) => setSeconds(event.target.value)}
            aria-label="Boshqa vaqt (soniya)"
          />
        </div>
      </Field>

      <label className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-white/5 bg-base-200/60 p-4">
        <span>
          <span className="block font-medium">O'quvchilarga ochiq</span>
          <span className="text-sm text-base-content/60">
            Yoqilsa, test o'quvchilar ro'yxatida ko'rinadi
          </span>
        </span>
        <input
          type="checkbox"
          className="toggle toggle-success"
          checked={isPublished}
          onChange={(event) => setIsPublished(event.target.checked)}
        />
      </label>

      {error && <p className="text-sm text-error">{error}</p>}

      <div className="modal-action">
        <button type="button" className="btn btn-ghost" onClick={onClose}>
          Bekor qilish
        </button>
        <button type="submit" className="btn btn-primary" disabled={mutation.isPending}>
          {mutation.isPending && <span className="loading loading-spinner loading-sm" />}
          {test ? "Saqlash" : "Yaratish"}
        </button>
      </div>
    </form>
  );
}

function TestFormModal({ open, test, onClose, onSaved }) {
  return (
    <Modal open={open} onClose={onClose} title={test ? "Testni tahrirlash" : "Yangi test"}>
      <TestForm test={test} onClose={onClose} onSaved={onSaved} />
    </Modal>
  );
}

export default TestFormModal;
