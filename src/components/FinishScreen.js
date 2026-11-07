import { useEffect } from "react";
import { motion } from "motion/react";
import { RotateCcw } from "lucide-react";
import confetti from "canvas-confetti";
import AnimatedNumber from "./AnimatedNumber";

const GAUGE_SECONDS = 1.2;
const CONFETTI_MIN_PERCENTAGE = 80;

function getResult(percentage) {
  if (percentage === 100) return { emoji: "🥇", title: "Perfect score!" };
  if (percentage >= 80) return { emoji: "🎉", title: "Great job!" };
  if (percentage >= 50) return { emoji: "🙃", title: "Good effort!" };
  if (percentage > 0) return { emoji: "🤨", title: "Keep practicing!" };
  return { emoji: "🤦‍♂️", title: "Let's try again!" };
}

function FinishScreen({
  points,
  maxPossiblePoints,
  highscore,
  correctCount,
  wrongCount,
  dispatch,
}) {
  const percentage = (points / maxPossiblePoints) * 100;
  const { emoji, title } = getResult(percentage);

  // 100% natijaga uch tomondan salyut, 80% dan yuqorisiga bitta
  useEffect(() => {
    if (percentage < CONFETTI_MIN_PERCENTAGE) return;

    const originsX = percentage === 100 ? [0.2, 0.8, 0.5] : [0.5];
    const timers = originsX.map((x, i) =>
      setTimeout(() => {
        confetti({
          particleCount: 90,
          spread: 80,
          origin: { x, y: 0.6 },
          disableForReducedMotion: true,
        });
      }, i * 250),
    );
    return () => timers.forEach(clearTimeout);
  }, [percentage]);

  return (
    <motion.div
      className="finish quiz-card"
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <div className="gauge">
        <svg viewBox="0 0 120 120" aria-hidden="true">
          <defs>
            <linearGradient id="gauge-gradient" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" />
              <stop offset="100%" />
            </linearGradient>
          </defs>
          <circle className="gauge-track" cx="60" cy="60" r="52" />
          <motion.circle
            cx="60"
            cy="60"
            r="52"
            stroke="url(#gauge-gradient)"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: percentage / 100 }}
            transition={{ duration: GAUGE_SECONDS, ease: "easeOut" }}
          />
        </svg>
        <p className="gauge-label">
          <AnimatedNumber
            value={Math.ceil(percentage)}
            duration={GAUGE_SECONDS}
          />
          %
        </p>
      </div>

      <p className="finish-title">
        {emoji} {title}
      </p>
      <p className="finish-score">
        You scored <strong>{points}</strong> out of {maxPossiblePoints}
      </p>

      <ul className="finish-stats">
        <li className="finish-stat correct">
          <strong>{correctCount}</strong>
          Correct
        </li>
        <li className="finish-stat wrong">
          <strong>{wrongCount}</strong>
          Wrong
        </li>
        <li className="finish-stat best">
          <strong>{Math.max(points, highscore)}</strong>
          Highscore
        </li>
      </ul>

      <motion.button
        className="btn btn-ui"
        whileTap={{ scale: 0.97 }}
        onClick={() => dispatch({ type: "reset" })}
      >
        <RotateCcw />
        Restart
      </motion.button>
    </motion.div>
  );
}

export default FinishScreen;
