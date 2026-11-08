import { Link } from "react-router-dom";
import { BookOpen, Clock, ListChecks, Play, RotateCcw, Star, StepForward } from "lucide-react";
import { formatMinutes, percent, scoreToneClasses } from "../../lib/utils";

function getAction(test) {
  if (test.has_open_attempt) return { label: "Davom ettirish", icon: StepForward, className: "btn-warning" };
  if (test.attempt_count > 0) return { label: "Qayta ishlash", icon: RotateCcw, className: "btn-outline btn-primary" };
  return { label: "Boshlash", icon: Play, className: "btn-primary" };
}

function TestCard({ test }) {
  const bestPercent = test.best_score == null ? null : percent(test.best_score, test.total_points);
  const tone = bestPercent == null ? null : scoreToneClasses(bestPercent);
  const action = getAction(test);

  return (
    <article className="surface flex flex-col rounded-box p-5 transition hover:-translate-y-0.5 hover:border-primary/30">
      <div className="flex items-start gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand text-white">
          <BookOpen className="size-5" />
        </span>
        <div className="min-w-0">
          <h3 className="line-clamp-2 leading-snug font-semibold">{test.title}</h3>
          {test.description && (
            <p className="mt-1 line-clamp-2 text-sm text-base-content/60">{test.description}</p>
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5">
        <span className="badge gap-1 badge-ghost badge-sm">
          <ListChecks className="size-3.5" /> {test.question_count} savol
        </span>
        <span className="badge gap-1 badge-ghost badge-sm">
          <Clock className="size-3.5" />
          {formatMinutes(test.question_count * test.seconds_per_question)}
        </span>
        <span className="badge gap-1 badge-ghost badge-sm">
          <Star className="size-3.5" /> {test.total_points} ball
        </span>
      </div>

      <div className="mt-auto pt-5">
        {bestPercent == null ? (
          <p className="text-sm text-base-content/50">Hali ishlanmagan</p>
        ) : (
          <div>
            <div className="flex justify-between text-sm">
              <span className="text-base-content/60">Eng yaxshi natija</span>
              <span className={`font-semibold ${tone.text}`}>{bestPercent}%</span>
            </div>
            <progress className={`progress mt-1.5 h-1.5 ${tone.progress}`} value={bestPercent} max="100" />
          </div>
        )}

        <Link to={`/tests/${test.id}`} className={`btn mt-4 btn-block ${action.className}`}>
          <action.icon className="size-4" />
          {action.label}
        </Link>
      </div>
    </article>
  );
}

export default TestCard;
