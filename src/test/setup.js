import "@testing-library/jest-dom/vitest";

// jsdom'da yo'q brauzer imkoniyatlari (faqat testlar uchun)
if (typeof window !== "undefined") {
  HTMLDialogElement.prototype.showModal ||= function showModal() {
    this.open = true;
  };
  HTMLDialogElement.prototype.close ||= function close() {
    this.open = false;
    this.dispatchEvent(new Event("close"));
  };
  window.matchMedia ||= () => ({
    matches: false,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
  });
  window.scrollTo = () => {};
  HTMLMediaElement.prototype.play = () => Promise.resolve();
}
