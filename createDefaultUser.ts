import { getDb } from "./server/db";
import { users } from "./drizzle/schema";
import { eq } from "drizzle-orm";
import * as bcrypt from "bcryptjs";

async function main() {
  console.log("Creating default admin user...");
  const db = await getDb();
  if (!db) {
    console.error("Database not available");
    process.exit(1);
  }

  const username = "charles12200";
  const password = "senha123";
  const name = "Charles";

  // Hash the password
  const passwordHash = await bcrypt.hash(password, 10);

  // Check if user exists
  const existingUser = await db.query.users.findFirst({
    where: eq(users.username, username),
  });

  if (existingUser) {
    console.log(`User ${username} already exists. Updating...`);
    await db.update(users)
      .set({ 
        passwordHash,
        role: 'admin',
        name
      })
      .where(eq(users.username, username));
  } else {
    console.log(`Creating new user ${username}...`);
    await db.insert(users).values({
      username,
      passwordHash,
      email: `${username}@shadow-optimizer.com`,
      name,
      role: 'admin',
      loginMethod: 'password',
    });
  }

  console.log(`✅ User ${username} ready! Password: ${password}`);
  process.exit(0);
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
