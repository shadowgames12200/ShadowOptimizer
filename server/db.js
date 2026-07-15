"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDb = getDb;
exports.upsertUser = upsertUser;
exports.getUserByUsername = getUserByUsername;
exports.getUserByOpenId = getUserByOpenId;
exports.getLicenseByKey = getLicenseByKey;
exports.getLicensesByUser = getLicensesByUser;
exports.createLicense = createLicense;
exports.updateLicenseStatus = updateLicenseStatus;
exports.bindHwidToLicense = bindHwidToLicense;
exports.logAccessAttempt = logAccessAttempt;
exports.getAccessLogs = getAccessLogs;
exports.getLicenseStats = getLicenseStats;
const drizzle_orm_1 = require("drizzle-orm");
const schema_1 = require("../drizzle/schema");
const mysql2_1 = require("drizzle-orm/mysql2");
const promise_1 = __importDefault(require("mysql2/promise"));
const schema_2 = require("../drizzle/schema");
const env_1 = require("./_core/env");
let _db = null;
// Lazily create the drizzle instance so local tooling can run without a DB.
async function getDb() {
    if (!_db && process.env.DATABASE_URL) {
        try {
            // For TiDB Cloud and other production DBs, we need a connection pool with SSL
            const connection = await promise_1.default.createPool({
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
            _db = (0, mysql2_1.drizzle)(connection);
            console.log("[Database] Connection pool established successfully");
        }
        catch (error) {
            console.error("[Database] Failed to connect:", error);
            _db = null;
        }
    }
    return _db;
}
async function upsertUser(user) {
    if (!user.openId && !user.username) {
        throw new Error("User openId or username is required for upsert");
    }
    const db = await getDb();
    if (!db) {
        console.warn("[Database] Cannot upsert user: database not available");
        return;
    }
    try {
        const values = {
            openId: user.openId,
            username: user.username,
            passwordHash: user.passwordHash,
        };
        const updateSet = {};
        const textFields = ["name", "email", "loginMethod", "username", "passwordHash"];
        const assignNullable = (field) => {
            const value = user[field];
            if (value === undefined)
                return;
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
        }
        else if (user.openId === env_1.ENV.ownerOpenId) {
            values.role = 'admin';
            updateSet.role = 'admin';
        }
        if (!values.lastSignedIn) {
            values.lastSignedIn = new Date();
        }
        if (Object.keys(updateSet).length === 0) {
            updateSet.lastSignedIn = new Date();
        }
        await db.insert(schema_1.users).values(values).onDuplicateKeyUpdate({
            set: updateSet,
        });
    }
    catch (error) {
        console.error("[Database] Failed to upsert user:", error);
        throw error;
    }
}
async function getUserByUsername(username) {
    const db = await getDb();
    if (!db) {
        console.warn("[Database] Cannot get user: database not available");
        return undefined;
    }
    const result = await db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.username, username)).limit(1);
    return result.length > 0 ? result[0] : undefined;
}
async function getUserByOpenId(openId) {
    const db = await getDb();
    if (!db) {
        console.warn("[Database] Cannot get user: database not available");
        return undefined;
    }
    const result = await db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.openId, openId)).limit(1);
    return result.length > 0 ? result[0] : undefined;
}
/**
 * Get a license by its key
 */
async function getLicenseByKey(key) {
    const db = await getDb();
    if (!db)
        return undefined;
    const result = await db
        .select()
        .from(schema_2.licenses)
        .where((0, drizzle_orm_1.eq)(schema_2.licenses.key, key))
        .limit(1);
    return result.length > 0 ? result[0] : undefined;
}
/**
 * Get all licenses for a user (admin)
 */
async function getLicensesByUser(userId) {
    const db = await getDb();
    if (!db)
        return [];
    return await db
        .select()
        .from(schema_2.licenses)
        .where((0, drizzle_orm_1.eq)(schema_2.licenses.createdByUserId, userId));
}
/**
 * Create a new license
 */
async function createLicense(license) {
    const db = await getDb();
    if (!db)
        throw new Error("Database not available");
    await db.insert(schema_2.licenses).values(license);
    return getLicenseByKey(license.key);
}
/**
 * Update license status
 */
async function updateLicenseStatus(licenseId, status) {
    const db = await getDb();
    if (!db)
        throw new Error("Database not available");
    await db
        .update(schema_2.licenses)
        .set({ status, updatedAt: new Date() })
        .where((0, drizzle_orm_1.eq)(schema_2.licenses.id, licenseId));
}
/**
 * Bind HWID to a license
 */
async function bindHwidToLicense(licenseId, hwid) {
    const db = await getDb();
    if (!db)
        throw new Error("Database not available");
    await db
        .update(schema_2.licenses)
        .set({ boundHwid: hwid, activated: 1, updatedAt: new Date() })
        .where((0, drizzle_orm_1.eq)(schema_2.licenses.id, licenseId));
}
/**
 * Log an access attempt
 */
async function logAccessAttempt(licenseId, hwid, result, requestSource) {
    const db = await getDb();
    if (!db)
        throw new Error("Database not available");
    await db.insert(schema_2.accessLogs).values({
        licenseId,
        hwid,
        result,
        requestSource,
    });
}
/**
 * Get access logs for a license
 */
async function getAccessLogs(licenseId, limit = 100) {
    const db = await getDb();
    if (!db)
        return [];
    return await db
        .select()
        .from(schema_2.accessLogs)
        .where((0, drizzle_orm_1.eq)(schema_2.accessLogs.licenseId, licenseId))
        .orderBy((0, drizzle_orm_1.desc)(schema_2.accessLogs.createdAt))
        .limit(limit);
}
/**
 * Get license statistics for dashboard
 */
async function getLicenseStats(userId) {
    const db = await getDb();
    if (!db)
        return { total: 0, active: 0, expired: 0, revoked: 0, deniedAttempts: 0 };
    const userLicenses = await db
        .select()
        .from(schema_2.licenses)
        .where((0, drizzle_orm_1.eq)(schema_2.licenses.createdByUserId, userId));
    const total = userLicenses.length;
    const active = userLicenses.filter((l) => l.status === "active").length;
    const expired = userLicenses.filter((l) => l.status === "expired").length;
    const revoked = userLicenses.filter((l) => l.status === "revoked").length;
    // Count denied attempts
    const deniedLogs = await db
        .select()
        .from(schema_2.accessLogs)
        .where((0, drizzle_orm_1.inArray)(schema_2.accessLogs.result, ["invalid_key", "invalid_hwid", "revoked", "expired", "not_activated"]));
    return {
        total,
        active,
        expired,
        revoked,
        deniedAttempts: deniedLogs.length,
    };
}
