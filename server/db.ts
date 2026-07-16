import { eq, desc, inArray } from "drizzle-orm";
import { users } from "../drizzle/schema";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { InsertUser, users, licenses, accessLogs, InsertLicense } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      // For TiDB Cloud and other production DBs, we need a connection pool with SSL
      const connection = await mysql.createPool({
        uri: process.env.DATABASE_URL,
        ssl: {
          rejectUnauthorized: true,
        },
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        enableKeepAlive: true,
        keepAliveInitialDelay: 10000,
      });
      
      _db = drizzle(connection);
      console.log("[Database] Connection pool established successfully");
    } catch (error) {
      console.error("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId && !user.username) {
    throw new Error("User openId or username is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
      username: user.username,
      passwordHash: user.passwordHash,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod", "username", "passwordHash"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByUsername(username: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.username, username)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

/**
 * Get a license by its key
 */
export async function getLicenseByKey(key: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(licenses)
    .where(eq(licenses.key, key))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

/**
 * Get all licenses for a user (admin)
 */
export async function getLicensesByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(licenses)
    .where(eq(licenses.createdByUserId, userId));
}

/**
 * Create a new license
 */
export async function createLicense(license: InsertLicense) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(licenses).values(license);
  return getLicenseByKey(license.key);
}

/**
 * Update license status
 */
export async function updateLicenseStatus(
  licenseId: number,
  status: "active" | "revoked" | "expired"
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(licenses)
    .set({ status, updatedAt: new Date() })
    .where(eq(licenses.id, licenseId));
}

/**
 * Update license expiration date
 * Pass null to make it lifetime (no expiration)
 */
export async function updateLicenseExpiration(
  licenseId: number,
  expiresAt: Date | null
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(licenses)
    .set({ expiresAt, updatedAt: new Date() })
    .where(eq(licenses.id, licenseId));
}

/**
 * Bind HWID to a license
 */
export async function bindHwidToLicense(
  licenseId: number,
  hwid: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(licenses)
    .set({ boundHwid: hwid, activated: 1, updatedAt: new Date() })
    .where(eq(licenses.id, licenseId));
}

/**
 * Log an access attempt
 */
export async function logAccessAttempt(
  licenseId: number,
  hwid: string,
  result: "success" | "invalid_key" | "invalid_hwid" | "revoked" | "expired" | "not_activated",
  requestSource?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(accessLogs).values({
    licenseId,
    hwid,
    result,
    requestSource,
  });
}

/**
 * Get access logs for a license
 */
export async function getAccessLogs(licenseId: number, limit = 100) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(accessLogs)
    .where(eq(accessLogs.licenseId, licenseId))
    .orderBy(desc(accessLogs.createdAt))
    .limit(limit);
}

/**
 * Get license statistics for dashboard
 */
export async function getLicenseStats(userId: number) {
  const db = await getDb();
  if (!db) return { total: 0, active: 0, expired: 0, revoked: 0, deniedAttempts: 0 };

  const userLicenses = await db
    .select()
    .from(licenses)
    .where(eq(licenses.createdByUserId, userId));

  const total = userLicenses.length;
  const active = userLicenses.filter((l) => l.status === "active").length;
  const expired = userLicenses.filter((l) => l.status === "expired").length;
  const revoked = userLicenses.filter((l) => l.status === "revoked").length;

  // Count denied attempts
  const deniedLogs = await db
    .select()
    .from(accessLogs)
    .where(
      inArray(
        accessLogs.result,
        ["invalid_key", "invalid_hwid", "revoked", "expired", "not_activated"]
      )
    );

  return {
    total,
    active,
    expired,
    revoked,
    deniedAttempts: deniedLogs.length,
  };
}

/**
 * Delete all licenses for a user
 */
export async function deleteAllLicensesByUser(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // First get license IDs to delete related logs
  const userLicenses = await db
    .select({ id: licenses.id })
    .from(licenses)
    .where(eq(licenses.createdByUserId, userId));
  
  const licenseIds = userLicenses.map(l => l.id);

  if (licenseIds.length > 0) {
    // Delete logs first due to foreign key constraints
    await db.delete(accessLogs).where(inArray(accessLogs.licenseId, licenseIds));
    // Delete licenses
    await db.delete(licenses).where(inArray(licenses.id, licenseIds));
  }
}
