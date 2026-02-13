# Reports App - Emergency Reporting System for Technicians

Field reporting system for Zite technicians to complete work orders, track battery swaps, maintenance, and wind audits.

## Stack

- **Framework:** Next.js 15 (App Router, TypeScript)
- **Database:** PostgreSQL (self-hosted)
- **ORM:** Drizzle ORM
- **Auth:** Magic Link (JWT-based, stateless)
- **Email:** Resend
- **Storage:** AWS S3
- **Workflow:** n8n (Airtable sync)
- **Deployment:** Docker + Kubernetes + GHCR

## Quick Start

### Local Development

1. **Start PostgreSQL:**
   ```bash
   docker-compose -f docker-compose.dev.yml up -d
   ```

2. **Set up environment:**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your credentials
   ```

3. **Run migrations:**
   ```bash
   npm run db:push
   ```

4. **Start dev server:**
   ```bash
   npm run dev
   ```

5. **Open [http://localhost:3000](http://localhost:3000)**

### Docker (Production-like)

```bash
# Build and run full stack
docker-compose up --build

# App: http://localhost:3000
# PostgreSQL: localhost:5432
```

## Environment Variables

Required environment variables (see `.env.example` for full list):

```bash
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/reports_app_dev

# Airtable
AIRTABLE_API_KEY=key...
AIRTABLE_BASE_ID_DEBLOQ=app...

# Auth
JWT_SECRET=your-super-secret-key-min-32-chars
RESEND_API_KEY=re_...

# n8n
N8N_WEBHOOK_URL=https://...
N8N_WEBHOOK_SECRET=...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server

npm run db:generate  # Generate Drizzle migrations
npm run db:push      # Push schema changes to DB
npm run db:studio    # Open Drizzle Studio

npm run test:airtable # Test Airtable connection
npm run test:n8n      # Test n8n webhook
```

## Documentation

- [Docker & GHCR Setup](docs/DOCKER.md)
- [Architecture Overview](docs/planning/spec.md)
- [Development Guide](CLAUDE.md)

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   ├── auth/              # Auth pages (magic link)
│   ├── dashboard/         # Dashboard page
│   └── work-order/        # Work order detail pages
├── components/            # React components
│   ├── forms/            # Form components
│   ├── work-orders/      # Work order components
│   └── ui/               # shadcn/ui components
├── lib/                   # Utilities
│   ├── db.ts             # Database client
│   ├── schema.ts         # Drizzle schema
│   ├── airtable.ts       # Airtable client
│   └── auth.ts           # Auth utilities
drizzle/                   # Database migrations
docs/                      # Documentation
```

## Deployment

See [docs/DOCKER.md](docs/DOCKER.md) for detailed deployment instructions.

**Quick deploy:**

1. Push to `main` → GitHub Actions builds image
2. Image pushed to `ghcr.io/YOUR_USERNAME/reports-app`
3. Pull and deploy to Kubernetes

## Contributing

See [CLAUDE.md](CLAUDE.md) for development patterns and guidelines.
