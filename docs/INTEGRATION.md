# v-tech integration steps

This package is an overlay, not a replacement for the existing UI source.

## 1. Keep the current v-tech repository
Do not delete the existing `app/`, `components/`, `lib/`, or `public/` folders.

## 2. Copy the new backend
Copy `backend/` and `docker-compose.yml` from this package into the v-tech repository.

## 3. Configure the agent service
```bash
cd backend
cp .env.example .env
# fill GEMINI_API_KEY, NEWSAPI_KEY and GUARDIAN_API_KEY
```

## 4. Run infrastructure
```bash
docker compose up --build
```

Agent API: `http://localhost:8000`
Swagger: `http://localhost:8000/docs`

## 5. Point Next.js to the agent backend
Add to the Next.js `.env.local`:
```env
AGENT_BACKEND_URL=http://127.0.0.1:8000
```

## 6. Replace only the analyze route
Replace the existing `app/api/analyze/route.ts` with the version in `frontend-patch/app/api/analyze/route.ts`.

The existing dashboard already POSTs to `/api/analyze`, so its UI does not need to be rewritten.

## 7. Add health proxy
Copy `frontend-patch/app/api/agent-health/route.ts` into `app/api/agent-health/route.ts`.

## 8. Verify
- Open `/workspace`.
- Select a domain.
- Confirm `/api/news` still displays articles.
- Refresh the dashboard.
- Confirm `/api/analyze` returns the same high-level fields as before.
- Open `http://localhost:8000/docs` and test `/v1/analyze`.

## 9. Production deployment
Deploy Next.js and the agent backend as separate services. Set `AGENT_BACKEND_URL` to the private service URL. Do not expose database or Redis ports publicly in production. Use managed PostgreSQL/pgvector and managed Redis where possible.
