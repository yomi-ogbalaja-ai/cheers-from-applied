// Seed is handled automatically in db.ts when boards table is empty.
// This file exports seedAll() for manual use via `npm run seed`.
import { getDb } from "./db";

export function seedAll() {
  // Calling getDb() triggers initSchema which seeds if empty
  const db = getDb();
  const count = (db.prepare("SELECT COUNT(*) as c FROM boards").get() as { c: number }).c;
  console.log(`Seed check: ${count} boards in DB.`);
}

seedAll();
