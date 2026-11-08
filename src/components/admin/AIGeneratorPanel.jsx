import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Check, Lightbulb, Save, Sparkles, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { useInvalidateAdmin } from "../../hooks/useAdminData";
import { adminApi } from "../../lib/api";
import { OPTION_LETTERS, shuffle } from "../../lib/utils";
import ChoiceGroup from "../ui/ChoiceGroup";
import Field from "../ui/Field";

// Har bir AI so'rovida nechta savol: server vaqt limitiga sig'ishi uchun
const BATCH_SIZE = 5;

const COUNT_OPTIONS = [5, 10, 15, 20].map((value) => ({ value, label: String(value) }));
const DIFFICULTY_OPTIONS = [
  { value: "easy", label: "Oson" },
  { value: "medium", label: "O'rta" },
  { value: "hard", label: "Qiyin" },
  { value: "mixed", label: "Aralash" },
];
const LANGUAGE_OPTIONS = [
  { value: "uz", label: "O'zbek" },
  { value: "ru", label: "Русский" },
  { value: "en", label: "English" },
];
const DIFFICULTY = {
  easy: { label: "Oson", points: 5, badge: "badge-success" },
  medium: { label: "O'rta", points: 10, badge: "badge-warning" },
  hard: { label: "Qiyin", points: 15, badge: "badge-error" },
};

// AI faqat to'g'ri va noto'g'ri javoblarni qaytaradi; joylashuvni biz aralashtiramiz.
// O'quvchilarga variantlar baribir har safar yangi tartibda ko'rsatiladi.
function toDraft(raw) {
  const options = shuffle([raw.correctAnswer, ...raw.wrongAnswers]);
  return {
    key: crypto.randomUUID(),
    question: raw.question,
    options,
    correct_option: options.indexOf(raw.correctAnswer),
    difficulty: raw.difficulty,
    points: DIFFICULTY[raw.difficulty]?.points ?? 10,
    explanation: raw.explanation ?? "",
  };
}

function DraftItem({ draft, number, onSetCorrect, onRemove }) {
  const difficulty = DIFFICULTY[draft.difficulty];

  return (
    <li className="rounded-box border border-white/5 bg-base-200/60 p-4">
      <div className="flex items-start gap-3">
        <span className="grid size-7 shrink-0 place-items-center rounded-full bg-white/10 text-xs font-bold">
          {number}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            {difficulty && (
              <span className={`badge badge-soft badge-xs ${difficulty.badge}`}>{difficulty.label}</span>
            )}
            <span className="text-xs text-base-content/50">{draft.points} ball</span>
          </div>
          <p className="mt-1.5 font-medium">{draft.question}</p>
        </div>
        <button
          type="button"
          className="btn btn-circle text-base-content/50 btn-ghost btn-sm hover:text-error"
          onClick={onRemove}
          aria-label="Savolni olib tashlash"
          title="Olib tashlash"
        >
          <X className="size-4" />
        </button>
      </div>

      <div className="mt-3 grid gap-1.5 sm:ml-10 sm:grid-cols-2">
        {draft.options.map((option, index) => {
          const isCorrect = index === draft.correct_option;
          return (
            <button
              key={index}
              type="button"
              className={`flex items-center gap-2.5 rounded-xl border px-3 py-2 text-left text-sm transition-colors ${
                isCorrect
                  ? "border-success/60 bg-success/10"
                  : "border-transparent bg-base-100/60 hover:border-white/20"
              }`}
              onClick={() => onSetCorrect(index)}
              aria-pressed={isCorrect}
            >
              <span className="font-bold text-base-content/50">{OPTION_LETTERS[index]}</span>
              <span className="min-w-0 flex-1">{option}</span>
              {isCorrect && <Check className="size-4 shrink-0 text-success" />}
            </button>
          );
        })}
      </div>

      {draft.explanation && (
        <p className="mt-3 flex gap-2 text-sm text-base-content/60 sm:ml-10">
          <Lightbulb className="mt-0.5 size-4 shrink-0 text-warning" />
          {draft.explanation}
        </p>
      )}
    </li>
  );
}

