import Database from "better-sqlite3";

interface Organization {
  id: number;
  name: string;
  created_at: string; // Or Date if you handle dates as Date objects
  updated_at: string; // Or Date if you handle dates as Date objects
}

export const Organizations = (db: any) => ({
  getAll: (): Organization[] => db.prepare("SELECT * FROM organizations").all(),

  getById: (id: number): Organization =>
    db.prepare("SELECT * FROM organizations WHERE id = ?").get(id),

  create: (name: string) =>
    db.prepare("INSERT INTO organizations (name) VALUES (?)").run(name),

  update: (id: number, name: string) =>
    db
      .prepare(
        "UPDATE organizations SET name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
      )
      .run(name, id),

  delete: (id: number) =>
    db.prepare("DELETE FROM organizations WHERE id = ?").run(id),
});

export default Organizations;

