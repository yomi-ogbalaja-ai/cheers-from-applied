import { unlinkSync } from "fs";

// Runs once before the whole test run. db-client.ts's local-dev fallback
// (used here since no DATABASE_URL/INSTANCE_CONNECTION_NAME is set in the
// test environment) persists to this fixed file, so tests from a previous
// run would otherwise leak into this one.
export default function setup() {
  try {
    unlinkSync("/tmp/cheers-dev.db");
  } catch {
    // no pre-existing file — fine
  }
}
