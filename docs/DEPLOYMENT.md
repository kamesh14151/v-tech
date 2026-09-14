# Deployment

## Services

- Next.js frontend
- FastAPI + LangGraph agent service
- PostgreSQL with pgvector
- Redis

Use the same PostgreSQL instance for V-Tech application data and LangGraph audit/vector data.

## Required secrets

Configure the variables in `.env.example`. Never commit real API keys, database passwords, or service tokens.

## Docker

Run `docker compose up --build` for the integrated stack.

For production, use managed PostgreSQL/pgvector and Redis where appropriate, terminate TLS at the platform/load balancer, and restrict the FastAPI service to internal network access. Set `ENVIRONMENT=production` and `AGENT_SERVICE_TOKEN` so internal `/v1/*` requests require the service token.
