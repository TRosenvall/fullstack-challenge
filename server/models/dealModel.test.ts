import initializeDatabase from "../db";
import Deals from "./dealModel";
import Database from "better-sqlite3";

// Define the type for the object returned by the Deals const
type DealModel = ReturnType<typeof Deals>;

describe("Deals Model Unit Tests", () => {
  let db: Database.Database;
  let deals: DealModel;
  let accountId: number; // To link deals to an account

  beforeEach(() => {
    db = initializeDatabase();
    deals = Deals(db);

    // Create a test account to link deals to
    const accountResult = db.prepare("INSERT INTO account (name, organization_id) VALUES (?, ?)").run("Test Account", 1); // Assuming organizationId 1 exists
    accountId = accountResult.lastInsertRowid as number;
  });

  afterEach(() => {
    // Clean up the deals table after each test
    db.prepare("DELETE FROM deals").run();
  });

  describe("getAll", () => {
    test("should retrieve an empty array if no deals exist", () => {
      const allDeals = deals.getAll();
      expect(allDeals).toEqual([]);
    });

    test("should retrieve all existing deals", () => {
      deals.create(accountId, 1000, 'build_proposal', 1392);
      deals.create(accountId, 5000, 'negotiation', 1294);
      const allDeals = deals.getAll();
      expect(allDeals.length).toBe(2);
      expect(allDeals.some((deal) => deal.value === 1000 && deal.status === 'build_proposal')).toBe(true);
      expect(allDeals.some((deal) => deal.value === 5000 && deal.status === 'negotiation')).toBe(true);
      expect(allDeals.every((deal) => typeof deal.id === "number")).toBe(true);
      expect(allDeals.every((deal) => deal.account_id === accountId)).toBe(true);
    });
  });

  describe("getById", () => {
    test("should retrieve a deal by its ID", () => {
      const { lastInsertRowid } = deals.create(accountId, 2500, 'pitch_proposal', 1842);
      const deal = deals.getById(lastInsertRowid);
      expect(deal).toBeDefined();
      expect(deal?.value).toBe(2500);
      expect(deal?.status).toBe('pitch_proposal');
      expect(deal?.account_id).toBe(accountId);
    });

    test("should return undefined if no deal with the given ID exists", () => {
      const deal = deals.getById(999);
      expect(deal).toBeUndefined();
    });
  });

  describe("create", () => {
    test("should create a new deal and return its ID", () => {
      const result = deals.create(accountId, 750, 'awaiting_signoff', 293);
      expect(typeof result.lastInsertRowid).toBe("number");
      expect(result.lastInsertRowid).toBeGreaterThan(0);

      const newDeal = deals.getById(result.lastInsertRowid);
      expect(newDeal).toBeDefined();
      expect(newDeal?.account_id).toBe(accountId);
      expect(newDeal?.value).toBe(750);
      expect(newDeal?.status).toBe('awaiting_signoff');
    });
  });

  describe("update", () => {
    test("should update an existing deal's value", () => {
      const { lastInsertRowid } = deals.create(accountId, 1200, 'negotiation', 1432);
      deals.update(lastInsertRowid, undefined, 1500);
      const updatedDeal = deals.getById(lastInsertRowid);
      expect(updatedDeal).toBeDefined();
      expect(updatedDeal?.value).toBe(1500);
    });

    test("should update an existing deal's status", () => {
      const { lastInsertRowid } = deals.create(accountId, 3000, 'build_proposal', 9342);
      deals.update(lastInsertRowid, undefined, undefined, 'signed');
      const updatedDeal = deals.getById(lastInsertRowid);
      expect(updatedDeal).toBeDefined();
      expect(updatedDeal?.status).toBe('signed');
    });

    test("should update multiple fields of an existing deal", () => {
      const { lastInsertRowid } = deals.create(accountId, 2000, 'pitch_proposal', 1234);
      deals.update(lastInsertRowid, undefined, 2200, 'negotiation');
      const updatedDeal = deals.getById(lastInsertRowid);
      expect(updatedDeal).toBeDefined();
      expect(updatedDeal?.value).toBe(2200);
      expect(updatedDeal?.status).toBe('negotiation');
    });

    test("should not throw an error if the deal ID does not exist", () => {
      expect(() => deals.update(999, undefined, 9999)).not.toThrow();
      const notFound = deals.getById(999);
      expect(notFound).toBeUndefined();
    });

    test("should return a changes count of 0 if no updates are provided", () => {
      const { lastInsertRowid } = deals.create(accountId, 500, 'build_proposal', 2020);
      const result = deals.update(lastInsertRowid);
      expect(result.changes).toBe(0);
      const deal = deals.getById(lastInsertRowid);
      expect(deal?.value).toBe(500);
      expect(deal?.status).toBe('build_proposal');
    });
  });

  describe("delete", () => {
    test("should delete a deal by its ID", () => {
      const { lastInsertRowid } = deals.create(accountId, 1800, 'awaiting_signoff', 1994);
      deals.delete(lastInsertRowid);
      const deletedDeal = deals.getById(lastInsertRowid);
      expect(deletedDeal).toBeUndefined();
    });

    test("should not throw an error if the deal ID does not exist", () => {
      expect(() => deals.delete(999)).not.toThrow();
      const notFound = deals.getById(999);
      expect(notFound).toBeUndefined();
    });
  });
});