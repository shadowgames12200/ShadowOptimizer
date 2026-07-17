import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).unique(),
  username: varchar("username", { length: 64 }).unique(),
  passwordHash: varchar("passwordHash", { length: 256 }),
  name: text("name"),
  email: varchar("email", { length: 320 }).unique(),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * License keys table for ShadowOptimizer
 * Stores all generated license keys with their status and metadata
 */
export const licenses = mysqlTable("licenses", {
  id: int("id").autoincrement().primaryKey(),
  /** Unique license key in format PREFIX-XXXX-XXXX */
  key: varchar("key", { length: 64 }).notNull().unique(),
  /** Status of the license: active, revoked, or expired */
  status: mysqlEnum("status", ["active", "revoked", "expired"]).default("active").notNull(),
  /** Optional expiration date for the license */
  expiresAt: timestamp("expiresAt"),
  /** HWID bound to this license after first activation */
  boundHwid: varchar("boundHwid", { length: 256 }),
  /** Whether the license has been activated at least once */
  activated: int("activated").default(0).notNull(),
  /** Product category: shadow_optimizer or shadow_1071 */
  product: mysqlEnum("product", ["shadow_optimizer", "shadow_1071"]).default("shadow_optimizer").notNull(),
  /** Owner user ID who created this license */
  createdByUserId: int("createdByUserId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type License = typeof licenses.$inferSelect;
export type InsertLicense = typeof licenses.$inferInsert;

/**
 * Access logs table
 * Records all validation attempts (success or failure) for audit trail
 */
export const accessLogs = mysqlTable("accessLogs", {
  id: int("id").autoincrement().primaryKey(),
  /** License ID being validated */
  licenseId: int("licenseId").notNull(),
  /** HWID provided during validation attempt */
  hwid: varchar("hwid", { length: 256 }).notNull(),
  /** Result of validation: success, invalid_key, invalid_hwid, revoked, expired */
  result: mysqlEnum("result", ["success", "invalid_key", "invalid_hwid", "revoked", "expired", "not_activated"]).notNull(),
  /** IP address or identifier of the validation request */
  requestSource: varchar("requestSource", { length: 128 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AccessLog = typeof accessLogs.$inferSelect;
export type InsertAccessLog = typeof accessLogs.$inferInsert;

/**
 * HWID bindings table (optional, for tracking HWID history)
 * Stores historical HWID bindings for a license
 */
export const hwidBindings = mysqlTable("hwidBindings", {
  id: int("id").autoincrement().primaryKey(),
  /** License ID */
  licenseId: int("licenseId").notNull(),
  /** HWID value */
  hwid: varchar("hwid", { length: 256 }).notNull(),
  /** Whether this is the current binding */
  isCurrent: int("isCurrent").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type HWIDBinding = typeof hwidBindings.$inferSelect;
export type InsertHWIDBinding = typeof hwidBindings.$inferInsert;
