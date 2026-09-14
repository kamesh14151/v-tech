# v-tech

This is a [Next.js](https://nextjs.org) project bootstrapped with [v0](https://v0.app).

## Built with v0

This repository is linked to a [v0](https://v0.app) project. You can continue developing by visiting the link below -- start new chats to make changes, and v0 will push commits directly to this repo. Every merge to `main` will automatically deploy.

[Continue working on v0 →](https://v0.app/chat/projects/prj_lBRu9l0SpF8BWL6cpIeAVoA3rMAc)

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Learn More

To learn more, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.
- [v0 Documentation](https://v0.app/docs) - learn about v0 and how to use it.

## LangGraph Backend Upgrade

This repository now contains the original V-Tech Next.js application plus a FastAPI/LangGraph media-intelligence backend.

### Analysis pipeline

`Discovery → Validation → Clustering → Importance → Summary`

The existing authenticated Next.js `/api/analyze` endpoint proxies to FastAPI `/v1/analyze`. The existing `/api/news` route remains in Next.js for the live feed.

### Local development

1. Copy `.env.example` to `.env` and configure API keys/secrets.
2. Start PostgreSQL/pgvector and Redis with `docker compose up -d postgres redis`.
3. Start FastAPI with `cd backend && pip install -r requirements.txt && uvicorn app.main:app --reload --port 8000`.
4. Start Next.js with `npm ci && npm run dev`.

### Full Docker stack

`docker compose up --build`

Frontend: `http://localhost:3000`
FastAPI: `http://localhost:8000`

The browser continues to use the V-Tech UI and authenticated Next.js routes; internal LangGraph services are not required to be exposed to the browser.
