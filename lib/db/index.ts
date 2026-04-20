import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "@/lib/db/schema";

const databaseUrl = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!databaseUrl) {
  throw new Error("Missing TURSO_DATABASE_URL in environment.");
}

if (!authToken) {
  throw new Error("Missing TURSO_AUTH_TOKEN in environment.");
}

const client = createClient({
  url: databaseUrl,
  authToken,
});

export const db = drizzle(client, { schema });
export { schema };
