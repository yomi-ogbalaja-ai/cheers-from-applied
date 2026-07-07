import { defineConfig } from "vitest/config";
import path from "path";

// Tests exercise API route handlers against the real db-client, which falls
// back to an ephemeral local SQLite file when no DATABASE_URL/Cloud SQL env
// vars are set (see src/lib/db-client.ts) — never production Postgres.
// fileParallelism is off so tests share that one file safely; see
// src/test/globalSetup.ts, which wipes it once before the whole run.
export default defineConfig({
  test: {
    environment: "node",
    fileParallelism: false,
    globalSetup: ["./src/test/globalSetup.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
