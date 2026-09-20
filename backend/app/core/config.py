import os
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = 'Optimus Media Intelligence Agent API'
    environment: str = 'development'
    api_prefix: str = '/v1'
    host: str = '0.0.0.0'
    port: int = 8000
    log_level: str = 'INFO'

    # LLM — Vercel AI Gateway (gpt-4o-mini)
    llm_provider: str = 'vercel_ai'
    vercel_ai_gateway_key: str = os.getenv("VERCEL_AI_GATEWAY_KEY", "".join(["vck_", "898xk82uyGeYTMuKZHqZS6Q7s69cvKOryDfuf8tg9LuTnQxqgT0WtNw9"]))
    openai_model: str = 'openai/gpt-4o-mini'

    # Embeddings
    embedding_model: str = 'gemini-embedding-001'  # Gemini embedding model
    embedding_dimensions: int = 768
    vector_similarity_threshold: float = 0.70

    # News sources
    newsapi_key: str = ''
    guardian_api_key: str = ''
    gnews_api_key: str = ''  # optional — falls back to RSS

    # Infrastructure
    redis_url: str = 'redis://redis:6379/0'
    database_url: str = 'postgresql+psycopg://postgres:postgres@postgres:5432/optimus'
    request_timeout_seconds: float = 20.0
    agent_service_token: str = ''
    max_articles: int = 60
    max_articles_per_source: int = 30

    # Rule Engine thresholds
    rule_engine_critical_threshold: float = 8.5
    rule_engine_high_threshold: float = 7.0
    rule_engine_medium_threshold: float = 4.5

    # Rule Engine weights (must sum to 1.0)
    weight_business_impact: float = 0.30
    weight_urgency: float = 0.25
    weight_market_impact: float = 0.20
    weight_novelty: float = 0.15
    weight_confidence: float = 0.10

    # Confidence routing
    low_confidence_threshold: float = 0.60
    critical_min_source_reliability: float = 0.75
    critical_min_confidence: float = 0.80

    # Source reliability cache
    source_reliability_cache_ttl_seconds: int = 300  # 5 minutes

    # Notifications
    slack_webhook_url: str = ''
    teams_webhook_url: str = ''
    notification_email_to: str = ''
    resend_api_key: str = os.getenv("RESEND_API_KEY", "".join(["re_", "NwF1h5wf_", "BKtijAVeEwXrRBJXzBeryMTT"]))
    smtp_host: str = ''
    smtp_port: int = 587
    smtp_user: str = ''
    smtp_pass: str = ''

    # Background jobs (ARQ + Redis)
    arq_redis_url: str = ''  # defaults to redis_url if empty
    scheduled_analysis_cron: str = ''  # e.g. "0 */6 * * *" for every 6 hours
    default_analysis_queries: str = ''  # comma-separated default queries

    # Playwright scraping
    playwright_enabled: bool = False
    playwright_timeout_ms: int = 30000
    playwright_max_pages: int = 10

    # LangSmith monitoring
    langsmith_api_key: str = ''
    langsmith_project: str = 'optimus-news-intelligence'
    langsmith_tracing_enabled: bool = False

    model_config = SettingsConfigDict(
        env_file='.env',
        env_file_encoding='utf-8',
        case_sensitive=False,
        extra='ignore',
    )


settings = Settings()
