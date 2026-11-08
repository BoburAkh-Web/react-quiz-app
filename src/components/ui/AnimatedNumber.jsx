import { useEffect, useRef } from "react";

const prefersReducedMotion = () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

// Qiymat o'zgarganda raqam yangi qiymatgacha sanab boradi (masalan: 70 → 80)
function AnimatedNumber({ value, duration = 0.5 }) {
  const elementRef = useRef(null);
  const displayedRef = useRef(0);

  useEffect(() => {
    const element = elementRef.current;
    const from = displayedRef.current;
    const startedAt = performance.now();
    let frame;

    function render(current) {
      displayedRef.current = current;
      element.textContent = Math.round(current);
    }

    if (prefersReducedMotion()) {
      render(value);
      return undefined;
    }

    function tick(now) {
      const progress = Math.min((now - startedAt) / (duration * 1000), 1);
      const eased = 1 - (1 - progress) ** 3;
      render(from + (value - from) * eased);
      if (progress < 1) frame = requestAnimationFrame(tick);
    }

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, duration]);

  return <span ref={elementRef}>0</span>;
}

export default AnimatedNumber;
