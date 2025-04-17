import request from 'supertest';
import express, { Express } from 'express';
import initializeDatabase from '../db';
import DealRoutes from './dealRoutes';
import { Deals } from '../models/dealModel';
import { Accounts } from '../models/accountModel';
import { Organizations } from '../models/organizationModel';

const db = initializeDatabase();
const dealsModel = Deals(db);
const accountsModel = Accounts(db);
const organizationsModel = Organizations(db);

const app: Express = express();
app.use(express.json());
app.use('/deals', DealRoutes(db));

describe('Deal API Endpoints', () => {
  let organizationId: number;
  let accountId: number;

  beforeEach(async () => {
    // Re-create the tables and insert a test organization and account before each test
    db.exec(`
      DROP TABLE IF EXISTS deals;
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
        year_of_creation INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (account_id) REFERENCES account(id)
      );
    `);
    const orgResult = organizationsModel.create('Test Organization');
    organizationId = orgResult.lastInsertRowid as number;
    const accountResult = accountsModel.create('Test Account', organizationId);
    accountId = accountResult.lastInsertRowid as number;
  });

  afterAll(() => {
    db.close();
  });

  describe('GET /deals', () => {
    it('should return an empty array if no deals exist', async () => {
      const res = await request(app).get('/deals');
      expect(res.statusCode).toEqual(200);
      expect(res.body).toEqual([]);
    });

    it('should return a list of deals', async () => {
      dealsModel.create(accountId, 1000, 'build_proposal', 2);
      dealsModel.create(accountId, 2500, 'negotiation', 1);

      const res = await request(app).get('/deals');
      expect(res.statusCode).toEqual(200);
      expect(res.body.length).toEqual(2);
      expect(res.body[0].account_id).toEqual(accountId);
      expect(res.body[0].value).toEqual(1000);
      expect(res.body[0].status).toEqual('build_proposal');
      expect(res.body[0].id).toBeDefined();
      expect(res.body[0].created_at).toBeDefined();
      expect(res.body[0].updated_at).toBeDefined();
      expect(res.body[1].account_id).toEqual(accountId);
      expect(res.body[1].value).toEqual(2500);
      expect(res.body[1].status).toEqual('negotiation');
      expect(res.body[1].id).toBeDefined();
      expect(res.body[1].created_at).toBeDefined();
      expect(res.body[1].updated_at).toBeDefined();
    });
  });

  describe('GET /deals/:id', () => {
    it('should return a specific deal by ID', async () => {
      const createResult = dealsModel.create(accountId, 5000, 'signed', 9423);
      const dealId = createResult.lastInsertRowid;

      const res = await request(app).get(`/deals/${dealId}`);
      expect(res.statusCode).toEqual(200);
      expect(res.body).toBeDefined();
      expect(res.body.id).toEqual(dealId);
      expect(res.body.account_id).toEqual(accountId);
      expect(res.body.value).toEqual(5000);
      expect(res.body.status).toEqual('signed');
      expect(res.body.created_at).toBeDefined();
      expect(res.body.updated_at).toBeDefined();
    });

    it('should return 404 if the deal ID does not exist', async () => {
      const res = await request(app).get('/deals/999');
      expect(res.statusCode).toEqual(404);
      expect(res.body).toEqual({ error: 'Deal not found' });
    });

    it('should return 400 if the deal ID is invalid', async () => {
      const res = await request(app).get('/deals/abc');
      expect(res.statusCode).toEqual(400);
      expect(res.body).toEqual({ error: 'Invalid deal ID' });
    });
  });

  describe('POST /deals', () => {
    it('should create a new deal', async () => {
      const newDeal = { account_id: accountId, value: 750, status: 'build_proposal', year_of_creation: 2025 };
      const res = await request(app)
        .post('/deals')
        .send(newDeal);

      expect(res.statusCode).toEqual(201);
      expect(res.body).toBeDefined();
      expect(res.body.id).toBeDefined();
      expect(res.body.account_id).toEqual(newDeal.account_id);
      expect(res.body.value).toEqual(newDeal.value);
      expect(res.body.status).toEqual(newDeal.status);

      const retrievedDeal = dealsModel.getById(res.body.id);
      expect(retrievedDeal).toBeDefined();
      expect(retrievedDeal?.account_id).toEqual(newDeal.account_id);
      expect(retrievedDeal?.value).toEqual(newDeal.value);
      expect(retrievedDeal?.status).toEqual(newDeal.status);
    });

    it('should return 400 if the account ID is missing', async () => {
      const res = await request(app)
        .post('/deals')
        .send({ value: 100, status: 'pitch_proposal' });

      expect(res.statusCode).toEqual(400);
      expect(res.body).toEqual({ error: 'Account ID is required and must be a number' });
    });

    it('should return 400 if the value is missing', async () => {
      const res = await request(app)
        .post('/deals')
        .send({ account_id: accountId, status: 'negotiation' });

      expect(res.statusCode).toEqual(400);
      expect(res.body).toEqual({ error: 'Deal value is required and must be a number' });
    });

    it('should return 400 if the status is missing', async () => {
      const res = await request(app)
        .post('/deals')
        .send({ account_id: accountId, value: 2000 });

      expect(res.statusCode).toEqual(400);
      expect(res.body).toEqual({ error: 'Deal status is required and must be one of: build_proposal, pitch_proposal, negotiation, awaiting_signoff, signed, cancelled, lost' });
    });

    it('should return 400 if the account ID is not a number', async () => {
      const res = await request(app)
        .post('/deals')
        .send({ account_id: 'abc', value: 100, status: 'awaiting_signoff' });

      expect(res.statusCode).toEqual(400);
      expect(res.body).toEqual({ error: 'Account ID is required and must be a number' });
    });

    it('should return 400 if the value is not a number', async () => {
      const res = await request(app)
        .post('/deals')
        .send({ account_id: accountId, value: 'xyz', status: 'signed' });

      expect(res.statusCode).toEqual(400);
      expect(res.body).toEqual({ error: 'Deal value is required and must be a number' });
    });

    it('should return 400 if the status is invalid', async () => {
      const res = await request(app)
        .post('/deals')
        .send({ account_id: accountId, value: 500, status: 'pending' });

      expect(res.statusCode).toEqual(400);
      expect(res.body).toEqual({ error: 'Deal status is required and must be one of: build_proposal, pitch_proposal, negotiation, awaiting_signoff, signed, cancelled, lost' });
    });
  });

  describe('PUT /deals/:id', () => {
    let dealIdToUpdate: number | bigint;
    beforeEach(async () => {
      const createResult = dealsModel.create(accountId, 1500, 'pitch_proposal', 1234);
      dealIdToUpdate = createResult.lastInsertRowid;
    });

    it('should update an existing deal\'s account ID', async () => {
      const newAccountResult = accountsModel.create('New Account', organizationId);
      const newAccountId = newAccountResult.lastInsertRowid as number;
      const updatedDeal = { account_id: newAccountId };
      const res = await request(app)
        .put(`/deals/${dealIdToUpdate}`)
        .send(updatedDeal);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toEqual({ message: `Deal with ID ${dealIdToUpdate} updated successfully` });

      const retrievedDeal = dealsModel.getById(dealIdToUpdate);
      expect(retrievedDeal).toBeDefined();
      expect(retrievedDeal?.account_id).toEqual(newAccountId);
    });

    it('should update an existing deal\'s value', async () => {
      const updatedDeal = { value: 2000 };
      const res = await request(app)
        .put(`/deals/${dealIdToUpdate}`)
        .send(updatedDeal);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toEqual({ message: `Deal with ID ${dealIdToUpdate} updated successfully` });

      const retrievedDeal = dealsModel.getById(dealIdToUpdate);
      expect(retrievedDeal).toBeDefined();
      expect(retrievedDeal?.value).toEqual(2000);
    });

    it('should update an existing deal\'s status', async () => {
      const updatedDeal = { status: 'negotiation' };
      const res = await request(app)
        .put(`/deals/${dealIdToUpdate}`)
        .send(updatedDeal);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toEqual({ message: `Deal with ID ${dealIdToUpdate} updated successfully` });

      const retrievedDeal = dealsModel.getById(dealIdToUpdate);
      expect(retrievedDeal).toBeDefined();
      expect(retrievedDeal?.status).toEqual('negotiation');
    });

    it('should update multiple fields of an existing deal', async () => {
      const newAccountResult = accountsModel.create('Another Account', organizationId);
      const newAccountId = newAccountResult.lastInsertRowid as number;
      const updatedDeal = { account_id: newAccountId, value: 3000, status: 'signed' };
      const res = await request(app)
        .put(`/deals/${dealIdToUpdate}`)
        .send(updatedDeal);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toEqual({ message: `Deal with ID ${dealIdToUpdate} updated successfully` });

      const retrievedDeal = dealsModel.getById(dealIdToUpdate);
      expect(retrievedDeal).toBeDefined();
      expect(retrievedDeal?.account_id).toEqual(newAccountId);
      expect(retrievedDeal?.value).toEqual(3000);
      expect(retrievedDeal?.status).toEqual('signed');
    });

    it('should return 404 if the deal ID to update does not exist', async () => {
      const updatedDeal = { value: 2000 };
      const res = await request(app)
        .put('/deals/999')
        .send(updatedDeal);

      expect(res.statusCode).toEqual(404);
      expect(res.body).toEqual({ error: 'Deal not found or no changes made' });
    });

    it('should return 400 if the deal ID for update is invalid', async () => {
      const updatedDeal = { value: 2000 };
      const res = await request(app)
        .put('/deals/abc')
        .send(updatedDeal);

      expect(res.statusCode).toEqual(400);
      expect(res.body).toEqual({ error: 'Invalid deal ID' });
    });

    it('should return 400 if no fields are provided for update', async () => {
      const res = await request(app)
        .put(`/deals/${dealIdToUpdate}`)
        .send({});

      expect(res.statusCode).toEqual(400);
      expect(res.body).toEqual({ error: 'At least one field (account_id, value, or status) is required for update' });
    });

    it('should return 400 if the account ID for update is not a number', async () => {
      const updatedDeal = { account_id: 'xyz' };
      const res = await request(app)
        .put(`/deals/${dealIdToUpdate}`)
        .send(updatedDeal);

      expect(res.statusCode).toEqual(400);
      expect(res.body).toEqual({ error: 'Account ID must be a number' });
    });

    it('should return 400 if the value for update is not a number', async () => {
      const updatedDeal = { value: 'abc' };
      const res = await request(app)
        .put(`/deals/${dealIdToUpdate}`)
        .send(updatedDeal);

      expect(res.statusCode).toEqual(400);
      expect(res.body).toEqual({ error: 'Deal value must be a number' });
    });

    it('should return 400 if the status for update is invalid', async () => {
      const updatedDeal = { status: 'pending' };
      const res = await request(app)
        .put(`/deals/${dealIdToUpdate}`)
        .send(updatedDeal);

      expect(res.statusCode).toEqual(400);
      expect(res.body).toEqual({ error: 'Deal status must be one of: build_proposal, pitch_proposal, negotiation, awaiting_signoff, signed, cancelled, lost' });
    });
  });

  describe('DELETE /deals/:id', () => {
    let dealIdToDelete: number | bigint;
    beforeEach(async () => {
      const createResult = dealsModel.create(accountId, 3000, 'signed', 415);
      dealIdToDelete = createResult.lastInsertRowid;
    });

    it('should delete an existing deal', async () => {
      const res = await request(app).delete(`/deals/${dealIdToDelete}`);
      expect(res.statusCode).toEqual(204);
      expect(res.body).toEqual({});

      const retrievedDeal = dealsModel.getById(dealIdToDelete);
      expect(retrievedDeal).toBeUndefined();
    });

    it('should return 404 if the deal ID to delete does not exist', async () => {
      const res = await request(app).delete('/deals/999');
      expect(res.statusCode).toEqual(404);
      expect(res.body).toEqual({ error: 'Deal not found' });
    });

    it('should return 400 if the deal ID for deletion is invalid', async () => {
      const res = await request(app).delete('/deals/abc');
      expect(res.statusCode).toEqual(400);
      expect(res.body).toEqual({ error: 'Invalid deal ID' });
    });
  });
});