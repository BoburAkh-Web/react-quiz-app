import { formatClock } from "../../lib/utils";

const LOW_TIME_SECONDS = 30;

function QuizTimer({ secondsLeft, totalSeconds }) {
  const isLow = secondsLeft <= LOW_TIME_SECONDS;
  const value = totalSeconds > 0 ? (secondsLeft / totalSeconds) * 100 : 0;

  return (
    <div
      className={`flex shrink-0 items-center gap-2 pr-2 font-semibold tabular-nums ${
        isLow ? "animate-pulse text-error" : ""
      }`}
      role="timer"
      aria-label="Qolgan vaqt"
    >
      <span
        className={`radial-progress ${isLow ? "text-error" : "text-primary"}`}
        style={{ "--value": value, "--size": "2.25rem", "--thickness": "4px" }}
        aria-hidden="true"
      />
      {formatClock(secondsLeft)}
    </div>
  );
}

export default QuizTimer;
