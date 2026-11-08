import { AnimatePresence, m } from "motion/react";
import { Check, Lightbulb, X } from "lucide-react";
import { OPTION_LETTERS } from "../../lib/utils";

const listVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};

function getOptionState(optionIndex, answer) {
  if (!answer) return "idle";
  if (answer.isPending) return optionIndex === answer.selected ? "pending" : "locked";
  if (optionIndex === answer.correctOption) return "correct";
  if (optionIndex === answer.selected) return "wrong";
  return "dimmed";
}

const OPTION_STYLES = {
  idle: "border-white/5 bg-base-200/70 hover:border-primary/60 hover:bg-base-200",
  pending: "border-primary bg-primary/10",
  locked: "border-white/5 bg-base-200/70 opacity-60",
  correct: "border-success bg-success/10 animate-pop",
  wrong: "border-error bg-error/10 animate-shake",
  dimmed: "border-transparent bg-base-200/40 opacity-50",
};

const MARK_STYLES = {
  idle: "bg-white/10 text-base-content/70",
  pending: "bg-primary text-primary-content",
  locked: "bg-white/10 text-base-content/70",
  correct: "bg-success text-success-content",
  wrong: "bg-error text-error-content",
  dimmed: "bg-white/10 text-base-content/70",
};

function OptionMark({ state, letter }) {
  if (state === "pending") return <span className="loading loading-spinner loading-xs" />;
  if (state === "correct") return <Check className="size-5" strokeWidth={3} />;
  if (state === "wrong") return <X className="size-5" strokeWidth={3} />;
  return letter;
}

function QuestionCard({ question, answer, onAnswer }) {
  const hasResult = answer && !answer.isPending;

  return (
    <m.section
      className="surface rounded-box p-5 sm:p-7"
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -16 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      <span className="badge badge-ghost badge-sm">{question.points} ball</span>
      <h2 className="mt-3 text-lg leading-relaxed font-semibold whitespace-pre-line sm:text-xl">
        {question.question}
      </h2>

      <m.div
        className="mt-5 grid gap-2.5"
        variants={listVariants}
        initial="hidden"
        animate="visible"
      >
        {question.order.map((optionIndex, position) => {
          const state = getOptionState(optionIndex, answer);
          return (
            <m.div key={optionIndex} variants={itemVariants}>
              <m.button
                type="button"
                className={`flex w-full items-center gap-3 rounded-2xl border-2 p-2.5 pr-4 text-left transition-colors sm:p-3 sm:pr-5 ${OPTION_STYLES[state]}`}
                disabled={Boolean(answer)}
                whileTap={answer ? undefined : { scale: 0.98 }}
                onClick={() => onAnswer(optionIndex)}
              >
                <span
                  className={`grid size-9 shrink-0 place-items-center rounded-xl text-sm font-bold ${MARK_STYLES[state]}`}
                >
                  <OptionMark state={state} letter={OPTION_LETTERS[position]} />
                </span>
                <span className="min-w-0 flex-1 leading-snug">{question.options[optionIndex]}</span>
              </m.button>
            </m.div>
          );
        })}
      </m.div>

      <AnimatePresence>
        {hasResult && answer.explanation && (
          <m.div
            className="mt-5 alert items-start alert-soft alert-info"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Lightbulb className="mt-0.5 size-5 shrink-0" />
            <span>{answer.explanation}</span>
          </m.div>
        )}
      </AnimatePresence>
    </m.section>
  );
}

export default QuestionCard;
