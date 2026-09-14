# Optimus / v-tech LangGraph Team Plan

## Rule
Five members own five graph-level agents. Each member works only on their feature branch and submits a PR into `main`.

| Member | Branch | Agent | Contract |
|---|---|---|---|
| 1 | `feature/agent-discovery` | Semantic Discovery | raw_articles → relevant_articles |
| 2 | `feature/agent-validation` | Context Validation | relevant_articles → validated_articles |
| 3 | `feature/agent-clustering` | Story Clustering | validated_articles → stories |
| 4 | `feature/agent-importance` | Importance Analysis | stories → scored_stories |
| 5 | `feature/agent-summary` | Summary | scored_stories → summaries |

## Shared ownership
- `backend/app/graph/state.py`: shared state contract. Changes require team approval.
- `backend/app/graph/workflow.py`: integration owner; agents are registered here only after contract tests pass.
- `backend/app/schemas/news.py`: shared Pydantic contracts. Never return ad-hoc dictionaries from an agent.
- `backend/tests/`: contract and regression tests.

## Member 1 — Discovery
Implement semantic relevance. Use deterministic pre-filtering before the LLM, return relevance score/reason, and avoid false positives. Add tests for direct match, synonym/implicit match, and irrelevant article.

## Member 2 — Validation
Validate context, detect false positives, estimate source credibility without inventing verification. Add tests for ambiguous entities and unsupported claims.

## Member 3 — Clustering
Group articles covering the same underlying event. Do not cluster merely related topics. Story IDs must be deterministic and stable.

## Member 4 — Importance
Score impact and urgency conservatively. Define explainable impact signals. Add tests for low/medium/high/critical cases.

## Member 5 — Summary
Produce grounded executive summaries from scored stories only. Never invent facts, sources, quotes, or citations. Add tests for concise summaries and action recommendations.

## PR checklist
- [ ] Branch is the assigned feature branch.
- [ ] Only owned agent + tests/docs changed.
- [ ] `pytest` passes.
- [ ] No API keys committed.
- [ ] No `print()` debugging.
- [ ] Pydantic contract preserved.
- [ ] Error behavior is explicit.
- [ ] PR description includes test evidence.
