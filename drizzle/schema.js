"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hwidBindings = exports.accessLogs = exports.licenses = exports.users = void 0;
const mysql_core_1 = require("drizzle-orm/mysql-core");
/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
exports.users = (0, mysql_core_1.mysqlTable)("users", {
    /**
     * Surrogate primary key. Auto-incremented numeric value managed by the database.
     * Use this for relations between tables.
     */
    id: (0, mysql_core_1.int)("id").autoincrement().primaryKey(),
    /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
    openId: (0, mysql_core_1.varchar)("openId", { length: 64 }).unique(),
    username: (0, mysql_core_1.varchar)("username", { length: 64 }).unique(),
    passwordHash: (0, mysql_core_1.varchar)("passwordHash", { length: 256 }),
    name: (0, mysql_core_1.text)("name"),
    email: (0, mysql_core_1.varchar)("email", { length: 320 }).unique(),
    loginMethod: (0, mysql_core_1.varchar)("loginMethod", { length: 64 }),
    role: (0, mysql_core_1.mysqlEnum)("role", ["user", "admin"]).default("user").notNull(),
    createdAt: (0, mysql_core_1.timestamp)("createdAt").defaultNow().notNull(),
    updatedAt: (0, mysql_core_1.timestamp)("updatedAt").defaultNow().onUpdateNow().notNull(),
    lastSignedIn: (0, mysql_core_1.timestamp)("lastSignedIn").defaultNow().notNull(),
});
/**
 * License keys table for ShadowOptimizer
 * Stores all generated license keys with their status and metadata
 */
exports.licenses = (0, mysql_core_1.mysqlTable)("licenses", {
    id: (0, mysql_core_1.int)("id").autoincrement().primaryKey(),
    /** Unique license key in format SHADOW-XXXX-XXXX */
    key: (0, mysql_core_1.varchar)("key", { length: 64 }).notNull().unique(),
    /** Status of the license: active, revoked, or expired */
    status: (0, mysql_core_1.mysqlEnum)("status", ["active", "revoked", "expired"]).default("active").notNull(),
    /** Optional expiration date for the license */
    expiresAt: (0, mysql_core_1.timestamp)("expiresAt"),
    /** HWID bound to this license after first activation */
    boundHwid: (0, mysql_core_1.varchar)("boundHwid", { length: 256 }),
    /** Whether the license has been activated at least once */
    activated: (0, mysql_core_1.int)("activated").default(0).notNull(),
    /** Owner user ID who created this license */
    createdByUserId: (0, mysql_core_1.int)("createdByUserId").notNull(),
    createdAt: (0, mysql_core_1.timestamp)("createdAt").defaultNow().notNull(),
    updatedAt: (0, mysql_core_1.timestamp)("updatedAt").defaultNow().onUpdateNow().notNull(),
});
/**
 * Access logs table
 * Records all validation attempts (success or failure) for audit trail
 */
exports.accessLogs = (0, mysql_core_1.mysqlTable)("accessLogs", {
    id: (0, mysql_core_1.int)("id").autoincrement().primaryKey(),
    /** License ID being validated */
    licenseId: (0, mysql_core_1.int)("licenseId").notNull(),
    /** HWID provided during validation attempt */
    hwid: (0, mysql_core_1.varchar)("hwid", { length: 256 }).notNull(),
    /** Result of validation: success, invalid_key, invalid_hwid, revoked, expired */
    result: (0, mysql_core_1.mysqlEnum)("result", ["success", "invalid_key", "invalid_hwid", "revoked", "expired", "not_activated"]).notNull(),
    /** IP address or identifier of the validation request */
    requestSource: (0, mysql_core_1.varchar)("requestSource", { length: 128 }),
    createdAt: (0, mysql_core_1.timestamp)("createdAt").defaultNow().notNull(),
});
/**
 * HWID bindings table (optional, for tracking HWID history)
 * Stores historical HWID bindings for a license
 */
exports.hwidBindings = (0, mysql_core_1.mysqlTable)("hwidBindings", {
    id: (0, mysql_core_1.int)("id").autoincrement().primaryKey(),
    /** License ID */
    licenseId: (0, mysql_core_1.int)("licenseId").notNull(),
    /** HWID value */
    hwid: (0, mysql_core_1.varchar)("hwid", { length: 256 }).notNull(),
    /** Whether this is the current binding */
    isCurrent: (0, mysql_core_1.int)("isCurrent").default(1).notNull(),
    createdAt: (0, mysql_core_1.timestamp)("createdAt").defaultNow().notNull(),
});
