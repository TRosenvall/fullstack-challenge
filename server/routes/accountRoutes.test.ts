import request from 'supertest';
import express, { Express } from 'express';
import initializeDatabase from '../db';
import AccountRoutes from './accountRoutes';
import { Accounts } from '../models/accountModel';
import { Organizations } from '../models/organizationModel';

const db = initializeDatabase();
const accountsModel = Accounts(db);
const organizationsModel = Organizations(db);

const app: Express = express();
app.use(express.json());
app.use('/accounts', AccountRoutes(db));

describe('Account API Endpoints', () => {
  let organizationId: number;

  beforeEach(async () => {
    // Re-create the tables and insert a test organization before each test
    db.exec(`
      DROP TABLE IF EXISTS account;
      DROP TABLE IF EXISTS organizations;
      CREATE TABLE IF NOT EXISTS organizations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS account (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        organization_id INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (organization_id) REFERENCES organizations(id)
      );
    `);
    const orgResult = organizationsModel.create('Test Organization');
    organizationId = orgResult.lastInsertRowid as number;
  });

  afterAll(() => {
    db.close();
  });

  describe('GET /accounts', () => {
    it('should return an empty array if no accounts exist', async () => {
      const res = await request(app).get('/accounts');
      expect(res.statusCode).toEqual(200);
      expect(res.body).toEqual([]);
    });

    it('should return a list of accounts', async () => {
      accountsModel.create('Account 1', organizationId);
      accountsModel.create('Account 2', organizationId);

      const res = await request(app).get('/accounts');
      expect(res.statusCode).toEqual(200);
      expect(res.body.length).toEqual(2);
      expect(res.body[0].name).toEqual('Account 1');
      expect(res.body[0].organization_id).toEqual(organizationId);
      expect(res.body[0].id).toBeDefined();
      expect(res.body[0].created_at).toBeDefined();
      expect(res.body[0].updated_at).toBeDefined();
      expect(res.body[1].name).toEqual('Account 2');
      expect(res.body[1].organization_id).toEqual(organizationId);
      expect(res.body[1].id).toBeDefined();
      expect(res.body[1].created_at).toBeDefined();
      expect(res.body[1].updated_at).toBeDefined();
    });
  });

  describe('GET /accounts/:id', () => {
    it('should return a specific account by ID', async () => {
      const createResult = accountsModel.create('Test Account', organizationId);
      const accountId = createResult.lastInsertRowid;

      const res = await request(app).get(`/accounts/${accountId}`);
      expect(res.statusCode).toEqual(200);
      expect(res.body).toBeDefined();
      expect(res.body.id).toEqual(accountId);
      expect(res.body.name).toEqual('Test Account');
      expect(res.body.organization_id).toEqual(organizationId);
      expect(res.body.created_at).toBeDefined();
      expect(res.body.updated_at).toBeDefined();
    });

    it('should return 404 if the account ID does not exist', async () => {
      const res = await request(app).get('/accounts/999');
      expect(res.statusCode).toEqual(404);
      expect(res.body).toEqual({ error: 'Account not found' });
    });

    it('should return 400 if the account ID is invalid', async () => {
      const res = await request(app).get('/accounts/abc');
      expect(res.statusCode).toEqual(400);
      expect(res.body).toEqual({ error: 'Invalid account ID' });
    });
  });

  describe('POST /accounts', () => {
    it('should create a new account', async () => {
      const newAccount = { name: 'New Account', organization_id: organizationId };
      const res = await request(app)
        .post('/accounts')
        .send(newAccount);

      expect(res.statusCode).toEqual(201);
      expect(res.body).toBeDefined();
      expect(res.body.id).toBeDefined();
      expect(res.body.name).toEqual(newAccount.name);
      expect(res.body.organization_id).toEqual(newAccount.organization_id);

      const retrievedAccount = accountsModel.getById(res.body.id);
      expect(retrievedAccount).toBeDefined();
      expect(retrievedAccount?.name).toEqual(newAccount.name);
      expect(retrievedAccount?.organization_id).toEqual(newAccount.organization_id);
    });

    it('should return 400 if the account name is missing', async () => {
      const res = await request(app)
        .post('/accounts')
        .send({ organization_id: organizationId });

      expect(res.statusCode).toEqual(400);
      expect(res.body).toEqual({ error: 'Account name is required' });
    });

    it('should return 400 if the organization ID is missing', async () => {
      const res = await request(app)
        .post('/accounts')
        .send({ name: 'Missing Org ID' });

      expect(res.statusCode).toEqual(400);
      expect(res.body).toEqual({ error: 'Organization ID is required and must be a number' });
    });

    it('should return 400 if the organization ID is not a number', async () => {
      const res = await request(app)
        .post('/accounts')
        .send({ name: 'Invalid Org ID', organization_id: 'abc' });

      expect(res.statusCode).toEqual(400);
      expect(res.body).toEqual({ error: 'Organization ID is required and must be a number' });
    });

    it('should return 400 if the account name is not a string', async () => {
      const res = await request(app)
        .post('/accounts')
        .send({ name: 123, organization_id: organizationId });

      expect(res.statusCode).toEqual(400);
      expect(res.body).toEqual({ error: 'Account name is required' });
    });
  });

  describe('PUT /accounts/:id', () => {
    let accountIdToUpdate: number | bigint;
    beforeEach(async () => {
      const createResult = accountsModel.create('Initial Account', organizationId);
      accountIdToUpdate = createResult.lastInsertRowid;
    });

    it('should update an existing account name', async () => {
      const updatedAccount = { name: 'Updated Account Name' };
      const res = await request(app)
        .put(`/accounts/${accountIdToUpdate}`)
        .send(updatedAccount);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toEqual({ message: `Account with ID ${accountIdToUpdate} updated successfully` });

      const retrievedAccount = accountsModel.getById(accountIdToUpdate);
      expect(retrievedAccount).toBeDefined();
      expect(retrievedAccount?.name).toEqual(updatedAccount.name);
      expect(retrievedAccount?.organization_id).toEqual(organizationId);
    });

    it('should update an existing account organization ID', async () => {
      const newOrgResult = organizationsModel.create('New Organization');
      const newOrganizationId = newOrgResult.lastInsertRowid as number;
      const updatedAccount = { organization_id: newOrganizationId };
      const res = await request(app)
        .put(`/accounts/${accountIdToUpdate}`)
        .send(updatedAccount);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toEqual({ message: `Account with ID ${accountIdToUpdate} updated successfully` });

      const retrievedAccount = accountsModel.getById(accountIdToUpdate);
      expect(retrievedAccount).toBeDefined();
      expect(retrievedAccount?.name).toEqual('Initial Account');
      expect(retrievedAccount?.organization_id).toEqual(newOrganizationId);
    });

    it('should update both account name and organization ID', async () => {
      const newOrgResult = organizationsModel.create('Another New Org');
      const newOrganizationId = newOrgResult.lastInsertRowid as number;
      const updatedAccount = { name: 'Updated Name and Org', organization_id: newOrganizationId };
      const res = await request(app)
        .put(`/accounts/${accountIdToUpdate}`)
        .send(updatedAccount);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toEqual({ message: `Account with ID ${accountIdToUpdate} updated successfully` });

      const retrievedAccount = accountsModel.getById(accountIdToUpdate);
      expect(retrievedAccount).toBeDefined();
      expect(retrievedAccount?.name).toEqual(updatedAccount.name);
      expect(retrievedAccount?.organization_id).toEqual(updatedAccount.organization_id);
    });

    it('should return 404 if the account ID to update does not exist', async () => {
      const updatedAccount = { name: 'Updated Name' };
      const res = await request(app)
        .put('/accounts/999')
        .send(updatedAccount);

      expect(res.statusCode).toEqual(404);
      expect(res.body).toEqual({ error: 'Account not found or no changes made' });
    });

    it('should return 400 if the account ID for update is invalid', async () => {
      const updatedAccount = { name: 'Updated Name' };
      const res = await request(app)
        .put('/accounts/abc')
        .send(updatedAccount);

      expect(res.statusCode).toEqual(400);
      expect(res.body).toEqual({ error: 'Invalid account ID' });
    });

    it('should return 400 if no fields are provided for update', async () => {
      const res = await request(app)
        .put(`/accounts/${accountIdToUpdate}`)
        .send({});

      expect(res.statusCode).toEqual(400);
      expect(res.body).toEqual({ error: 'At least one field (name or organization_id) is required for update' });
    });

    it('should return 400 if the organization ID for update is not a number', async () => {
      const updatedAccount = { organization_id: 'xyz' };
      const res = await request(app)
        .put(`/accounts/${accountIdToUpdate}`)
        .send(updatedAccount);

      expect(res.statusCode).toEqual(400);
      expect(res.body).toEqual({ error: 'Organization ID must be a number' });
    });
  });

  describe('DELETE /accounts/:id', () => {
    let accountIdToDelete: number | bigint;
    beforeEach(async () => {
      const createResult = accountsModel.create('To Be Deleted', organizationId);
      accountIdToDelete = createResult.lastInsertRowid;
    });

    it('should delete an existing account', async () => {
      const res = await request(app).delete(`/accounts/${accountIdToDelete}`);
      expect(res.statusCode).toEqual(204);
      expect(res.body).toEqual({});

      const retrievedAccount = accountsModel.getById(accountIdToDelete);
      expect(retrievedAccount).toBeUndefined();
    });

    it('should return 404 if the account ID to delete does not exist', async () => {
      const res = await request(app).delete('/accounts/999');
      expect(res.statusCode).toEqual(404);
      expect(res.body).toEqual({ error: 'Account not found' });
    });

    it('should return 400 if the account ID for deletion is invalid', async () => {
      const res = await request(app).delete('/accounts/abc');
      expect(res.statusCode).toEqual(400);
      expect(res.body).toEqual({ error: 'Invalid account ID' });
    });
  });
});