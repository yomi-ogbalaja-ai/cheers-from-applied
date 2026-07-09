import { unlinkSync } from "fs";

// Runs once before the whole test run. db-client.ts's fallback (used here
// since no DATABASE_URL/INSTANCE_CONNECTION_NAME is set in the test
// environment) detects process.env.VITEST and persists to this dedicated
// file — separate from the interactive `npm run dev` database at
// .local/cheers-dev.db — so tests from a previous run would otherwise leak
// into this one, and so running tests can never pollute or wipe real local
// dev data.
export default function setup() {
  try {
    unlinkSync("/tmp/cheers-test.db");
  } catch {
    // no pre-existing file — fine
  }
}
