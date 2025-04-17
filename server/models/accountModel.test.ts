import initializeDatabase from "../db";
import Accounts from "./accountModel";
import Database from "better-sqlite3";

// Define the type for the object returned by the Accounts const
type Accs = ReturnType<typeof Accounts>;

describe("Accounts Model Unit Tests", () => {
  let db: Database.Database;
  let accounts: Accs;
  let organizationId: number; // To link accounts to an organization

  beforeEach(() => {
    db = initializeDatabase();
    accounts = Accounts(db);
  
    // Create a test organization to link accounts to
    const orgResult = db.prepare("INSERT INTO organizations (name) VALUES (?)").run("Test Org");
    organizationId = orgResult.lastInsertRowid as number; // Type assertion as it's likely a number
  });

  afterEach(() => {
    // Clean up the accounts table after each test
    db.prepare("DELETE FROM account").run();
  });

  describe("getAll", () => {
    test("should retrieve an empty array if no accounts exist", () => {
      const allAccounts = accounts.getAll();
      expect(allAccounts).toEqual([]);
    });

    test("should retrieve all existing accounts", () => {
      accounts.create("Account One", organizationId);
      accounts.create("Account Two", organizationId);
      const allAccounts = accounts.getAll();
      expect(allAccounts.length).toBe(2);
      expect(allAccounts.some((acc) => acc.name === "Account One")).toBe(true);
      expect(allAccounts.some((acc) => acc.name === "Account Two")).toBe(true);
      expect(allAccounts.every((acc) => typeof acc.id === "number")).toBe(true);
      expect(allAccounts.every((acc) => acc.organization_id === organizationId)).toBe(true);
    });
  });

  describe("getById", () => {
    test("should retrieve an account by its ID", () => {
      const { lastInsertRowid } = accounts.create("Test Account", organizationId);
      const account = accounts.getById(lastInsertRowid);
      expect(account).toBeDefined();
      expect(account?.name).toBe("Test Account");
      expect(account?.organization_id).toBe(organizationId);
    });

    test("should return undefined if no account with the given ID exists", () => {
      const account = accounts.getById(999);
      expect(account).toBeUndefined();
    });
  });

  describe("create", () => {
    test("should create a new account and return its ID", () => {
      const result = accounts.create("New Account", organizationId);
      expect(typeof result.lastInsertRowid).toBe("number");
      expect(result.lastInsertRowid).toBeGreaterThan(0);

      const newAccount = accounts.getById(result.lastInsertRowid);
      expect(newAccount).toBeDefined();
      expect(newAccount?.name).toBe("New Account");
      expect(newAccount?.organization_id).toBe(organizationId);
    });
  });

  describe("update", () => {
    test("should update an existing account's name", () => {
      const { lastInsertRowid } = accounts.create("Old Account", organizationId);
      accounts.update(lastInsertRowid, "New Account Name");
      const updatedAccount = accounts.getById(lastInsertRowid);
      expect(updatedAccount).toBeDefined();
      expect(updatedAccount?.name).toBe("New Account Name");
    });

    test("should update an existing account's organization ID", () => {
      const { lastInsertRowid } = accounts.create("Test Account", organizationId);
      const newOrgId = organizationId + 1;
      accounts.update(lastInsertRowid, undefined, newOrgId);
      const updatedAccount = accounts.getById(lastInsertRowid);
      expect(updatedAccount).toBeDefined();
      expect(updatedAccount?.organization_id).toBe(newOrgId);
    });

    test("should update both name and organization ID", () => {
      const { lastInsertRowid } = accounts.create("Old Account", organizationId);
      const newOrgId = organizationId + 1;
      accounts.update(lastInsertRowid, "Updated Name", newOrgId);
      const updatedAccount = accounts.getById(lastInsertRowid);
      expect(updatedAccount).toBeDefined();
      expect(updatedAccount?.name).toBe("Updated Name");
      expect(updatedAccount?.organization_id).toBe(newOrgId);
    });

    test("should not throw an error if the account ID does not exist", () => {
      expect(() => accounts.update(999, "New Name")).not.toThrow();
      const notFound = accounts.getById(999);
      expect(notFound).toBeUndefined();
    });

    test("should return a changes count of 0 if no updates are provided", () => {
      const { lastInsertRowid } = accounts.create("Test Account", organizationId);
      const result = accounts.update(lastInsertRowid);
      expect(result.changes).toBe(0);
      const account = accounts.getById(lastInsertRowid);
      expect(account?.name).toBe("Test Account"); // Ensure no changes occurred
    });
  });

  describe("delete", () => {
    test("should delete an account by its ID", () => {
      const { lastInsertRowid } = accounts.create("To Be Deleted", organizationId);
      accounts.delete(lastInsertRowid);
      const deletedAccount = accounts.getById(lastInsertRowid);
      expect(deletedAccount).toBeUndefined();
    });

    test("should not throw an error if the account ID does not exist", () => {
      expect(() => accounts.delete(999)).not.toThrow();
      const notFound = accounts.getById(999);
      expect(notFound).toBeUndefined();
    });
  });
});