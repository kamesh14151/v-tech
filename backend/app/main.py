from contextlib import asynccontextmanager
import secrets

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.core.logging import configure_logging
from app.api.routes.health import router as health_router
from app.api.routes.analyze import router as analyze_router
from app.api.routes.stories import router as stories_router
from app.api.routes.agent_runs import router as agent_runs_router
from app.api.routes.alerts import router as alerts_router
from app.api.routes.explain import router as explain_router
from app.api.routes.jobs import router as jobs_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: pre-warm the LangGraph graph, configure tracing, log provider info."""
    import logging
    import os
    log = logging.getLogger(__name__)
    from app.services.llm import llm
    provider = llm.client
    log.info('LLM provider: %s | model: %s', settings.llm_provider, llm.model_name())

    # ── LangSmith tracing ─────────────────────────────────────────────
    if settings.langsmith_api_key and settings.langsmith_tracing_enabled:
        os.environ['LANGCHAIN_TRACING_V2'] = 'true'
        os.environ['LANGCHAIN_API_KEY'] = settings.langsmith_api_key
        os.environ['LANGCHAIN_PROJECT'] = settings.langsmith_project
        log.info('LangSmith tracing ENABLED → project=%s', settings.langsmith_project)
    else:
        log.info('LangSmith tracing disabled (set LANGSMITH_API_KEY + LANGSMITH_TRACING_ENABLED=true to enable)')

    yield


configure_logging(settings.log_level)

app = FastAPI(
    title=settings.app_name,
    version='2.0.0',
    description='Optimus Media Intelligence — Production LangGraph Pipeline',
    lifespan=lifespan,
)

app.include_router(health_router, tags=['health'])
app.include_router(analyze_router, prefix=settings.api_prefix, tags=['analysis'])
app.include_router(stories_router, prefix=settings.api_prefix, tags=['stories'])
app.include_router(agent_runs_router, prefix=settings.api_prefix, tags=['observability'])
app.include_router(alerts_router, prefix=settings.api_prefix, tags=['alerts'])
app.include_router(explain_router, prefix=settings.api_prefix, tags=['explainability'])
app.include_router(jobs_router, prefix=settings.api_prefix, tags=['background-jobs'])


@app.middleware('http')
async def service_auth(request: Request, call_next):
    if request.url.path.startswith(settings.api_prefix):
        if settings.environment == 'production' and settings.agent_service_token:
            auth = request.headers.get('authorization', '')
            if not auth.startswith('Bearer ') or not secrets.compare_digest(auth[7:], settings.agent_service_token):
                return JSONResponse({'error': 'Unauthorized'}, status_code=401)
    return await call_next(request)

