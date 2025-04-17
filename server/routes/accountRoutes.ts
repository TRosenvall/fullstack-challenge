import { Request, Response, Router } from 'express';
import Database from 'better-sqlite3';
import { Accounts } from '../models/accountModel';

const router = Router();
let accountsModel: ReturnType<typeof Accounts>;

export default (db: Database.Database) => {
  accountsModel = Accounts(db);

  // GET all accounts
  router.get('/', async (req: Request, res: Response) => {
    try {
      const accounts = accountsModel.getAll();
      res.json(accounts);
    } catch (error) {
      console.error("Error fetching accounts:", error);
      res.status(500).json({ error: 'Failed to fetch accounts' });
    }
  });

  // GET a single account by ID
  router.get('/:id', async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid account ID' });
      return;
    }
    try {
      const account = accountsModel.getById(id);
      if (account) {
        res.json(account);
      } else {
        res.status(404).json({ error: 'Account not found' });
      }
    } catch (error) {
      console.error(`Error fetching account with ID ${id}:`, error);
      res.status(500).json({ error: 'Failed to fetch account' });
    }
  });

  // POST a new account
  router.post('/', async (req: Request, res: Response) => {
    const { name, organization_id } = req.body;

    if (!name || typeof name !== 'string') {
      res.status(400).json({ error: 'Account name is required' });
      return;
    }
    if (!organization_id || typeof organization_id !== 'number') {
      res.status(400).json({ error: 'Organization ID is required and must be a number' });
      return;
    }

    try {
      const result = accountsModel.create(name, organization_id);
      res.status(201).json({ id: result.lastInsertRowid, name, organization_id });
    } catch (error) {
      console.error("Error creating account:", error);
      res.status(500).json({ error: 'Failed to create account' });
    }
  });

  // PUT (update) an existing account
  router.put('/:id', async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const { name, organization_id } = req.body;

    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid account ID' });
      return;
    }

    if (name === undefined && organization_id === undefined) {
      res.status(400).json({ error: 'At least one field (name or organization_id) is required for update' });
      return;
    }

    if (organization_id !== undefined && typeof organization_id !== 'number') {
      res.status(400).json({ error: 'Organization ID must be a number' });
      return;
    }

    try {
      const result = accountsModel.update(id, name, organization_id);
      if (result.changes > 0) {
        res.json({ message: `Account with ID ${id} updated successfully` });
      } else {
        res.status(404).json({ error: 'Account not found or no changes made' });
      }
    } catch (error) {
      console.error(`Error updating account with ID ${id}:`, error);
      res.status(500).json({ error: 'Failed to update account' });
    }
  });

  // DELETE an account
  router.delete('/:id', async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid account ID' });
      return;
    }
    try {
      const result = accountsModel.delete(id);
      if (result.changes > 0) {
        res.status(204).send(); // 204 No Content for successful deletion
      } else {
        res.status(404).json({ error: 'Account not found' });
      }
    } catch (error) {
      console.error(`Error deleting account with ID ${id}:`, error);
      res.status(500).json({ error: 'Failed to delete account' });
    }
  });

  return router;
};