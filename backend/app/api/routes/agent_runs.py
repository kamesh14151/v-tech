"""GET /v1/agent-runs — Agent observability endpoints."""
from __future__ import annotations
import json

import psycopg
from fastapi import APIRouter, Query

from app.core.config import settings

router = APIRouter()


@router.get('/agent-runs')
async def list_agent_runs(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    """List recent pipeline runs with per-run aggregated metrics."""
    try:
        url = settings.database_url.replace('+psycopg', '')
        with psycopg.connect(url) as conn:
            rows = conn.execute(
                '''SELECT request_id, query, status, created_at
                   FROM agent_runs ORDER BY created_at DESC LIMIT %s OFFSET %s''',
                (limit, offset),
            ).fetchall()
            runs = []
            for r in rows:
                run_id = str(r[0])
                # Aggregate per-run metrics from agent_run_logs
                metrics = conn.execute(
                    '''SELECT SUM(input_tokens + output_tokens), SUM(cost_usd), SUM(latency_ms),
                              COUNT(DISTINCT agent_name)
                       FROM agent_run_logs WHERE run_id = %s''',
                    (run_id,),
                ).fetchone()
                runs.append({
                    'run_id': run_id,
                    'query': r[1],
                    'status': r[2],
                    'created_at': r[3].isoformat() if hasattr(r[3], 'isoformat') else str(r[3]),
                    'total_tokens': int(metrics[0] or 0),
                    'total_cost_usd': round(float(metrics[1] or 0), 6),
                    'total_latency_ms': round(float(metrics[2] or 0), 1),
                    'agents_run': int(metrics[3] or 0),
                })
        return {'runs': runs, 'count': len(runs)}
    except Exception as exc:
        return {'runs': [], 'count': 0, 'error': str(exc)}


@router.get('/agent-runs/{run_id}')
async def get_agent_run(run_id: str):
    """Get full per-agent breakdown for a single pipeline run."""
    try:
        url = settings.database_url.replace('+psycopg', '')
        with psycopg.connect(url) as conn:
            run_row = conn.execute(
                'SELECT request_id, query, status, trace, created_at FROM agent_runs WHERE request_id = %s::uuid',
                (run_id,),
            ).fetchone()
            if not run_row:
                return {'error': 'Run not found'}
            log_rows = conn.execute(
                '''SELECT agent_name, model, input_tokens, output_tokens, latency_ms, cost_usd, confidence, created_at
                   FROM agent_run_logs WHERE run_id = %s ORDER BY created_at ASC''',
                (run_id,),
            ).fetchall()
        agent_logs = [
            {
                'agent_name': r[0], 'model': r[1],
                'input_tokens': r[2], 'output_tokens': r[3],
                'latency_ms': r[4], 'cost_usd': r[5], 'confidence': r[6],
                'created_at': r[7].isoformat() if hasattr(r[7], 'isoformat') else str(r[7]),
            }
            for r in log_rows
        ]
        return {
            'run_id': str(run_row[0]),
            'query': run_row[1],
            'status': run_row[2],
            'created_at': run_row[4].isoformat() if hasattr(run_row[4], 'isoformat') else str(run_row[4]),
            'agent_logs': agent_logs,
            'total_tokens': sum(l['input_tokens'] + l['output_tokens'] for l in agent_logs),
            'total_cost_usd': round(sum(l['cost_usd'] for l in agent_logs), 6),
            'total_latency_ms': round(sum(l['latency_ms'] for l in agent_logs), 1),
        }
    except Exception as exc:
        return {'error': str(exc)}
