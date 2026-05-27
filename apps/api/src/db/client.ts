import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { schema } from "./schema";

export function createDb(databaseUrl = process.env.DATABASE_URL) {
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not configured.");
  }

  const client = postgres(databaseUrl, {
    max: 10,
    prepare: false
  });

  return drizzle(client, { schema });
}

export type DbClient = ReturnType<typeof createDb>;

let dbClient: DbClient | undefined;

export function getDb(): DbClient {
  dbClient ??= createDb();

  return dbClient;
}
