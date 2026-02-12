/**
 * Drizzle Kit Configuration
 *
 * Configuration for Drizzle ORM migrations and schema management.
 * Used for:
 * - Generating migrations from schema changes
 * - Pushing schema to Supabase PostgreSQL
 * - Introspecting existing database
 */

import type { Config } from 'drizzle-kit';

export default {
  schema: './src/lib/schema.ts',
  out: './drizzle/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
} satisfies Config;
