import { useState } from "react";

function read(key, fallback) {
  try {
    const stored = localStorage.getItem(key);
    return stored === null ? fallback : JSON.parse(stored);
  } catch {
    return fallback;
  }
}

// Kichik sozlamalar uchun (masalan, ovoz o'chirilganmi). Saqlab bo'lmasa ham ilova ishlayveradi.
export function useLocalStorageState(key, fallback) {
  const [value, setValue] = useState(() => read(key, fallback));

  function update(nextValue) {
    setValue(nextValue);
    try {
      localStorage.setItem(key, JSON.stringify(nextValue));
    } catch {
      // Maxfiy rejimda localStorage yopiq bo'lishi mumkin
    }
  }

  return [value, update];
}
