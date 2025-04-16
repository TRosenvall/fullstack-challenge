import initializeDatabase from "../db";
import Organizations from "./organizationModel";
import Database from "better-sqlite3"; // Assuming 'better-sqlite3' is the type for your database

// Define the type for the object returned by the Organizations const
type Orgs = ReturnType<typeof Organizations>;

describe("Organizations Model Unit Tests", () => {
  let db: Database.Database;
  let organizations: Orgs;

  beforeEach(() => {
    db = initializeDatabase(); // creates a fresh db for each test
    organizations = Organizations(db);
  });

  describe("create", () => {
    test("should create a new organization and return its ID", () => {
      const result = organizations.create("Test Org");
      expect(typeof result.lastInsertRowid).toBe("number");
      expect(result.lastInsertRowid).toBeGreaterThan(0);
    });
  });

  describe("getById", () => {
    test("should retrieve an organization by its ID", () => {
      const { lastInsertRowid } = organizations.create("Test Org");
      const org = organizations.getById(lastInsertRowid);
      expect(org).toBeDefined();
      expect(org?.name).toBe("Test Org");
    });

    test("should return undefined if no organization with the given ID exists", () => {
      const org = organizations.getById(999); // Assuming 999 is a non-existent ID
      expect(org).toBeUndefined();
    });
  });

  describe("update", () => {
    test("should update an existing organization's name", () => {
      const { lastInsertRowid } = organizations.create("Old Name");
      organizations.update(lastInsertRowid, "New Name");
      const updated = organizations.getById(lastInsertRowid);
      expect(updated).toBeDefined();
      expect(updated?.name).toBe("New Name");
    });

    test("should not throw an error if the organization ID does not exist", () => {
      expect(() => organizations.update(999, "New Name")).not.toThrow();
      const notFound = organizations.getById(999);
      expect(notFound).toBeUndefined();
    });
  });

  describe("delete", () => {
    test("should delete an organization by its ID", () => {
      const { lastInsertRowid } = organizations.create("To Be Deleted");
      organizations.delete(lastInsertRowid);
      const deleted = organizations.getById(lastInsertRowid);
      expect(deleted).toBeUndefined();
    });

    test("should not throw an error if the organization ID does not exist", () => {
      expect(() => organizations.delete(999)).not.toThrow();
      const notFound = organizations.getById(999);
      expect(notFound).toBeUndefined();
    });
  });
});