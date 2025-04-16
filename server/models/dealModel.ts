import Database from "better-sqlite3";

// Define the interface for a Deal object
interface Deal {
  id: number;
  account_id: number;
  value: number;
  status: 'build_proposal' | 'pitch_proposal' | 'negotiation' | 'awaiting_signoff' | 'signed' | 'cancelled' | 'lost';
  created_at: Date;
  updated_at: Date;
}

export const Deals = (db: Database.Database) => ({
  getAll: (): Deal[] => db.prepare("SELECT * FROM deals").all() as Deal[],

  getById: (id: number | BigInt): Deal | undefined =>
    db.prepare("SELECT * FROM deals WHERE id = ?").get(id) as Deal | undefined,

  create: (account_id: number | BigInt, value: number, status: Deal['status']) =>
    db
      .prepare("INSERT INTO deals (account_id, value, status) VALUES (?, ?, ?)")
      .run(account_id, value, status),

  update: (
    id: number | BigInt,
    accountId?: number | BigInt,
    value?: number,
    status?: Deal['status']
  ) => {
    const updates: string[] = [];
    const params: any[] = [];

    if (accountId !== undefined) {
      updates.push("account_id = ?");
      params.push(accountId);
    }
    if (value !== undefined) {
      updates.push("value = ?");
      params.push(value);
    }
    if (status !== undefined) {
      updates.push("status = ?");
      params.push(status);
    }

    if (updates.length === 0) {
      return { changes: 0, lastInsertRowid: 0 }; // No updates to perform
    }

    const sql = `
      UPDATE deals
      SET ${updates.join(", ")}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    params.push(id);

    return db.prepare(sql).run(...params);
  },

  delete: (id: number | BigInt) =>
    db.prepare("DELETE FROM deals WHERE id = ?").run(id),
});

export default Deals;
