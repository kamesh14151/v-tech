# Production Architecture

The existing Next.js UI remains the presentation layer. The new Python service owns AI orchestration.

```text
Browser
  |
  v
Next.js /workspace
  |
  +--> /api/news --------------------> existing live article feed
  |
  +--> /api/analyze -----------------> Python Agent API
                                          |
                                          v
                                       LangGraph
                                          |
              +-------------------------+-------------------------+
              |                         |                         |
          Discovery                Validation                Clustering
              |                         |                         |
              +-------------------------+-------------------------+
                                        |
                                   Importance
                                        |
                                     Summary
                                        |
                              structured report
                                        |
                                        v
                              Existing dashboard
```

## Why one LLM is still multi-agent
All five agents may use the same Gemini model. Agent boundaries are defined by state, responsibility, prompt, tools, schemas, and tests — not by requiring five different model providers.

## Production controls
- Pydantic validation at every agent boundary.
- Explicit request timeouts.
- Deterministic IDs for articles/stories.
- Structured agent trace for observability.
- FastAPI liveness/readiness endpoints.
- PostgreSQL + pgvector available for durable retrieval/semantic deduplication.
- Redis available for future background jobs/caching.
- Provider failures should degrade to deterministic behavior rather than fabricate evidence.
- Secrets are environment variables only.
