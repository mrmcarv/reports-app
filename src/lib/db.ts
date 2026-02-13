/**
 * Database Connection (Lazy Initialization)
 *
 * Drizzle ORM client for PostgreSQL
 * Initializes only when first accessed (not at module load time)
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as schema from './schema';

let dbInstance: PostgresJsDatabase<typeof schema> | null = null;

function initializeDb(): PostgresJsDatabase<typeof schema> {
  if (dbInstance) {
    return dbInstance;
  }

  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error('DATABASE_URL is not set in environment variables');
  }

  const client = postgres(connectionString);
  dbInstance = drizzle(client, { schema });

  return dbInstance;
}

// Export db with proper typing
export const db: PostgresJsDatabase<typeof schema> = new Proxy({} as PostgresJsDatabase<typeof schema>, {
  get(_target, prop) {
    const instance = initializeDb();
    const value = instance[prop as keyof typeof instance];
    // Bind functions to the instance
    return typeof value === 'function' ? value.bind(instance) : value;
  },
});
