import { m } from "motion/react";
import AnimatedNumber from "./AnimatedNumber";

const DURATION = 1.2;

function ScoreGauge({ value }) {
  return (
    <div className="relative mx-auto size-40 sm:size-48">
      <svg viewBox="0 0 120 120" className="size-full -rotate-90" aria-hidden="true">
        <defs>
          <linearGradient id="score-gauge-gradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" style={{ stopColor: "var(--color-primary)" }} />
            <stop offset="100%" style={{ stopColor: "var(--color-secondary)" }} />
          </linearGradient>
        </defs>
        <circle cx="60" cy="60" r="52" fill="none" strokeWidth="10" className="stroke-white/10" />
        <m.circle
          cx="60"
          cy="60"
          r="52"
          fill="none"
          strokeWidth="10"
          strokeLinecap="round"
          stroke="url(#score-gauge-gradient)"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: value / 100 }}
          transition={{ duration: DURATION, ease: "easeOut" }}
        />
      </svg>
      <p className="absolute inset-0 flex items-center justify-center text-4xl font-extrabold tabular-nums">
        <AnimatedNumber value={value} duration={DURATION} />%
      </p>
    </div>
  );
}

export default ScoreGauge;
