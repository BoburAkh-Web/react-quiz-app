import { useEffect, useRef } from "react";
import { animate } from "motion/react";

// Qiymat o'zgarganda raqam yangi qiymatgacha sanab boradi (masalan: 70 → 80)
function AnimatedNumber({ value, duration = 0.5 }) {
  const elementRef = useRef(null);
  const displayedRef = useRef(0);

  useEffect(() => {
    // stop() unmount paytida ham onUpdate'ni chaqiradi, u paytda ref allaqachon null bo'ladi
    const element = elementRef.current;

    const controls = animate(displayedRef.current, value, {
      duration,
      ease: "easeOut",
      onUpdate(latest) {
        displayedRef.current = latest;
        element.textContent = Math.round(latest);
      },
    });
    return () => controls.stop();
  }, [value, duration]);

  return <span ref={elementRef}>0</span>;
}

export default AnimatedNumber;
