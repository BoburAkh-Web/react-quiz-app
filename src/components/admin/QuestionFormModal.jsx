import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Check, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { useInvalidateAdmin } from "../../hooks/useAdminData";
import { adminApi } from "../../lib/api";
import { OPTION_LETTERS } from "../../lib/utils";
import ChoiceGroup from "../ui/ChoiceGroup";
import Field from "../ui/Field";
import Modal from "../ui/Modal";

const MIN_OPTIONS = 2;
const MAX_OPTIONS = 6;
const POINT_OPTIONS = [5, 10, 15, 20].map((value) => ({ value, label: String(value) }));

function validate({ question, options, points }) {
  if (!question.trim()) return "Savol matnini kiriting";
  const filled = options.map((option) => option.trim());
  if (filled.some((option) => !option)) return "Barcha variantlarni to'ldiring yoki bo'shini o'chiring";
  if (new Set(filled.map((option) => option.toLowerCase())).size !== filled.length) {
    return "Variantlar bir-biridan farq qilishi kerak";
  }
  if (!(Number(points) > 0)) return "Ball 0 dan katta bo'lishi kerak";
  return null;
}

function QuestionForm({ testId, question, onClose }) {
  const [text, setText] = useState(question?.question ?? "");
  const [options, setOptions] = useState(question?.options ?? ["", "", "", ""]);
  const [correctOption, setCorrectOption] = useState(question?.correct_option ?? 0);
  const [points, setPoints] = useState(question?.points ?? 10);
  const [explanation, setExplanation] = useState(question?.explanation ?? "");
  const [error, setError] = useState("");
  const invalidate = useInvalidateAdmin();

  const mutation = useMutation({
    mutationFn: adminApi.saveQuestion,
    onSuccess: () => {
      invalidate();
      toast.success(question ? "Savol saqlandi" : "Savol qo'shildi");
      onClose();
    },
    onError: (mutationError) => setError(mutationError.message),
  });

  function updateOption(index, value) {
    setOptions((current) => current.map((option, i) => (i === index ? value : option)));
  }

  function removeOption(index) {
    setOptions((current) => current.filter((_, i) => i !== index));
    // To'g'ri javob belgisi o'sha variantda qolishi uchun indeksni siljitamiz
    setCorrectOption((current) => {
      if (index === current) return 0;
      return index < current ? current - 1 : current;
    });
  }

  function handleSubmit(event) {
    event.preventDefault();
    const validationError = validate({ question: text, options, points });
    if (validationError) {
      setError(validationError);
      return;
    }
    mutation.mutate({
      id: question?.id,
      test_id: testId,
      question: text,
      options,
      correct_option: correctOption,
      points: Number(points),
      explanation,
    });
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit} noValidate>
      <Field label="Savol matni" htmlFor="question-text">
        <textarea
          id="question-text"
          className="textarea w-full text-base"
          rows={3}
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Masalan: Massiv oxiriga element qo'shadigan metod qaysi?"
          autoFocus
        />
      </Field>

      <Field label="Variantlar" hint="To'g'ri javobni harf ustiga bosib belgilang">
        <div className="space-y-2">
          {options.map((option, index) => {
            const isCorrect = index === correctOption;
            return (
              <div
                key={index}
                className={`flex items-center gap-2 rounded-2xl border-2 p-1.5 pr-2 transition-colors ${
                  isCorrect ? "border-success bg-success/5" : "border-transparent bg-base-200/60"
                }`}
              >
                <button
                  type="button"
                  className={`grid size-9 shrink-0 place-items-center rounded-xl text-sm font-bold transition-colors ${
                    isCorrect ? "bg-success text-success-content" : "bg-white/10 hover:bg-white/20"
                  }`}
                  onClick={() => setCorrectOption(index)}
                  aria-pressed={isCorrect}
                  aria-label={`${OPTION_LETTERS[index]} variantni to'g'ri deb belgilash`}
                >
                  {isCorrect ? <Check className="size-4" strokeWidth={3} /> : OPTION_LETTERS[index]}
                </button>
                <input
                  className="min-w-0 flex-1 bg-transparent py-2 text-base outline-none placeholder:text-base-content/40"
                  value={option}
                  onChange={(event) => updateOption(index, event.target.value)}
                  placeholder={`${OPTION_LETTERS[index]} variant`}
                  aria-label={`${OPTION_LETTERS[index]} variant`}
                />
                {options.length > MIN_OPTIONS && (
                  <button
                    type="button"
                    className="btn btn-circle btn-ghost btn-xs"
                    onClick={() => removeOption(index)}
                    aria-label={`${OPTION_LETTERS[index]} variantni o'chirish`}
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
        {options.length < MAX_OPTIONS && (
          <button
            type="button"
            className="btn mt-1 gap-1.5 btn-ghost btn-sm"
            onClick={() => setOptions((current) => [...current, ""])}
          >
            <Plus className="size-4" /> Variant qo'shish
          </button>
        )}
      </Field>

      <Field label="Ball">
        <div className="flex flex-wrap items-center gap-2">
          <ChoiceGroup
            name="question-points"
            label="Ball"
            options={POINT_OPTIONS}
            value={Number(points)}
            onChange={setPoints}
          />
          <input
            type="number"
            min={1}
            className="input input-sm w-24 sm:input-md"
            value={points}
            onChange={(event) => setPoints(event.target.value)}
            aria-label="Boshqa ball"
          />
        </div>
      </Field>

      <Field label="Tushuntirish" htmlFor="question-explanation" hint="ixtiyoriy, javobdan keyin ko'rinadi">
        <textarea
          id="question-explanation"
          className="textarea w-full"
          rows={2}
          value={explanation}
          onChange={(event) => setExplanation(event.target.value)}
          placeholder="Nega bu javob to'g'ri? 1–2 gapda"
        />
      </Field>

      {error && <p className="text-sm text-error">{error}</p>}

      <div className="modal-action">
        <button type="button" className="btn btn-ghost" onClick={onClose}>
          Bekor qilish
        </button>
        <button type="submit" className="btn btn-primary" disabled={mutation.isPending}>
          {mutation.isPending && <span className="loading loading-spinner loading-sm" />}
          {question ? "Saqlash" : "Qo'shish"}
        </button>
      </div>
    </form>
  );
}

function QuestionFormModal({ open, testId, question, onClose }) {
  return (
    <Modal open={open} onClose={onClose} title={question ? "Savolni tahrirlash" : "Yangi savol"} wide>
      <QuestionForm testId={testId} question={question} onClose={onClose} />
    </Modal>
  );
}

export default QuestionFormModal;
