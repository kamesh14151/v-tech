from fastapi import APIRouter
from app.core.config import settings
router=APIRouter()
@router.get('/health/live')
async def live(): return {'status':'ok','service':settings.app_name}
@router.get('/health/ready')
async def ready(): return {'status':'ready','llm_configured':bool(settings.gemini_api_key),'news_sources':bool(settings.newsapi_key or settings.guardian_api_key)}
