import fs from "node:fs";
import path from "node:path";
import { DatabaseSync, type StatementSync } from "node:sqlite";

import bcrypt from "bcryptjs";

import { DEFAULT_USERS } from "@/lib/constants";

export type DatabaseContext = {
  sqlite: DatabaseSync;
};

const DB_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DB_DIR, "app.db");

let singletonDb: DatabaseContext | null = null;

function run(context: DatabaseContext, sql: string) {
  context.sqlite.exec(sql);
}

function prepare(context: DatabaseContext, sql: string): StatementSync {
  return context.sqlite.prepare(sql);
}

function ensureSchema(context: DatabaseContext) {
  run(
    context,
    `
      PRAGMA foreign_keys = ON;

      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS submissions (
        id TEXT PRIMARY KEY,
        summary TEXT NOT NULL,
        system_type TEXT NOT NULL,
        scoring_rubric TEXT NOT NULL,
        status TEXT NOT NULL,
        created_by TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY(created_by) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS golden_samples (
        id TEXT PRIMARY KEY,
        submission_id TEXT NOT NULL,
        input TEXT NOT NULL,
        expected_output TEXT NOT NULL,
        note TEXT NOT NULL,
        sort_order INTEGER NOT NULL,
        FOREIGN KEY(submission_id) REFERENCES submissions(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS candidate_samples (
        id TEXT PRIMARY KEY,
        submission_id TEXT NOT NULL,
        input TEXT NOT NULL,
        actual_output TEXT NOT NULL,
        note TEXT NOT NULL,
        sort_order INTEGER NOT NULL,
        FOREIGN KEY(submission_id) REFERENCES submissions(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS submission_attachments (
        id TEXT PRIMARY KEY,
        submission_id TEXT,
        original_name TEXT NOT NULL,
        stored_path TEXT NOT NULL,
        mime_type TEXT NOT NULL,
        size INTEGER NOT NULL,
        uploaded_by TEXT NOT NULL,
        uploaded_at TEXT NOT NULL,
        FOREIGN KEY(submission_id) REFERENCES submissions(id) ON DELETE CASCADE,
        FOREIGN KEY(uploaded_by) REFERENCES users(id)
      );
    `,
  );
}

function seedUsers(context: DatabaseContext) {
  const statement = prepare(
    context,
    `
      INSERT OR IGNORE INTO users (id, username, password_hash, role, created_at)
      VALUES (?, ?, ?, ?, ?)
    `,
  );

  const now = new Date().toISOString();

  DEFAULT_USERS.forEach((user) => {
    statement.run(
      user.id,
      user.username,
      bcrypt.hashSync(user.password, 10),
      user.role,
      now,
    );
  });
}

export function createDatabaseContext(filename = DB_PATH): DatabaseContext {
  if (filename !== ":memory:") {
    fs.mkdirSync(path.dirname(filename), { recursive: true });
  }

  const sqlite = new DatabaseSync(filename);
  const context = { sqlite };

  ensureSchema(context);
  seedUsers(context);

  return context;
}

export function getDb() {
  singletonDb ??= createDatabaseContext();
  return singletonDb;
}

export function closeDatabase(context: DatabaseContext) {
  context.sqlite.close();
}
