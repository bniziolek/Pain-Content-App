# Application

A modern web application with React frontend and Express backend.

## Quick Start

```bash
# Install dependencies
make setup

# Start development server
make dev

# Run tests
make test

# Build for production
make build

# Start production server
make start
```

## Requirements

- Node.js 20.x (see `.nvmrc`)
- PostgreSQL 16+

## Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd <project-directory>
   ```

2. **Install dependencies**
   ```bash
   make setup
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your values
   ```

4. **Start database** (if using Docker)
   ```bash
   make docker-up
   ```

5. **Run migrations**
   ```bash
   make migrate
   ```

6. **Start development server**
   ```bash
   make dev
   ```

The app will be available at http://localhost:5000

## Environment Variables

See `.env.example` for all available variables.

Required:
- `DATABASE_URL` - PostgreSQL connection string
- `SESSION_SECRET` - Session encryption key (32+ chars)

See `docs/data/ENVIRONMENT_REFERENCE.md` for complete documentation.

## Available Commands

| Command | Description |
|---------|-------------|
| `make setup` | Install dependencies |
| `make dev` | Start development server |
| `make test` | Run tests |
| `make build` | Build for production |
| `make start` | Start production server |
| `make migrate` | Run database migrations |
| `make docker-build` | Build Docker image |
| `make docker-up` | Start local services (Postgres) |

## Project Structure

```
/client          # React frontend
/server          # Express backend
/shared          # Shared types and schemas
/migrations      # Database migrations
/docs            # Documentation
```

## Deployment

See `docs/DEPLOYMENT.md` for deployment instructions.

### Docker

```bash
# Build image
make docker-build

# Run container
docker run -p 5000:5000 --env-file .env app:latest
```

## Network Configuration

- Binds to `0.0.0.0` for container compatibility
- Listens on `PORT` environment variable (default: 5000)
- Health check: `GET /health`

## License

MIT
