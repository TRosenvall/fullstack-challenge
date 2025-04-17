import Database from "better-sqlite3";

export interface Organization {
  id: number | BigInt;
  name: string;
  created_at: Date;
  updated_at: Date;
}

export const Organizations = (db: Database.Database) => ({
  getAll: (): Organization[] => db.prepare("SELECT * FROM organizations").all() as Organization[],

  getById: (id: number | BigInt): Organization =>
    db.prepare("SELECT * FROM organizations WHERE id = ?").get(id) as Organization,

  create: (name: string) =>
    db.prepare("INSERT INTO organizations (name) VALUES (?)").run(name),

  update: (id: number | BigInt, name: string) =>
    db
      .prepare(
        "UPDATE organizations SET name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
      )
      .run(name, id),

  delete: (id: number | BigInt) =>
    db.prepare("DELETE FROM organizations WHERE id = ?").run(id),
});

export default Organizations;