function AIGeneratorPanel({ testId, testTitle, onSaved }) {
  const [topic, setTopic] = useState(testTitle);
  const [count, setCount] = useState(10);
  const [difficulty, setDifficulty] = useState("medium");
  const [language, setLanguage] = useState("uz");
  const [notes, setNotes] = useState("");
  const [drafts, setDrafts] = useState([]);
  const [progress, setProgress] = useState(null); // { done, total } yaratish davomida
  const invalidate = useInvalidateAdmin();

  const isGenerating = progress !== null;

  const saveMutation = useMutation({
    mutationFn: () =>
      adminApi.addQuestions(
        testId,
        drafts.map(({ question, options, correct_option, points, explanation }) => ({
          question,
          options,
          correct_option,
          points,
          explanation,
        })),
      ),
    onSuccess: (savedCount) => {
      invalidate();
      toast.success(`${savedCount} ta savol testga qo'shildi 🎉`);
      setDrafts([]);
      onSaved();
    },
    onError: (error) => toast.error(error.message),
  });

  async function handleGenerate(event) {
    event.preventDefault();
    if (!topic.trim()) {
      toast.error("Mavzuni kiriting");
      return;
    }

    setDrafts([]);
    setProgress({ done: 0, total: count });

    const collected = [];
    try {
      while (collected.length < count) {
        const batch = await adminApi.generateQuestions({
          topic,
          count: Math.min(BATCH_SIZE, count - collected.length),
          difficulty,
          language,
          notes,
          avoid: collected.map((item) => item.question),
        });
        collected.push(...batch);
        setProgress({ done: Math.min(collected.length, count), total: count });
      }
    } catch (error) {
      toast.error(
        collected.length > 0 ? `${error.message} (${collected.length} ta savol tayyor bo'ldi)` : error.message,
      );
    }

    setDrafts(collected.slice(0, count).map(toDraft));
    setProgress(null);
  }

  function setCorrect(key, index) {
    setDrafts((current) =>
      current.map((draft) => (draft.key === key ? { ...draft, correct_option: index } : draft)),
    );
  }

  return (
    <div className="space-y-6">
      <form className="surface space-y-5 rounded-box p-5 sm:p-6" onSubmit={handleGenerate}>
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand text-white">
            <Sparkles className="size-5" />
          </span>
          <div>
            <h2 className="font-semibold">AI bilan savol yaratish</h2>
            <p className="text-sm text-base-content/60">
              Mavzuni yozing — AI savollar, variantlar, to'g'ri javob va tushuntirishni tayyorlaydi.
              Saqlashdan oldin tekshirib chiqasiz.
            </p>
          </div>
        </div>

        <Field label="Mavzu" htmlFor="ai-topic">
          <input
            id="ai-topic"
            className="input w-full"
            value={topic}
            onChange={(event) => setTopic(event.target.value)}
            placeholder="Masalan: JavaScript'da closure va scope"
            maxLength={200}
            disabled={isGenerating}
          />
        </Field>

        <div className="grid gap-5 lg:grid-cols-2">
          <Field label="Savollar soni">
            <ChoiceGroup
              name="ai-count"
              label="Savollar soni"
              options={COUNT_OPTIONS}
              value={count}
              onChange={setCount}
              disabled={isGenerating}
            />
          </Field>
          <Field label="Qiyinlik">
            <ChoiceGroup
              name="ai-difficulty"
              label="Qiyinlik"
              options={DIFFICULTY_OPTIONS}
              value={difficulty}
              onChange={setDifficulty}
              disabled={isGenerating}
            />
          </Field>
        </div>

        <Field label="Til">
          <ChoiceGroup
            name="ai-language"
            label="Til"
            options={LANGUAGE_OPTIONS}
            value={language}
            onChange={setLanguage}
            disabled={isGenerating}
          />
        </Field>

        <Field label="Qo'shimcha ko'rsatma" htmlFor="ai-notes" hint="ixtiyoriy">
          <textarea
            id="ai-notes"
            className="textarea w-full"
            rows={2}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Masalan: ko'proq kod misollari bilan, 10–12 yoshli bolalar uchun sodda tilda"
            maxLength={500}
            disabled={isGenerating}
          />
        </Field>

        {isGenerating && (
          <div role="status">
            <div className="mb-1.5 flex justify-between text-sm text-base-content/60">
              <span>AI savollar tuzmoqda...</span>
              <span className="tabular-nums">
                {progress.done}/{progress.total}
              </span>
            </div>
            <progress
              className="progress progress-secondary"
              value={Math.max(5, (progress.done / progress.total) * 100)}
              max="100"
            />
          </div>
        )}

        <button
          type="submit"
          className="btn btn-block border-0 bg-brand text-white"
          disabled={isGenerating || saveMutation.isPending}
        >
          {isGenerating ? (
            <span className="loading loading-spinner" />
          ) : (
            <>
              <Sparkles className="size-4" />
              {drafts.length > 0 ? "Qaytadan yaratish" : `${count} ta savol yaratish`}
            </>
          )}
        </button>
      </form>

      {drafts.length > 0 && (
        <section className="surface rounded-box p-5 sm:p-6">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 className="text-lg font-semibold">{drafts.length} ta savol tayyor</h2>
              <p className="text-sm text-base-content/60">
                Xato bo'lsa, to'g'ri variantni bosib almashtiring yoki savolni olib tashlang
              </p>
            </div>
          </div>

          <ol className="mt-4 space-y-3">
            {drafts.map((draft, index) => (
              <DraftItem
                key={draft.key}
                draft={draft}
                number={index + 1}
                onSetCorrect={(optionIndex) => setCorrect(draft.key, optionIndex)}
                onRemove={() => setDrafts((current) => current.filter((item) => item.key !== draft.key))}
              />
            ))}
          </ol>

          <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              className="btn gap-2 btn-ghost"
              onClick={() => setDrafts([])}
              disabled={saveMutation.isPending}
            >
              <Trash2 className="size-4" /> Bekor qilish
            </button>
            <button
              type="button"
              className="btn gap-2 btn-primary"
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
            >
              {saveMutation.isPending ? (
                <span className="loading loading-spinner loading-sm" />
              ) : (
                <Save className="size-4" />
              )}
              {drafts.length} ta savolni testga qo'shish
            </button>
          </div>
        </section>
      )}
    </div>
  );
}

export default AIGeneratorPanel;
