import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react-swc";
import postcss from "@tailwindcss/postcss";
import autoprefixer from "autoprefixer";
import type { AcceptedPlugin } from "postcss";

export default defineConfig({
  plugins: [react()],
  css: {
    postcss: {
      plugins: [postcss() as AcceptedPlugin, autoprefixer() as AcceptedPlugin],
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    globals: true,
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
  },
});
