# GHCR & Docker Setup - Complete!

## What Was Created

### 1. Docker Configuration

#### `Dockerfile`
- Multi-stage build (builder + runner)
- Alpine Linux base (optimized size)
- Non-root user for security
- Standalone Next.js output

#### `.dockerignore`
- Excludes unnecessary files from Docker context
- Reduces build time and image size

#### `docker-compose.yml` (Production)
- Full stack: Next.js app + PostgreSQL
- Health checks for database
- Environment variable configuration
- Persistent volumes for database

#### `docker-compose.dev.yml` (Development)
- PostgreSQL only
- Separate dev database
- Easy local development

### 2. Next.js Configuration

#### `next.config.ts`
- Added `output: 'standalone'` for Docker builds

### 3. GitHub Actions

#### `.github/workflows/docker-build.yml`
- Automatic builds on push to `main` or `develop`
- Tags: `latest`, `develop`, `v1.2.3`, `main-abc123`
- Pushes to GitHub Container Registry (GHCR)
- Multi-platform builds (amd64, arm64)
- Build cache for faster builds

### 4. Kubernetes Deployment

#### `k8s/deployment.yaml`
- Complete K8s manifests:
  - Namespace
  - ConfigMap (non-sensitive config)
  - Secret (sensitive data)
  - Deployment (2 replicas, rolling updates)
  - Service (ClusterIP)
  - Ingress (HTTPS with cert-manager)
  - HorizontalPodAutoscaler (2-10 pods)

### 5. Health Check

#### `src/app/api/health/route.ts`
- Health endpoint at `/api/health`
- Checks database connection
- Used by Kubernetes probes

### 6. Environment Configuration

#### `.env.example`
- Updated for new architecture:
  - Removed Supabase
  - Added JWT_SECRET
  - Added RESEND_API_KEY
  - Self-hosted PostgreSQL

### 7. Documentation

#### `README.md`
- Updated with project overview
- Quick start guide
- Docker commands

#### `docs/DOCKER.md`
- Comprehensive Docker guide
- GHCR setup instructions
- Kubernetes deployment guide
- Troubleshooting section

## How GHCR Works

1. **You push code** to GitHub (main or develop branch)
2. **GitHub Actions triggers** automatically
3. **Workflow builds** Docker image
4. **Image pushed** to `ghcr.io/YOUR_USERNAME/reports-app`
5. **Tagged** with branch name, commit SHA, and `latest`

## Next Steps

### Step 1: Enable GHCR Permissions

1. Go to your GitHub repository
2. Settings → Actions → General
3. Under "Workflow permissions":
   - Select "Read and write permissions"
   - Check "Allow GitHub Actions to create and approve pull requests"
4. Click "Save"

### Step 2: Test Local Build

```bash
# Build the Docker image locally
docker build -t reports-app:test .

# Run it (make sure you have .env.local with DATABASE_URL)
docker run -p 3000:3000 --env-file .env.local reports-app:test
```

### Step 3: Push to GitHub (Trigger Build)

```bash
# Commit the new files
git add .
git commit -m "feat: add Docker and GHCR setup"

# Push to main (triggers GitHub Actions)
git push origin main
```

### Step 4: Check GitHub Actions

1. Go to your repository on GitHub
2. Click "Actions" tab
3. Watch the "Build and Push to GHCR" workflow
4. Wait for it to complete (2-5 minutes)

### Step 5: Verify Image in GHCR

1. Go to your repository on GitHub
2. Click "Packages" (right sidebar)
3. You should see `reports-app` package
4. Click it to see tags and details

### Step 6: Set Package Visibility (Important!)

1. In the package view, click "Package settings"
2. Under "Danger Zone" → "Change package visibility"
3. Choose:
   - **Public** if you want anyone to pull
   - **Private** and add your Kubernetes cluster as a collaborator

### Step 7: Create GHCR Secret for Kubernetes

```bash
# Create a GitHub Personal Access Token (PAT)
# 1. Go to GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
# 2. Generate new token with scopes: read:packages, write:packages
# 3. Copy the token

# Create Kubernetes secret
kubectl create secret docker-registry ghcr-secret \
  --docker-server=ghcr.io \
  --docker-username=YOUR_GITHUB_USERNAME \
  --docker-password=YOUR_GITHUB_PAT \
  --docker-email=YOUR_EMAIL \
  --namespace=reports-app
```

### Step 8: Create Kubernetes Secrets

```bash
# Base64 encode your secrets
echo -n "postgresql://user:pass@host:5432/db" | base64

# Edit k8s/deployment.yaml and replace all REPLACE comments
# with your base64-encoded secrets

# Apply to cluster
kubectl apply -f k8s/deployment.yaml
```

### Step 9: Deploy to Kubernetes

```bash
# Apply the manifests
kubectl apply -f k8s/deployment.yaml

# Check deployment status
kubectl get pods -n reports-app
kubectl get svc -n reports-app
kubectl get ingress -n reports-app

# Check logs
kubectl logs -f deployment/reports-app -n reports-app

# Check health
kubectl exec -it deployment/reports-app -n reports-app -- curl localhost:3000/api/health
```

## Testing the Setup

### Test 1: Local Docker Build
```bash
docker build -t test .
# Should complete without errors
```

### Test 2: Local Docker Compose (Dev)
```bash
docker-compose -f docker-compose.dev.yml up -d
npm run dev
# App should connect to PostgreSQL
```

### Test 3: Local Docker Compose (Full Stack)
```bash
docker-compose up --build
curl http://localhost:3000/api/health
# Should return {"status":"healthy"}
```

### Test 4: GitHub Actions Build
```bash
git push origin main
# Check Actions tab, build should succeed
```

### Test 5: Pull from GHCR
```bash
echo $GITHUB_PAT | docker login ghcr.io -u YOUR_USERNAME --password-stdin
docker pull ghcr.io/YOUR_USERNAME/reports-app:latest
# Should download successfully
```

## Troubleshooting

### Build Fails: "Cannot read properties of undefined"
- Make sure all environment variables are set
- Check `next.config.ts` has `output: 'standalone'`

### GitHub Actions: Permission Denied
- Enable "Read and write permissions" in Settings → Actions

### Kubernetes: ImagePullBackOff
- Create `ghcr-secret` with correct credentials
- Set package visibility to Public or add cluster as collaborator

### Health Check Fails
- Verify `DATABASE_URL` is correct
- Check database is accessible from container
- Look at logs: `kubectl logs deployment/reports-app -n reports-app`

## Architecture Migration Notes

We've set up the infrastructure, but you still need to:

1. **Remove Supabase dependencies** from code
2. **Implement magic link auth** (replace Supabase Auth)
3. **Update database connection** to use self-hosted PostgreSQL
4. **Implement S3 storage** (replace Supabase Storage)

These will be separate tasks. The Docker/GHCR setup is ready!

## Resources

- [GitHub Container Registry Docs](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry)
- [Docker Multi-stage Builds](https://docs.docker.com/build/building/multi-stage/)
- [Next.js Docker Example](https://github.com/vercel/next.js/tree/canary/examples/with-docker)
- [Kubernetes Secrets](https://kubernetes.io/docs/concepts/configuration/secret/)

## Questions?

Check [docs/DOCKER.md](DOCKER.md) for detailed guides or ask for help!
