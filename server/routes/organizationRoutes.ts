import { Request, Response, Router } from 'express';
import Database from 'better-sqlite3';
import { Organizations } from '../models/organizationModel';

const router = Router();
let organizationsModel: ReturnType<typeof Organizations>;

export default (db: Database.Database) => {
  organizationsModel = Organizations(db);

  // GET all organizations
  router.get('/', (req: Request, res: Response) => {
    try {
      const organizations = organizationsModel.getAll();
      res.json(organizations);
    } catch (error) {
      console.error("Error fetching organizations:", error);
      res.status(500).json({ error: 'Failed to fetch organizations' });
    }
  });

  // GET a single organization by ID
  router.get('/:id', (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid organization ID' });
      return 
    }
    try {
      const organization = organizationsModel.getById(id);
      if (organization) {
        res.json(organization);
      } else {
        res.status(404).json({ error: 'Organization not found' });
      }
    } catch (error) {
      console.error(`Error fetching organization with ID ${id}:`, error);
      res.status(500).json({ error: 'Failed to fetch organization' });
    }
  });

  // POST a new organization
  router.post('/', (req: Request, res: Response) => {
    const { name } = req.body;
    if (!name || typeof name !== 'string') {
      res.status(400).json({ error: 'Organization name is required' });
      return
    }
    try {
      const result = organizationsModel.create(name);
      res.status(201).json({ id: result.lastInsertRowid, name });
    } catch (error) {
      console.error("Error creating organization:", error);
      res.status(500).json({ error: 'Failed to create organization' });
    }
  });

  // PUT (update) an existing organization
  router.put('/:id', (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const { name } = req.body;
    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid organization ID' });
      return 
    }
    if (!name || typeof name !== 'string') {
      res.status(400).json({ error: 'Organization name is required for update' });
      return
    }
    try {
      const result = organizationsModel.update(id, name);
      if (result.changes > 0) {
        res.json({ message: `Organization with ID ${id} updated successfully` });
      } else {
        res.status(404).json({ error: 'Organization not found or no changes made' });
      }
    } catch (error) {
      console.error(`Error updating organization with ID ${id}:`, error);
      res.status(500).json({ error: 'Failed to update organization' });
    }
  });

  // DELETE an organization
  router.delete('/:id', (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid organization ID' });
      return
    }
    try {
      const result = organizationsModel.delete(id);
      if (result.changes > 0) {
        res.status(204).send(); // 204 No Content for successful deletion
      } else {
        res.status(404).json({ error: 'Organization not found' });
      }
    } catch (error) {
      console.error(`Error deleting organization with ID ${id}:`, error);
      res.status(500).json({ error: 'Failed to delete organization' });
    }
  });

  return router
};