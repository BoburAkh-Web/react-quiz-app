import { m } from "motion/react";
import { Star, Volume2, VolumeX } from "lucide-react";
import AnimatedNumber from "../ui/AnimatedNumber";

function QuizHeader({ title, index, total, answeredCount, score, maxScore, isMuted, onToggleMuted }) {
  const soundLabel = isMuted ? "Ovozni yoqish" : "Ovozni o'chirish";

  return (
    <div className="surface rounded-box p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs tracking-wide text-base-content/50 uppercase">{title}</p>
          <p className="font-semibold">
            Savol {index + 1} <span className="text-base-content/50">/ {total}</span>
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <span className="badge gap-1 font-semibold tabular-nums badge-soft badge-accent">
            <Star className="size-3.5 fill-current" />
            <AnimatedNumber value={score} /> / {maxScore}
          </span>
          <button
            type="button"
            className="btn btn-circle btn-ghost btn-sm"
            onClick={onToggleMuted}
            aria-label={soundLabel}
            title={soundLabel}
          >
            {isMuted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
          </button>
        </div>
      </div>

      <div
        className="mt-3 h-2 overflow-hidden rounded-full bg-white/10"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={answeredCount}
      >
        <m.div
          className="h-full origin-left rounded-full bg-brand"
          initial={false}
          animate={{ scaleX: answeredCount / total }}
          transition={{ type: "spring", stiffness: 120, damping: 20 }}
        />
      </div>
    </div>
  );
}

export default QuizHeader;
