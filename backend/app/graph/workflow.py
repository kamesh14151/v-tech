"""
LangGraph Workflow — Production parallel pipeline.

Graph structure:
    START
      → discover
      → validate
      → cluster
      → [PARALLEL: topic_node | impact_node | entity_node | sentiment_node]
      → importance      (merges all parallel results)
      → summary
      → END

The four parallel nodes (topic/impact/entity/sentiment) run simultaneously after clustering,
then importance waits for all four before proceeding.

All nodes log AgentLog entries to state["agent_logs"].
"""
from __future__ import annotations
import asyncio
import uuid
from datetime import datetime, timezone

from langgraph.graph import StateGraph, START, END

from app.graph.state import NewsState
from app.agents import (
    discovery, validation, clustering,
    topic_agent, impact_agent, entity_agent, sentiment_agent,
    importance, summary,
)


# ─── Node functions ─────────────────────────────────────────────────────────

async def discover_node(state: NewsState) -> dict:
    relevant, logs = await discovery.run(
        state.get('raw_articles', []),
        state.get('query', ''),
        state.get('agent_logs', []),
    )
    return {'relevant_articles': relevant, 'agent_logs': logs}


async def validate_node(state: NewsState) -> dict:
    validated, logs = await validation.run(
        state.get('relevant_articles', []),
        state.get('query', ''),
        state.get('agent_logs', []),
    )
    return {'validated_articles': validated, 'agent_logs': logs}


async def cluster_node(state: NewsState) -> dict:
    stories, logs = await clustering.run(
        state.get('validated_articles', []),
        state.get('agent_logs', []),
    )
    return {'stories': stories, 'agent_logs': logs}


async def topic_node(state: NewsState) -> dict:
    analyses, logs = await topic_agent.run(
        state.get('stories', []),
        state.get('agent_logs', []),
    )
    return {'topic_analyses': analyses, 'agent_logs': logs}


async def impact_node(state: NewsState) -> dict:
    analyses, logs = await impact_agent.run(
        state.get('stories', []),
        state.get('query', ''),
        state.get('agent_logs', []),
    )
    return {'impact_analyses': analyses, 'agent_logs': logs}


async def entity_node(state: NewsState) -> dict:
    analyses, logs = await entity_agent.run(
        state.get('stories', []),
        state.get('agent_logs', []),
    )
    return {'entity_analyses': analyses, 'agent_logs': logs}


async def sentiment_node(state: NewsState) -> dict:
    analyses, logs = await sentiment_agent.run(
        state.get('stories', []),
        state.get('agent_logs', []),
    )
    return {'sentiment_analyses': analyses, 'agent_logs': logs}


async def importance_node(state: NewsState) -> dict:
    scored, alerts, logs = await importance.run(
        state.get('stories', []),
        state.get('topic_analyses', []),
        state.get('impact_analyses', []),
        state.get('entity_analyses', []),
        state.get('agent_logs', []),
        sentiment_analyses=state.get('sentiment_analyses', []),
        run_id=state.get('run_id', ''),
    )
    return {'scored_stories': scored, 'alerts': alerts, 'agent_logs': logs}


async def summary_node(state: NewsState) -> dict:
    summaries, logs = await summary.run(
        state.get('scored_stories', []),
        state.get('agent_logs', []),
    )
    return {'summaries': summaries, 'agent_logs': logs}


# ─── Graph builder ───────────────────────────────────────────────────────────

def build_graph():
    g = StateGraph(NewsState)

    # Register nodes
    g.add_node('discover', discover_node)
    g.add_node('validate', validate_node)
    g.add_node('cluster', cluster_node)
    g.add_node('topic', topic_node)
    g.add_node('impact', impact_node)
    g.add_node('entity', entity_node)
    g.add_node('sentiment', sentiment_node)
    g.add_node('importance', importance_node)
    g.add_node('summary', summary_node)

    # Sequential backbone
    g.add_edge(START, 'discover')
    g.add_edge('discover', 'validate')
    g.add_edge('validate', 'cluster')

    # Parallel fan-out: cluster → [topic, impact, entity, sentiment]
    g.add_edge('cluster', 'topic')
    g.add_edge('cluster', 'impact')
    g.add_edge('cluster', 'entity')
    g.add_edge('cluster', 'sentiment')

    # Fan-in: all four → importance (LangGraph waits for all predecessors)
    g.add_edge('topic', 'importance')
    g.add_edge('impact', 'importance')
    g.add_edge('entity', 'importance')
    g.add_edge('sentiment', 'importance')

    # Final sequential stages
    g.add_edge('importance', 'summary')
    g.add_edge('summary', END)

    return g.compile()


graph = build_graph()
