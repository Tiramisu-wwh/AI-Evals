import { closeDatabase, createDatabaseContext } from "@/lib/db";

export function createTestDatabase() {
  return createDatabaseContext(":memory:");
}

export function disposeTestDatabase() {
  const db = createTestDatabase();
  closeDatabase(db);
}
