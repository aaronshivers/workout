import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react-swc";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    globals: true,
    // include: ["src/**/*.{test,spec}.{ts,tsx}"],
    coverage: {
      reportOnFailure: true,
      extension: [".ts", ".tsx"],
    },
    watch: false,
    dir: "src",
  },
});
