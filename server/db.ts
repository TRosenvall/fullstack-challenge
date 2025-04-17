import Database from "better-sqlite3";

function initializeDatabase() {
  const isTestEnvironment = process.env.NODE_ENV === 'test';
  const dbPath = isTestEnvironment ? ':memory:' : "./database.sqlite";
  const db = new Database(dbPath);

  // Organization Model
  db.prepare(
    `
    CREATE TABLE IF NOT EXISTS organizations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `
  ).run();
  // Account Model
  db.prepare(
    `
    CREATE TABLE IF NOT EXISTS account (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      organization_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `
  ).run();
  // Deals Model
  db.prepare(
    `
    CREATE TABLE IF NOT EXISTS deals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      account_id INTEGER NOT NULL,
      value INTEGER NOT NULL,
      status TEXT NOT NULL CHECK ( status in (
          'build_proposal',
          'pitch_proposal',
          'negotiation',
          'awaiting_signoff',
          'signed',
          'cancelled',
          'lost'
      )),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `
  ).run();
  return db;
}

export default initializeDatabase;
