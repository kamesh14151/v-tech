from fastapi import APIRouter
import psycopg
from app.core.config import settings
from app.services.llm import llm

router = APIRouter()

@router.get('/health/live')
async def live():
    return {'status': 'ok', 'service': settings.app_name}

@router.get('/health/ready')
async def ready():
    client = llm.client
    llm_ready = bool(client and getattr(client, 'available', False))
    
    db_connected = False
    try:
        url = settings.database_url.replace('+psycopg', '')
        with psycopg.connect(url, connect_timeout=3) as conn:
            with conn.cursor() as cur:
                cur.execute('SELECT 1;')
                db_connected = True
    except Exception:
        db_connected = False

    return {
        'status': 'ready' if (llm_ready and db_connected) else 'degraded',
        'llm': {
            'ready': llm_ready,
            'provider': 'Vercel AI Gateway',
            'model': llm.model_name(),
        },
        'database': {
            'connected': db_connected,
        },
        'news_sources': bool(settings.newsapi_key or settings.guardian_api_key),
    }
