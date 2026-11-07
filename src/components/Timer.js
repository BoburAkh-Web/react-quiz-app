import { useEffect } from "react";

const LOW_TIME_SECONDS = 30;

function formatUnit(value) {
  return String(value).padStart(2, "0");
}

function Timer({ dispatch, secondsRemaining, totalSeconds }) {
  const mins = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const isLow = secondsRemaining <= LOW_TIME_SECONDS;

  useEffect(() => {
    const id = setInterval(() => {
      dispatch({ type: "tick" });
    }, 1000);
    return () => clearInterval(id);
  }, [dispatch]);

  return (
    <div className={`timer ${isLow ? "low" : ""}`}>
      <svg className="timer-ring" viewBox="0 0 40 40" aria-hidden="true">
        <circle className="timer-ring-track" cx="20" cy="20" r="16" />
        <circle
          className="timer-ring-value"
          cx="20"
          cy="20"
          r="16"
          pathLength="1"
          strokeDasharray="1"
          strokeDashoffset={1 - secondsRemaining / totalSeconds}
        />
      </svg>
      {formatUnit(mins)}:{formatUnit(seconds)}
    </div>
  );
}

export default Timer;
