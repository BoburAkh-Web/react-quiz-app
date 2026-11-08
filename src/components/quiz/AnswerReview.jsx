import { useState } from "react";
import { Check, Lightbulb, Minus, X } from "lucide-react";
import { OPTION_LETTERS } from "../../lib/utils";

const STATUS = {
  correct: { icon: Check, className: "bg-success text-success-content" },
  wrong: { icon: X, className: "bg-error text-error-content" },
  skipped: { icon: Minus, className: "bg-white/10 text-base-content/60" },
};

function getStatus(item) {
  if (item.selected_option == null) return "skipped";
  return item.is_correct ? "correct" : "wrong";
}

function ReviewOption({ text, letter, isCorrect, isSelected }) {
  let className = "border-transparent bg-base-200/50 text-base-content/60";
  let tag = null;
  if (isCorrect) {
    className = "border-success/60 bg-success/10";
    tag = "To'g'ri javob";
  } else if (isSelected) {
    className = "border-error/60 bg-error/10";
    tag = "Sizning javobingiz";
  }

  return (
    <li className={`flex items-center gap-2.5 rounded-xl border px-3 py-2 text-sm ${className}`}>
      <span className="font-bold text-base-content/50">{letter}</span>
      <span className="min-w-0 flex-1">{text}</span>
      {tag && <span className="shrink-0 text-xs font-medium opacity-80">{tag}</span>}
    </li>
  );
}

function ReviewItem({ item }) {
  const status = getStatus(item);
  const { icon: StatusIcon, className } = STATUS[status];

  return (
    <li className="surface rounded-box p-4 sm:p-5">
      <div className="flex gap-3">
        <span className={`grid size-7 shrink-0 place-items-center rounded-full ${className}`}>
          <StatusIcon className="size-4" strokeWidth={3} />
        </span>
        <p className="font-medium whitespace-pre-line">
          {item.number}. {item.question}
        </p>
      </div>

      <ul className="mt-3 grid gap-1.5 sm:grid-cols-2">
        {item.options.map((text, index) => (
          <ReviewOption
            key={index}
            text={text}
            letter={OPTION_LETTERS[index]}
            isCorrect={index === item.correct_option}
            isSelected={index === item.selected_option}
          />
        ))}
      </ul>

      {status === "skipped" && (
        <p className="mt-2 text-xs text-base-content/50">Bu savolga javob berilmagan</p>
      )}
      {item.explanation && (
        <p className="mt-3 flex gap-2 text-sm text-base-content/70">
          <Lightbulb className="mt-0.5 size-4 shrink-0 text-warning" />
          {item.explanation}
        </p>
      )}
    </li>
  );
}

function AnswerReview({ review }) {
  const [onlyMistakes, setOnlyMistakes] = useState(false);
  const numbered = review.map((item, index) => ({ ...item, number: index + 1 }));
  const mistakes = numbered.filter((item) => !item.is_correct);
  const visible = onlyMistakes ? mistakes : numbered;

  return (
    <section className="mt-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold">Javoblar tahlili</h2>
        <div role="tablist" className="tabs-box tabs tabs-sm">
          <button
            type="button"
            role="tab"
            aria-selected={!onlyMistakes}
            className={`tab ${!onlyMistakes ? "tab-active" : ""}`}
            onClick={() => setOnlyMistakes(false)}
          >
            Hammasi ({numbered.length})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={onlyMistakes}
            className={`tab ${onlyMistakes ? "tab-active" : ""}`}
            onClick={() => setOnlyMistakes(true)}
          >
            Xatolar ({mistakes.length})
          </button>
        </div>
      </div>

      {visible.length === 0 ? (
        <p className="mt-6 text-center text-base-content/60">Xato yo'q — barakalla! 🎉</p>
      ) : (
        <ol className="mt-4 space-y-3">
          {visible.map((item) => (
            <ReviewItem key={item.question_id} item={item} />
          ))}
        </ol>
      )}
    </section>
  );
}

export default AnswerReview;
