import { getDb } from "./server/db";
import { users } from "./drizzle/schema";
import { eq } from "drizzle-orm";
import * as bcrypt from "bcryptjs";

async function main() {
  const db = await getDb();
  if (!db) {
    console.error("Database not available");
    process.exit(1);
  }

  const username = "charles12200";
  const password = "963850"; // Senha fornecida pelo usuário
  const name = "Charles";

  console.log(`Setting password for user ${username}...`);

  // Hash the password
  const passwordHash = await bcrypt.hash(password, 10);

  // Use raw drizzle for user creation/update
  const usersTable = users;

  // Check if user exists
  const existingUsers = await db.select().from(usersTable).where(eq(usersTable.username, username)).limit(1);
  const existingUser = existingUsers[0];

  if (existingUser) {
    console.log(`User ${username} exists. Updating password...`);
    await db.update(usersTable)
      .set({ 
        passwordHash,
        role: 'admin',
        name,
        loginMethod: 'password',
        updatedAt: new Date()
      })
      .where(eq(usersTable.username, username));
  } else {
    console.log(`Creating new user ${username}...`);
    await db.insert(usersTable).values({
      username,
      passwordHash,
      email: `${username}@shadow-optimizer.com`,
      name,
      role: 'admin',
      loginMethod: 'password',
      openId: `local-${username}`,
      lastSignedIn: new Date()
    });
  }

  console.log(`✅ User ${username} is now configured with the correct password.`);
  process.exit(0);
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
