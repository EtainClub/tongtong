import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    // tests/는 에뮬레이터가 있을 때만 돈다 (pnpm test:emulator). 없으면 스스로 건너뛴다.
    include: ["src/**/*.test.ts", "tests/**/*.test.ts"],
  },
});
