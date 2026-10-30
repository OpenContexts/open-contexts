// Give an existing account a role:  pnpm db:make-admin you@example.org [admin|moderator|user]
// The account must have signed up first. It is also marked as verified, so it can sign in even
// if its address is not institutional or was never confirmed.
import { config } from "dotenv";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";
import { ROLES, type Role } from "../lib/constants";
import { user } from "../lib/db/schema/auth";

config({ path: [".env.local", ".env"] });

const [email, role = "admin"] = process.argv.slice(2);
if (!email || !ROLES.includes(role as Role)) {
  console.error(`Usage: pnpm db:make-admin <email> [${ROLES.join("|")}]`);
  process.exit(1);
}

// No top-level await: without "type": "module" in package.json, tsx compiles this file as CommonJS.
async function main() {
  const db = drizzle(process.env.DATABASE_URL!);
  const rows = await db.update(user).set({ role, emailVerified: true }).where(eq(user.email, email)).returning({ id: user.id });
  if (!rows.length) {
    console.error(`No user with email ${email}. Sign up on the site first.`);
    process.exit(1);
  }
  console.log(`${email} is now ${role}.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
