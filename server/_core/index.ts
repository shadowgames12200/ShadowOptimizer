import "dotenv/config";
import express from "express";
import { createServer } from "http";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import restApiRouter from "../rest-api";
import mysql from "mysql2/promise";

/**
 * Ensure the database schema is up-to-date by applying any missing columns.
 * This is a safe, idempotent operation that runs on every startup.
 */
async function ensureSchema() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) return;

  try {
    const connection = await mysql.createConnection(dbUrl);

    // Ensure `product` column exists in `licenses` table (migration 0003)
    try {
      await connection.execute(
        `ALTER TABLE \`licenses\` ADD COLUMN \`product\` ENUM('shadow_optimizer','shadow_1071') NOT NULL DEFAULT 'shadow_optimizer'`
      );
      console.log("[Schema] Added 'product' column to licenses table");
    } catch (err: any) {
      // Error 1060 = Duplicate column name — column already exists, which is fine
      if (err?.errno !== 1060) {
        console.error("[Schema] Unexpected error adding product column:", err?.message);
      }
    }

    await connection.end();
    console.log("[Schema] Schema check complete");
  } catch (err) {
    console.error("[Schema] Failed to run schema check:", err);
  }
}

async function startServer() {
  // Run schema migrations before starting the server
  await ensureSchema();

  const app = express();
  const server = createServer(app);
  
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  
  registerStorageProxy(app);
  registerOAuthRoutes(app);
  
  // REST API
  app.use("/api", restApiRouter);
  
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // On Render and other PaaS, the port is provided by the environment variable PORT
  // We should listen on 0.0.0.0 to be accessible externally
  const port = parseInt(process.env.PORT || "3000");

  server.listen(port, "0.0.0.0", () => {
    console.log(`Server running on port ${port}`);
    console.log(`Health check available at http://localhost:${port}/api/health`);
  });
}

startServer().catch(console.error);
