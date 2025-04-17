import request from 'supertest';
import express, { Express } from 'express';
import initializeDatabase from '../db';
import OrganizationRoutes from './organizationRoutes';
import { Organizations } from '../models/organizationModel';

const db = initializeDatabase();
const organizationsModel = Organizations(db); // You might still need this for direct model testing

const app: Express = express();
app.use(express.json());
app.use('/organizations', OrganizationRoutes(db)); // Inject the in-memory db

describe('Organization API Endpoints', () => {
  beforeEach(() => {
    // Re-create the organizations table before each test to ensure a clean state
    db.exec(`
      DROP TABLE IF EXISTS organizations;
      CREATE TABLE IF NOT EXISTS organizations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
  });

  afterAll(() => {
    // Close the database connection after all tests
    db.close();
  });

  describe('GET /organizations', () => {
    it('should return an empty array if no organizations exist', async () => {
      const res = await request(app).get('/organizations');
      expect(res.statusCode).toEqual(200);
      expect(res.body).toEqual([]);
    });

    it('should return a list of organizations', async () => {
      organizationsModel.create('Org 1');
      organizationsModel.create('Org 2');

      const res = await request(app).get('/organizations');
      expect(res.statusCode).toEqual(200);
      expect(res.body.length).toEqual(2);
      expect(res.body[0].name).toEqual('Org 1');
      expect(res.body[1].name).toEqual('Org 2');
      expect(res.body[0].id).toBeDefined();
      expect(res.body[1].id).toBeDefined();
      expect(res.body[0].created_at).toBeDefined();
      expect(res.body[0].updated_at).toBeDefined();
    });
  });

  describe('GET /organizations/:id', () => {
    it('should return a specific organization by ID', async () => {
      const createResult = organizationsModel.create('Test Org');
      const orgId = createResult.lastInsertRowid;

      const res = await request(app).get(`/organizations/${orgId}`);
      expect(res.statusCode).toEqual(200);
      expect(res.body).toBeDefined();
      expect(res.body.id).toEqual(orgId);
      expect(res.body.name).toEqual('Test Org');
      expect(res.body.created_at).toBeDefined();
      expect(res.body.updated_at).toBeDefined();
    });

    it('should return 404 if the organization ID does not exist', async () => {
      const res = await request(app).get('/organizations/999');
      expect(res.statusCode).toEqual(404);
      expect(res.body).toEqual({ error: 'Organization not found' });
    });

    it('should return 400 if the organization ID is invalid', async () => {
      const res = await request(app).get('/organizations/abc');
      expect(res.statusCode).toEqual(400);
      expect(res.body).toEqual({ error: 'Invalid organization ID' });
    });
  });

  describe('POST /organizations', () => {
    it('should create a new organization', async () => {
      const newOrg = { name: 'New Organization' };
      const res = await request(app)
        .post('/organizations')
        .send(newOrg);

      expect(res.statusCode).toEqual(201);
      expect(res.body).toBeDefined();
      expect(res.body.id).toBeDefined();
      expect(res.body.name).toEqual(newOrg.name);

      const retrievedOrg = organizationsModel.getById(res.body.id);
      expect(retrievedOrg).toBeDefined();
      expect(retrievedOrg?.name).toEqual(newOrg.name);
    });

    it('should return 400 if the organization name is missing', async () => {
      const res = await request(app)
        .post('/organizations')
        .send({});

      expect(res.statusCode).toEqual(400);
      expect(res.body).toEqual({ error: 'Organization name is required' });
    });

    it('should return 400 if the organization name is not a string', async () => {
      const res = await request(app)
        .post('/organizations')
        .send({ name: 123 });

      expect(res.statusCode).toEqual(400);
      expect(res.body).toEqual({ error: 'Organization name is required' });
    });
  });

  describe('PUT /organizations/:id', () => {
    it('should update an existing organization', async () => {
      const createResult = organizationsModel.create('Old Name');
      const orgId = createResult.lastInsertRowid;
      const updatedOrg = { name: 'Updated Name' };

      const res = await request(app)
        .put(`/organizations/${orgId}`)
        .send(updatedOrg);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toEqual({ message: `Organization with ID ${orgId} updated successfully` });

      const retrievedOrg = organizationsModel.getById(orgId);
      expect(retrievedOrg).toBeDefined();
      expect(retrievedOrg?.name).toEqual(updatedOrg.name);
    });

    it('should return 404 if the organization ID to update does not exist', async () => {
      const updatedOrg = { name: 'Updated Name' };
      const res = await request(app)
        .put('/organizations/999')
        .send(updatedOrg);

      expect(res.statusCode).toEqual(404);
      expect(res.body).toEqual({ error: 'Organization not found or no changes made' });
    });

    it('should return 400 if the organization ID for update is invalid', async () => {
      const updatedOrg = { name: 'Updated Name' };
      const res = await request(app)
        .put('/organizations/abc')
        .send(updatedOrg);

      expect(res.statusCode).toEqual(400);
      expect(res.body).toEqual({ error: 'Invalid organization ID' });
    });

    it('should return 400 if the organization name is missing for update', async () => {
      const createResult = organizationsModel.create('Old Name');
      const orgId = createResult.lastInsertRowid;
      const res = await request(app)
        .put(`/organizations/${orgId}`)
        .send({});

      expect(res.statusCode).toEqual(400);
      expect(res.body).toEqual({ error: 'Organization name is required for update' });
    });

    it('should return 400 if the organization name is not a string for update', async () => {
      const createResult = organizationsModel.create('Old Name');
      const orgId = createResult.lastInsertRowid;
      const res = await request(app)
        .put(`/organizations/${orgId}`)
        .send({ name: 123 });

      expect(res.statusCode).toEqual(400);
      expect(res.body).toEqual({ error: 'Organization name is required for update' });
    });
  });

  describe('DELETE /organizations/:id', () => {
    it('should delete an existing organization', async () => {
      const createResult = organizationsModel.create('To Be Deleted');
      const orgId = createResult.lastInsertRowid;

      const res = await request(app).delete(`/organizations/${orgId}`);
      expect(res.statusCode).toEqual(204);
      expect(res.body).toEqual({}); // 204 No Content has no body

      const retrievedOrg = organizationsModel.getById(orgId);
      expect(retrievedOrg).toBeUndefined();
    });

    it('should return 404 if the organization ID to delete does not exist', async () => {
      const res = await request(app).delete('/organizations/999');
      expect(res.statusCode).toEqual(404);
      expect(res.body).toEqual({ error: 'Organization not found' });
    });

    it('should return 400 if the organization ID for deletion is invalid', async () => {
      const res = await request(app).delete('/organizations/abc');
      expect(res.statusCode).toEqual(400);
      expect(res.body).toEqual({ error: 'Invalid organization ID' });
    });
  });
});