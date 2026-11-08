import confetti from "canvas-confetti";
import correctSound from "../assets/sounds/correct.mp3";
import wrongSound from "../assets/sounds/wrong.mp3";

function playSound(src) {
  // Brauzer ovozni bloklasa, test baribir davom etadi
  new Audio(src).play().catch(() => {});
}

export function playAnswerFeedback({ isCorrect, isMuted }) {
  if (!isMuted) playSound(isCorrect ? correctSound : wrongSound);

  if (isCorrect) {
    confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 }, disableForReducedMotion: true });
  } else {
    navigator.vibrate?.(150);
  }
}

// 100% natijaga uch tomondan salyut, 80% dan yuqorisiga bitta
export function celebrateResult(scorePercent) {
  if (scorePercent < 80) return () => {};

  const originsX = scorePercent === 100 ? [0.2, 0.8, 0.5] : [0.5];
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
}
