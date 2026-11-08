import { useEffect, useRef, useState } from "react";

// Berilgan vaqtgacha qolgan soniyalar. Vaqt tugaganda onExpire bir marta chaqiriladi.
export function useCountdown(endsAt, onExpire) {
  const [now, setNow] = useState(() => Date.now());
  const onExpireRef = useRef(onExpire);

  useEffect(() => {
    onExpireRef.current = onExpire;
  });

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, []);

  const secondsLeft = Math.max(0, (endsAt - now) / 1000);
  const isExpired = secondsLeft === 0;

  useEffect(() => {
    if (isExpired) onExpireRef.current();
  }, [isExpired]);

  return secondsLeft;
}
