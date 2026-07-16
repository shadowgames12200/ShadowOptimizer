import { getDb } from "./server/db";
import { users } from "./drizzle/schema";
import { eq } from "drizzle-orm";

async function main() {
  console.log("Setting charles12200 as admin...");
  const db = await getDb();
  if (!db) {
    console.error("Database not available");
    process.exit(1);
  }
  await db.update(users)
    .set({ role: 'admin' })
    .where(eq(users.username, 'charles12200'));
  console.log("Done!");
  process.exit(0);
}

main().catch(console.error);
