# File manifest

## Add to v-tech
```text
backend/
  app/main.py
  app/core/{config.py,logging.py}
  app/api/routes/{analyze.py,health.py}
  app/agents/{discovery.py,validation.py,clustering.py,importance.py,summary.py}
  app/graph/{state.py,workflow.py}
  app/schemas/news.py
  app/services/{llm.py,news_ingestion.py}
  db/init.sql
  Dockerfile
  requirements.txt
  .env.example
  pytest.ini

docker-compose.yml
```

## Replace
```text
app/api/analyze/route.ts
```
with `frontend-patch/app/api/analyze/route.ts`.

## Add
```text
app/api/agent-health/route.ts
```
from `frontend-patch/app/api/agent-health/route.ts`.

## Keep unchanged for the first integration
```text
app/workspace/page.tsx
components/workspace/workspace-layout.tsx
components/workspace/modules/executive-dashboard.tsx
app/api/news/route.ts
app/api/preferences/route.ts
app/api/rules/route.ts
app/api/send-email/route.ts
lib/export-pdf.ts
lib/export-word.ts
lib/schema.sql
lib/db.ts
```

The email and extraction routes are intentionally called out as technical-debt items in the audit. They should be hardened after the five-agent path is stable.
