import Database from "better-sqlite3";

// In your accountModel.ts or a separate types file (e.g., types/account.d.ts)
export interface Account {
  id: number | BigInt;
  name: string;
  organization_id: number;
  created_at: Date;
  updated_at: Date;
}

export const Accounts = (db: Database.Database) => ({
  getAll: (): Account[] => db.prepare("SELECT * FROM account").all() as Account[],

  getById: (id: number | BigInt): Account =>
    db.prepare("SELECT * FROM account WHERE id = ?").get(id) as Account,

  create: (name: string, organization_id: number | BigInt) =>
    db
      .prepare("INSERT INTO account (name, organization_id) VALUES (?, ?)")
      .run(name, organization_id),

  update: (id: number | BigInt, name?: string, organization_id?: number | BigInt) => {
    const updates: string[] = [];
    const params: any[] = [];

    if (name !== undefined) {
      updates.push("name = ?");
      params.push(name);
    }
    if (organization_id !== undefined) {
      updates.push("organization_id = ?");
      params.push(organization_id);
    }

    if (updates.length === 0) {
      return { changes: 0, lastInsertRowid: 0 }; // No updates to perform
    }

    const sql = `
      UPDATE account
      SET ${updates.join(", ")}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    params.push(id);

    return db.prepare(sql).run(...params);
  },

  delete: (id: number | BigInt) =>
    db.prepare("DELETE FROM account WHERE id = ?").run(id),
});

export default Accounts;