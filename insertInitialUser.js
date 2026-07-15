"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db = __importStar(require("./server/db"));
const schema_1 = require("./drizzle/schema");
const drizzle_orm_1 = require("drizzle-orm");
const mysql2_1 = require("drizzle-orm/mysql2");
const promise_1 = __importDefault(require("mysql2/promise"));
async function insertUser() {
    const DATABASE_URL = process.env.DATABASE_URL;
    if (!DATABASE_URL) {
        console.error("DATABASE_URL environment variable is not set.");
        process.exit(1);
    }
    const connection = await promise_1.default.createConnection({
        uri: DATABASE_URL,
        ssl: {
            rejectUnauthorized: true,
        },
    });
    const d = (0, mysql2_1.drizzle)(connection);
    const username = "charles12200";
    const passwordHash = "$2b$10$egYp/3szzxeP6IrkNTW/0u2.9mF.oFdzpcnLt3zSoNN/hAD5gWY1e"; // Hash gerado para '963850'
    try {
        // Check if user already exists by username
        const existingUser = await db.getUserByUsername(username);
        if (existingUser) {
            console.log(`User ${username} already exists. Updating password hash.`);
            await d.update(schema_1.users).set({ passwordHash, lastSignedIn: new Date() }).where((0, drizzle_orm_1.eq)(schema_1.users.username, username));
        }
        else {
            console.log(`Inserting new user ${username}.`);
            await db.upsertUser({
                openId: `local-${username}`,
                username: username,
                passwordHash: passwordHash,
                name: "Charles",
                email: "charles@example.com",
                role: "admin",
            });
        }
        console.log("Initial user inserted/updated successfully.");
    }
    catch (error) {
        console.error("Error inserting/updating initial user:", error);
    }
    finally {
        await connection.end();
    }
}
insertUser();
