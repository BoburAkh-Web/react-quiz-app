import { motion } from "motion/react";
import { Star, Volume2, VolumeX } from "lucide-react";
import AnimatedNumber from "./AnimatedNumber";

function Progress({
  index,
  numQuestions,
  points,
  maxPossiblePoints,
  answer,
  isMuted,
  onToggleMuted,
}) {
  const completed = index + Number(answer !== null);
  const soundLabel = isMuted ? "Turn sound on" : "Turn sound off";

  return (
    <header className="progress">
      <div className="progress-row">
        <p>
          Question <strong>{index + 1}</strong> / {numQuestions}
        </p>

        <div className="progress-actions">
          <p className="progress-score">
            <Star />
            <strong>
              <AnimatedNumber value={points} />
            </strong>
            / {maxPossiblePoints}
          </p>

          <button
            type="button"
            className="sound-toggle"
            onClick={onToggleMuted}
            aria-label={soundLabel}
            title={soundLabel}
          >
            {isMuted ? <VolumeX /> : <Volume2 />}
          </button>
        </div>
      </div>

      <div
        className="progress-track"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={numQuestions}
        aria-valuenow={completed}
      >
        <motion.div
          className="progress-fill"
          initial={false}
          animate={{ scaleX: completed / numQuestions }}
          transition={{ type: "spring", stiffness: 120, damping: 20 }}
        />
      </div>
    </header>
  );
}

export default Progress;
