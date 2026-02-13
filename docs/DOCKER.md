# Docker & GitHub Container Registry Setup

## Overview

This project uses Docker for containerization and GitHub Container Registry (GHCR) for image storage.

**What gets containerized:**
- Next.js application (multi-stage build for optimization)
- PostgreSQL database (official image)

## Prerequisites

- Docker Desktop installed
- Docker Compose installed
- GitHub account with repository access

## Local Development

### Option 1: Run PostgreSQL only (recommended for development)

```bash
# Start PostgreSQL in the background
docker-compose -f docker-compose.dev.yml up -d

# Your local connection string:
# DATABASE_URL=postgresql://postgres:postgres@localhost:5432/reports_app_dev

# Run migrations
npm run db:push

# Start Next.js in development mode (on your host machine)
npm run dev

# Stop PostgreSQL when done
docker-compose -f docker-compose.dev.yml down
```

### Option 2: Run full stack (production-like)

```bash
# Build and start everything
docker-compose up --build

# App will be available at http://localhost:3000
# PostgreSQL at localhost:5432

# Stop everything
docker-compose down

# Clean up volumes (WARNING: deletes all data)
docker-compose down -v
```

## GitHub Container Registry (GHCR)

### How It Works

1. **Push to GitHub** → Triggers GitHub Actions workflow
2. **Workflow builds** Docker image
3. **Image pushed** to `ghcr.io/YOUR_USERNAME/reports-app`
4. **Tagged** with:
   - `latest` (for main branch)
   - `develop` (for develop branch)
   - `v1.2.3` (for version tags)
   - `main-abc123` (commit SHA)

### Automatic Builds

The `.github/workflows/docker-build.yml` workflow automatically builds and pushes on:

- **Push to `main` or `develop` branch**
- **Creating a version tag** (e.g., `v1.0.0`)
- **Pull requests** (build only, no push)

### Manual Build and Push

```bash
# Log in to GHCR
echo $GITHUB_TOKEN | docker login ghcr.io -u YOUR_USERNAME --password-stdin

# Build the image
docker build -t ghcr.io/YOUR_USERNAME/reports-app:latest .

# Push to GHCR
docker push ghcr.io/YOUR_USERNAME/reports-app:latest
```

### Pull and Run

```bash
# Log in to GHCR (if image is private)
echo $GITHUB_TOKEN | docker login ghcr.io -u YOUR_USERNAME --password-stdin

# Pull the image
docker pull ghcr.io/YOUR_USERNAME/reports-app:latest

# Run it
docker run -p 3000:3000 \
  -e DATABASE_URL="postgresql://user:pass@host:5432/db" \
  -e AIRTABLE_API_KEY="..." \
  ghcr.io/YOUR_USERNAME/reports-app:latest
```

## Kubernetes Deployment

### Create Secret for GHCR

```bash
# Create a GitHub Personal Access Token with `read:packages` permission
# Then create Kubernetes secret:
kubectl create secret docker-registry ghcr-secret \
  --docker-server=ghcr.io \
  --docker-username=YOUR_USERNAME \
  --docker-password=YOUR_GITHUB_TOKEN \
  --docker-email=YOUR_EMAIL
```

### Deploy to Kubernetes

```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: reports-app
spec:
  replicas: 2
  selector:
    matchLabels:
      app: reports-app
  template:
    metadata:
      labels:
        app: reports-app
    spec:
      imagePullSecrets:
        - name: ghcr-secret
      containers:
        - name: app
          image: ghcr.io/YOUR_USERNAME/reports-app:latest
          ports:
            - containerPort: 3000
          env:
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: app-secrets
                  key: database-url
            - name: AIRTABLE_API_KEY
              valueFrom:
                secretKeyRef:
                  name: app-secrets
                  key: airtable-api-key
            # Add other env vars...
          livenessProbe:
            httpGet:
              path: /api/health
              port: 3000
            initialDelaySeconds: 30
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /api/health
              port: 3000
            initialDelaySeconds: 10
            periodSeconds: 5
```

## Environment Variables

The Docker container needs these environment variables:

```bash
# Database
DATABASE_URL=postgresql://user:password@host:5432/database

# Airtable
AIRTABLE_API_KEY=key...
AIRTABLE_BASE_ID_DEBLOQ=app...

# n8n
N8N_WEBHOOK_URL=https://...
N8N_WEBHOOK_SECRET=...

# Auth
JWT_SECRET=your-super-secret-key-min-32-chars
RESEND_API_KEY=re_...

# App
NEXT_PUBLIC_APP_URL=https://reports.bloqit.io
```

## Troubleshooting

### Image not found / 404
- Ensure the GitHub Actions workflow completed successfully
- Check that the repository's package visibility is set correctly:
  - Go to repository → Packages → Package settings
  - Set visibility to Public or give access to your Kubernetes cluster

### Permission denied
- Verify your GitHub token has `read:packages` and `write:packages` scopes
- For Kubernetes, ensure the `ghcr-secret` is created in the correct namespace

### Build fails
- Check GitHub Actions logs for detailed error messages
- Verify `next.config.ts` has `output: 'standalone'`
- Ensure all dependencies are in `package.json`

### Database connection issues
- Verify `DATABASE_URL` is correct
- For docker-compose, use service name (`db`) not `localhost`
- For external DB, ensure network connectivity and firewall rules

## Database Migrations

Run migrations in the container:

```bash
# For docker-compose
docker-compose exec app npm run db:push

# For Kubernetes
kubectl exec -it deployment/reports-app -- npm run db:push
```

## Health Checks

The app should expose a health endpoint at `/api/health` for Kubernetes probes.

## Image Size Optimization

Current optimizations:
- Multi-stage build (builder + runner)
- Alpine Linux base image (~40MB)
- Only production dependencies in final image
- `.dockerignore` excludes unnecessary files

Typical image size: ~200-300MB (Next.js + Node.js + dependencies)

## Security Best Practices

- Non-root user (`nextjs`) runs the app
- Secrets via environment variables (never baked into image)
- Use specific image tags in production (not `latest`)
- Regular security updates: `docker pull node:20-alpine`
- Scan images: `docker scan ghcr.io/YOUR_USERNAME/reports-app:latest`
