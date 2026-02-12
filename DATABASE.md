# Database Setup Guide

## Getting the DATABASE_URL

You need to add the `DATABASE_URL` to your `.env.local` file for Drizzle migrations to work.

### Get Connection String from Supabase

1. Go to your Supabase project dashboard
2. Click **Settings** (gear icon, bottom left)
3. Click **Database** in the left sidebar
4. Scroll to **Connection string** section
5. Select **URI** tab
6. **IMPORTANT:** Select **Session mode** (not Transaction mode)
7. Copy the connection string

It will look like:
```
postgresql://postgres.abcdefghijk:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

**Note:** Replace `[YOUR-PASSWORD]` with your actual database password (the one you set when creating the project).

### Add to .env.local

Add this line to your `.env.local` file:

```env
DATABASE_URL=postgresql://postgres.your-project-id:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

## Running Migrations

### Option 1: Push Schema (Recommended for Development)

Push your schema directly to the database without generating migration files:

```bash
npm run db:push
```

This is faster and good for development. Use this for now!

### Option 2: Generate and Run Migrations (Production)

Generate migration files from schema changes:

```bash
npm run db:generate
```

Then apply the migrations:

```bash
npm run db:migrate
```

### View Database with Drizzle Studio

Open a visual database browser:

```bash
npm run db:studio
```

Opens at http://localhost:4983

## Troubleshooting

### "Connection refused" or "Could not connect"

- Check that `DATABASE_URL` is set in `.env.local`
- Verify the connection string is correct
- Make sure you replaced `[YOUR-PASSWORD]` with actual password
- Check that your IP is allowed in Supabase (Settings → Database → Connection pooling)

### "relation already exists"

- Tables already exist in database
- This is OK - Drizzle will skip creating them
- Or drop all tables and re-run if you want fresh start

### "password authentication failed"

- Wrong database password
- Get the password from when you created the Supabase project
- Or reset it in Supabase Settings → Database → Database password

## Database Commands Reference

```bash
# Push schema to database (recommended for dev)
npm run db:push

# Generate migration files
npm run db:generate

# Run migrations
npm run db:migrate

# Open Drizzle Studio (database GUI)
npm run db:studio
```

## Next Steps

After getting DATABASE_URL set up:
1. Run `npm run db:push` to create all tables
2. Verify tables were created in Supabase dashboard
3. Test database operations
4. Continue with app development
