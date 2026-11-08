import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    // Netlify'dagi "publish directory" sozlamasi o'zgarmasligi uchun
    outDir: "build",
    rolldownOptions: {
      output: {
        // Kutubxonalar alohida faylda: yangi deploydan keyin brauzer ularni keshdan oladi,
        // faqat o'zgargan ilova kodi qayta yuklanadi
        codeSplitting: {
          groups: [{ name: "vendor", test: /node_modules[\\/]/ }],
        },
      },
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.js"],
    // PGlite'dagi bcrypt (WASM) sekin ishlaydi
    testTimeout: 60000,
    hookTimeout: 60000,
  },
});
