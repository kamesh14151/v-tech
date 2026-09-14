# Five-Agent Architecture

The analysis workflow is implemented with LangGraph and five separate stages:

1. **Discovery Agent** — semantic relevance discovery with deterministic pre-filtering.
2. **Validation Agent** — contextual validation and credibility checks.
3. **Clustering Agent** — groups articles describing the same underlying event.
4. **Importance Agent** — evaluates impact, urgency, signals, and sentiment.
5. **Summary Agent** — produces grounded executive summaries and recommended actions.

Shared state is defined in `backend/app/graph/state.py`; graph wiring is in `backend/app/graph/workflow.py`.
