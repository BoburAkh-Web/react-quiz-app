import { useEffect } from "react";
import { Link } from "react-router-dom";
import { m } from "motion/react";
import { ArrowLeft, RotateCcw } from "lucide-react";
import { celebrateResult } from "../../lib/feedback";
import { percent } from "../../lib/utils";
import ScoreGauge from "../ui/ScoreGauge";

function getVerdict(value) {
  if (value === 100) return { emoji: "🥇", title: "Mukammal natija!" };
  if (value >= 80) return { emoji: "🎉", title: "Ajoyib!" };
  if (value >= 50) return { emoji: "👍", title: "Yaxshi harakat!" };
  if (value > 0) return { emoji: "💪", title: "Mashq qilishda davom eting!" };
  return { emoji: "🌱", title: "Keyingi safar albatta chiqadi!" };
}

function ResultStat({ label, value, className }) {
  return (
    <div className="rounded-2xl border border-white/5 bg-base-200/60 px-2 py-3">
      <p className={`text-2xl font-bold ${className}`}>{value}</p>
      <p className="text-xs text-base-content/60">{label}</p>
    </div>
  );
}

function QuizResult({ result, onRetry }) {
  const scorePercent = percent(result.score, result.max_score);
  const skipped = result.question_count - result.correct_count - result.wrong_count;
  const { emoji, title } = getVerdict(scorePercent);

  useEffect(() => celebrateResult(scorePercent), [scorePercent]);

  return (
    <m.div
      className="surface rounded-box p-6 text-center sm:p-10"
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <ScoreGauge value={scorePercent} />

      <h1 className="mt-6 text-2xl font-bold sm:text-3xl">
        {emoji} {title}
      </h1>
      <p className="mt-1 text-base-content/60">
        Siz <strong className="text-base-content">{result.score}</strong> / {result.max_score} ball
        to'pladingiz
      </p>

      <div className={`mt-6 grid gap-2 sm:gap-3 ${skipped > 0 ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-3"}`}>
        <ResultStat label="To'g'ri" value={result.correct_count} className="text-success" />
        <ResultStat label="Noto'g'ri" value={result.wrong_count} className="text-error" />
        {skipped > 0 && <ResultStat label="Javobsiz" value={skipped} className="text-base-content/70" />}
        <ResultStat
          label="Eng yaxshi"
          value={`${percent(result.best_score ?? result.score, result.max_score)}%`}
          className="text-accent"
        />
      </div>

      <div className="mt-8 flex flex-col-reverse gap-2 sm:flex-row sm:justify-center">
        <Link to="/tests" className="btn gap-2 btn-ghost">
          <ArrowLeft className="size-4" />
          Testlarga qaytish
        </Link>
        <button type="button" className="btn gap-2 btn-primary" onClick={onRetry}>
          <RotateCcw className="size-4" />
          Qayta ishlash
        </button>
      </div>
    </m.div>
  );
}

export default QuizResult;
