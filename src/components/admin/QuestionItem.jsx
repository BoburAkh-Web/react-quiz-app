import { Check, Lightbulb, Pencil, Trash2 } from "lucide-react";
import { OPTION_LETTERS } from "../../lib/utils";

function QuestionItem({ question, number, onEdit, onDelete }) {
  return (
    <li className="surface rounded-box p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-white/10 text-sm font-bold">
          {number}
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-medium whitespace-pre-line">{question.question}</p>
          <span className="mt-1.5 badge badge-ghost badge-sm">{question.points} ball</span>
        </div>
        <div className="flex shrink-0 gap-1">
          <button
            type="button"
            className="btn btn-square btn-ghost btn-sm"
            onClick={() => onEdit(question)}
            aria-label="Savolni tahrirlash"
            title="Tahrirlash"
          >
            <Pencil className="size-4" />
          </button>
          <button
            type="button"
            className="btn btn-square text-error btn-ghost btn-sm"
            onClick={() => onDelete(question)}
            aria-label="Savolni o'chirish"
            title="O'chirish"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      </div>

      <ul className="mt-3 grid gap-1.5 sm:ml-11 sm:grid-cols-2">
        {question.options.map((option, index) => {
          const isCorrect = index === question.correct_option;
          return (
            <li
              key={index}
              className={`flex items-center gap-2.5 rounded-xl border px-3 py-2 text-sm ${
                isCorrect
                  ? "border-success/60 bg-success/10"
                  : "border-transparent bg-base-200/50 text-base-content/70"
              }`}
            >
              <span className="font-bold text-base-content/50">{OPTION_LETTERS[index]}</span>
              <span className="min-w-0 flex-1">{option}</span>
              {isCorrect && <Check className="size-4 shrink-0 text-success" />}
            </li>
          );
        })}
      </ul>

      {question.explanation && (
        <p className="mt-3 flex gap-2 text-sm text-base-content/60 sm:ml-11">
          <Lightbulb className="mt-0.5 size-4 shrink-0 text-warning" />
          {question.explanation}
        </p>
      )}
    </li>
  );
}

export default QuestionItem;
