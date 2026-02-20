# Deployment Guide

This guide covers deploying the application to various hosting platforms.

## Prerequisites

Before deploying, ensure:

1. All tests pass: `make test`
2. Build succeeds: `make build`
3. Docker builds: `make docker-build`
4. Environment variables are documented in `.env.example`

## Environment Variables

The following environment variables must be set in your hosting platform:

### Required (Core)

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `SESSION_SECRET` | Secret for session signing (32+ chars) |

### Required (Payments)

If using Stripe subscriptions:

| Variable | Description |
|----------|-------------|
| `STRIPE_SECRET_KEY` | Stripe API secret key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signature secret |
| `STRIPE_PUBLISHABLE_KEY` | Stripe publishable key |
| `APP_URL` | Public URL for Stripe return URLs |

### Optional

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 5000 | Port to listen on |
| `NODE_ENV` | development | Set to `production` in prod |
| `CONTENTFUL_SPACE_ID` | - | Contentful CMS space ID |
| `CONTENTFUL_ACCESS_TOKEN` | - | Contentful API token |

See `.env.example` and `docs/data/ENVIRONMENT_REFERENCE.md` for the complete list.

---

## Option 1: Container-based Deployment (Recommended)

Works with: **Render, Fly.io, Railway, Google Cloud Run, AWS ECS, Azure Container Apps, Kubernetes**

### Build the Docker Image

```bash
docker build -t myapp:latest .
```

### Run Locally for Testing

```bash
docker run --rm -p 5000:5000 \
  -e DATABASE_URL="postgresql://..." \
  -e SESSION_SECRET="your-secret" \
  -e NODE_ENV=production \
  myapp:latest
```

### Deploy to Cloud Providers

#### Render
1. Connect your GitHub repository
2. Select "Docker" as the environment
3. Set environment variables in the dashboard
4. Deploy

#### Fly.io
```bash
fly launch
fly secrets set DATABASE_URL="postgresql://..."
fly secrets set SESSION_SECRET="your-secret"
fly deploy
```

#### Google Cloud Run
```bash
gcloud builds submit --tag gcr.io/PROJECT_ID/myapp
gcloud run deploy myapp \
  --image gcr.io/PROJECT_ID/myapp \
  --set-env-vars DATABASE_URL="..." \
  --set-env-vars NODE_ENV=production
```

#### Railway
1. Connect your GitHub repository
2. Railway auto-detects the Dockerfile
3. Set environment variables in the dashboard
4. Deploy

---

## Option 2: PaaS Deployment (No Docker)

Works with: **Heroku, Vercel (API routes), Netlify (functions)**

### Heroku

```bash
# Login
heroku login

# Create app
heroku create myapp

# Set buildpack
heroku buildpacks:set heroku/nodejs

# Set environment variables
heroku config:set DATABASE_URL="postgresql://..."
heroku config:set SESSION_SECRET="your-secret"
heroku config:set NODE_ENV=production

# Deploy
git push heroku main
```

---

## Database Setup

### Run Migrations

Before the app starts (or as part of your deployment pipeline):

```bash
npm run db:push
```

For production databases, run migrations via a one-off process or build step.

---

## Health Checks

The application exposes a health endpoint:

```
GET /health
```

Configure your load balancer or container orchestrator to use this endpoint.

### Example Health Check Configuration

- **Path**: `/health`
- **Interval**: 30 seconds
- **Timeout**: 10 seconds
- **Healthy threshold**: 2
- **Unhealthy threshold**: 3

---

## Graceful Shutdown

The application handles `SIGTERM` signals for graceful shutdown:

1. Stops accepting new connections
2. Completes in-flight requests
3. Closes database connections
4. Exits cleanly

Container orchestrators (Kubernetes, ECS, Cloud Run) send `SIGTERM` before terminating containers.

---

## Logging

Logs are written to stdout/stderr in a structured format.

For production monitoring, pipe logs to your preferred service:
- **Datadog**: Use the Datadog agent
- **Papertrail**: Configure syslog forwarding
- **CloudWatch**: Use AWS-native logging
- **Stackdriver**: Use GCP-native logging

---

## Scaling

### Horizontal Scaling

The application is stateless and can be scaled horizontally:

```bash
# Kubernetes
kubectl scale deployment myapp --replicas=3

# Cloud Run
gcloud run services update myapp --max-instances=10

# Fly.io
fly scale count 3
```

### Session Storage

If using sessions, ensure they are stored in Redis or the database (not in-memory) for multi-instance deployments.

---

## Troubleshooting

### Container won't start

1. Check environment variables are set
2. Verify database is accessible
3. Check logs: `docker logs <container_id>`

### Health check failing

1. Ensure `/health` endpoint returns 200
2. Check if database connection is healthy
3. Increase health check timeout if startup is slow

### Database connection issues

1. Verify `DATABASE_URL` format
2. Check network/firewall rules
3. Ensure database accepts connections from your host
