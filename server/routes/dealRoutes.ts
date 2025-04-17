import { Request, Response, Router } from 'express';
import Database from 'better-sqlite3';
import { Deals, Deal } from '../models/dealModel';

const router = Router();
let dealsModel: ReturnType<typeof Deals>;

export default (db: Database.Database) => {
  dealsModel = Deals(db);

  // GET all deals
  router.get('/', async (req: Request, res: Response) => {
    try {
      const deals = dealsModel.getAll();
      res.json(deals);
    } catch (error) {
      console.error("Error fetching deals:", error);
      res.status(500).json({ error: 'Failed to fetch deals' });
    }
  });

  // GET a single deal by ID
  router.get('/:id', async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid deal ID' });
      return;
    }
    try {
      const deal = dealsModel.getById(id);
      if (deal) {
        res.json(deal);
      } else {
        res.status(404).json({ error: 'Deal not found' });
      }
    } catch (error) {
      console.error(`Error fetching deal with ID ${id}:`, error);
      res.status(500).json({ error: 'Failed to fetch deal' });
    }
  });

  // POST a new deal
  router.post('/', async (req: Request, res: Response) => {
    const { account_id, value, status } = req.body;

    if (!account_id || typeof account_id !== 'number') {
      res.status(400).json({ error: 'Account ID is required and must be a number' });
      return;
    }
    if (!value || typeof value !== 'number') {
      res.status(400).json({ error: 'Deal value is required and must be a number' });
      return;
    }

    const allowedStatuses: Deal['status'][] = ['build_proposal', 'pitch_proposal', 'negotiation', 'awaiting_signoff', 'signed', 'cancelled', 'lost'];

    if (!status || typeof status !== 'string' || !allowedStatuses.includes(status as Deal['status'])) {
      res.status(400).json({ error: `Deal status is required and must be one of: ${allowedStatuses.join(', ')}` });
      return;
    }

    try {
      const result = dealsModel.create(
        account_id,
        value,
        status as Deal['status'] // Still need assertion here after validation
      );
      res.status(201).json({ id: result.lastInsertRowid, account_id, value, status });
    } catch (error) {
      console.error("Error creating deal:", error);
      res.status(500).json({ error: 'Failed to create deal' });
    }
  });

  // PUT (update) an existing deal
  router.put('/:id', async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const { account_id, value, status } = req.body;

    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid deal ID' });
      return;
    }

    if (account_id === undefined && value === undefined && status === undefined) {
      res.status(400).json({ error: 'At least one field (account_id, value, or status) is required for update' });
      return;
    }

    if (account_id !== undefined && typeof account_id !== 'number') {
      res.status(400).json({ error: 'Account ID must be a number' });
      return;
    }
    if (value !== undefined && typeof value !== 'number') {
      res.status(400).json({ error: 'Deal value must be a number' });
      return;
    }
    if (status !== undefined && (typeof status !== 'string' || !['build_proposal', 'pitch_proposal', 'negotiation', 'awaiting_signoff', 'signed', 'cancelled', 'lost'].includes(status))) {
      res.status(400).json({ error: 'Deal status must be one of: build_proposal, pitch_proposal, negotiation, awaiting_signoff, signed, cancelled, lost' });
      return;
    }

    try {
      const result = dealsModel.update(id, account_id, value, status);
      if (result.changes > 0) {
        res.json({ message: `Deal with ID ${id} updated successfully` });
      } else {
        res.status(404).json({ error: 'Deal not found or no changes made' });
      }
    } catch (error) {
      console.error(`Error updating deal with ID ${id}:`, error);
      res.status(500).json({ error: 'Failed to update deal' });
    }
  });

  // DELETE a deal
  router.delete('/:id', async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid deal ID' });
      return;
    }
    try {
      const result = dealsModel.delete(id);
      if (result.changes > 0) {
        res.status(204).send(); // 204 No Content for successful deletion
      } else {
        res.status(404).json({ error: 'Deal not found' });
      }
    } catch (error) {
      console.error(`Error deleting deal with ID ${id}:`, error);
      res.status(500).json({ error: 'Failed to delete deal' });
    }
  });

  return router;
};