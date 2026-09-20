"""
Model-agnostic LLM Gateway.

Supports: gemini | openai | anthropic
Controlled by LLM_PROVIDER env var.

Also provides embed() for generating vector embeddings via Gemini text-embedding-004.
"""
from __future__ import annotations
import json
import logging
import time
from dataclasses import dataclass
from typing import Any, TypeVar

from pydantic import BaseModel, ValidationError

from app.core.config import settings

log = logging.getLogger(__name__)

T = TypeVar('T', bound=BaseModel)


@dataclass
class LLMResponse:
    result: Any
    input_tokens: int
    output_tokens: int
    latency_ms: float
    model: str
    cost_usd: float = 0.0


@dataclass
class ValidatedLLMResponse:
    """LLMResponse with Pydantic-validated result."""
    result: Any  # The validated Pydantic model or list of models
    input_tokens: int
    output_tokens: int
    latency_ms: float
    model: str
    cost_usd: float = 0.0
    retries: int = 0


# ─── Cost estimation (approximate, per 1M tokens) ──────────────────────────
_COST_TABLE = {
    # model_name: (input_cost_per_1M, output_cost_per_1M)
    'gemini-2.5-flash': (0.10, 0.40),
    'gemini-2.0-flash': (0.10, 0.40),
    'gemini-1.5-flash': (0.075, 0.30),
    'gpt-4o-mini': (0.15, 0.60),
    'gpt-4o': (2.50, 10.00),
    'claude-3-5-haiku-latest': (0.80, 4.00),
    'claude-3-5-sonnet-latest': (3.00, 15.00),
}

def _estimate_cost(model: str, input_tok: int, output_tok: int) -> float:
    in_rate, out_rate = _COST_TABLE.get(model, (0.50, 2.00))
    return round((input_tok * in_rate + output_tok * out_rate) / 1_000_000, 6)


# ─── Gemini provider ────────────────────────────────────────────────────────

class _GeminiProvider:
    def __init__(self):
        if not settings.gemini_api_key:
            self.client = None
            return
        from google import genai
        self.client = genai.Client(api_key=settings.gemini_api_key)
        self.model = settings.gemini_model

    @property
    def available(self) -> bool:
        return self.client is not None

    def json(self, system: str, prompt: str, schema: dict) -> LLMResponse:
        from google.genai import types
        t0 = time.perf_counter()
        response = self.client.models.generate_content(
            model=self.model,
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=system,
                response_mime_type='application/json',
                response_schema=schema,
                temperature=0.1,
            ),
        )
        latency_ms = (time.perf_counter() - t0) * 1000
        usage = response.usage_metadata
        in_tok = getattr(usage, 'prompt_token_count', 0) or 0
        out_tok = getattr(usage, 'candidates_token_count', 0) or 0
        result = json.loads(response.text)
        return LLMResponse(
            result=result,
            input_tokens=in_tok,
            output_tokens=out_tok,
            latency_ms=round(latency_ms, 1),
            model=self.model,
            cost_usd=_estimate_cost(self.model, in_tok, out_tok),
        )

    def embed(self, text: str) -> list[float]:
        try:
            response = self.client.models.embed_content(
                model=settings.embedding_model,
                contents=text,
            )
            return response.embeddings[0].values
        except Exception as e:
            log.warning("Gemini embedding error (%s): %s", settings.embedding_model, e)
            return []


# ─── OpenAI provider ────────────────────────────────────────────────────────

class _OpenAIProvider:
    def __init__(self):
        if not settings.openai_api_key:
            self.client = None
            return
        from openai import OpenAI
        self.client = OpenAI(api_key=settings.openai_api_key)
        self.model = settings.openai_model

    @property
    def available(self) -> bool:
        return self.client is not None

    def json(self, system: str, prompt: str, schema: dict) -> LLMResponse:
        t0 = time.perf_counter()
        response = self.client.chat.completions.create(
            model=self.model,
            messages=[
                {'role': 'system', 'content': system},
                {'role': 'user', 'content': prompt},
            ],
            response_format={'type': 'json_object'},
            temperature=0.1,
        )
        latency_ms = (time.perf_counter() - t0) * 1000
        usage = response.usage
        in_tok = usage.prompt_tokens if usage else 0
        out_tok = usage.completion_tokens if usage else 0
        content = response.choices[0].message.content or '{}'
        result = json.loads(content)
        return LLMResponse(
            result=result,
            input_tokens=in_tok,
            output_tokens=out_tok,
            latency_ms=round(latency_ms, 1),
            model=self.model,
            cost_usd=_estimate_cost(self.model, in_tok, out_tok),
        )

    def embed(self, text: str) -> list[float]:
        response = self.client.embeddings.create(
            model='text-embedding-3-small',
            input=text,
        )
        return response.data[0].embedding


# ─── Anthropic provider ─────────────────────────────────────────────────────

class _AnthropicProvider:
    def __init__(self):
        if not settings.anthropic_api_key:
            self.client = None
            return
        from anthropic import Anthropic
        self.client = Anthropic(api_key=settings.anthropic_api_key)
        self.model = settings.anthropic_model

    @property
    def available(self) -> bool:
        return self.client is not None

    def json(self, system: str, prompt: str, schema: dict) -> LLMResponse:
        t0 = time.perf_counter()
        response = self.client.messages.create(
            model=self.model,
            max_tokens=2048,
            system=system + '\n\nRespond ONLY with valid JSON matching the requested schema.',
            messages=[{'role': 'user', 'content': prompt}],
            temperature=0.1,
        )
        latency_ms = (time.perf_counter() - t0) * 1000
        usage = response.usage
        in_tok = usage.input_tokens if usage else 0
        out_tok = usage.output_tokens if usage else 0
        content = response.content[0].text if response.content else '{}'
        # Anthropic may wrap in ```json ... ```
        if '```' in content:
            content = content.split('```')[1].lstrip('json').strip()
        result = json.loads(content)
        return LLMResponse(
            result=result,
            input_tokens=in_tok,
            output_tokens=out_tok,
            latency_ms=round(latency_ms, 1),
            model=self.model,
            cost_usd=_estimate_cost(self.model, in_tok, out_tok),
        )

    def embed(self, text: str) -> list[float]:
        # Anthropic doesn't have its own embedding endpoint — fall back to Gemini
        return _gemini.embed(text) if _gemini.available else []


# ─── Gateway (singleton) ────────────────────────────────────────────────────

_gemini = _GeminiProvider()
_openai = _OpenAIProvider()
_anthropic = _AnthropicProvider()


class LLMGateway:
    """
    Unified interface for calling any configured LLM provider.
    Falls back to the next available provider if the primary is unconfigured.
    """

    def _providers(self):
        """Return list of available providers in priority order."""
        providers = []
        p = settings.llm_provider.lower()
        if p == 'openai' and _openai.available:
            providers.append(_openai)
        elif p == 'anthropic' and _anthropic.available:
            providers.append(_anthropic)
        elif _gemini.available:
            providers.append(_gemini)
        
        # Add remaining fallbacks
        for candidate in [_gemini, _openai, _anthropic]:
            if candidate.available and candidate not in providers:
                providers.append(candidate)
        return providers

    def _provider(self):
        provs = self._providers()
        return provs[0] if provs else None

    @property
    def client(self):
        """Compatibility shim: returns provider or None (used to check availability)."""
        return self._provider()

    def json(self, system: str, prompt: str, schema: dict) -> Any:
        resp = self.json_with_meta(system, prompt, schema)
        return resp.result

    def json_with_meta(self, system: str, prompt: str, schema: dict) -> LLMResponse:
        providers = self._providers()
        if not providers:
            raise RuntimeError('No LLM provider configured.')
        
        last_exc = None
        for prov in providers:
            try:
                return prov.json(system, prompt, schema)
            except Exception as exc:
                last_exc = exc
                log.warning("LLM provider %s failed (%s). Trying fallback...", getattr(prov, 'model', 'unknown'), exc)
        
        raise last_exc or RuntimeError("All LLM providers failed.")

    def json_validated(
        self,
        system: str,
        prompt: str,
        schema: dict,
        model_class: type[T],
        *,
        max_retries: int = 2,
        wrap_key: str = 'items',
    ) -> ValidatedLLMResponse:
        """
        Call LLM, validate response against a Pydantic model, retry on failure.

        The LLM returns a JSON array. This method wraps it in {wrap_key: [...]},
        then validates against model_class (which should have a list field named wrap_key).

        On ValidationError, retries up to max_retries times with an error correction prompt.

        Args:
            system: System prompt for the LLM.
            prompt: User prompt.
            schema: JSON schema for LLM structured output.
            model_class: Pydantic model to validate against (e.g. DiscoveryOutput).
            max_retries: Number of retry attempts on validation failure.
            wrap_key: Key name to wrap the array result under.

        Returns:
            ValidatedLLMResponse with Pydantic-validated result.

        Raises:
            RuntimeError: If no LLM provider is configured.
            ValidationError: If validation fails after all retries.
        """
        provider = self._provider()
        if not provider:
            raise RuntimeError('No LLM provider configured.')

        total_in_tok = 0
        total_out_tok = 0
        total_cost = 0.0
        t0 = time.perf_counter()
        last_error: Exception | None = None

        for attempt in range(1 + max_retries):
            try:
                if attempt == 0:
                    resp = provider.json(system, prompt, schema)
                else:
                    # Retry with error correction hint
                    retry_prompt = (
                        f'{prompt}\n\n'
                        f'IMPORTANT: Your previous response failed validation with this error:\n'
                        f'{last_error}\n'
                        f'Please fix your response to match the required schema exactly.'
                    )
                    resp = provider.json(system, retry_prompt, schema)

                total_in_tok += resp.input_tokens
                total_out_tok += resp.output_tokens
                total_cost += resp.cost_usd

                # Wrap array result for Pydantic validation
                raw = resp.result
                if isinstance(raw, list):
                    wrapped = {wrap_key: raw}
                elif isinstance(raw, dict) and wrap_key in raw:
                    wrapped = raw
                else:
                    wrapped = {wrap_key: [raw] if raw else []}

                validated = model_class.model_validate(wrapped)

                return ValidatedLLMResponse(
                    result=validated,
                    input_tokens=total_in_tok,
                    output_tokens=total_out_tok,
                    latency_ms=round((time.perf_counter() - t0) * 1000, 1),
                    model=resp.model,
                    cost_usd=total_cost,
                    retries=attempt,
                )

            except (ValidationError, KeyError, TypeError, ValueError) as exc:
                last_error = exc
                log.warning(
                    'LLM output validation failed (attempt %d/%d): %s',
                    attempt + 1, 1 + max_retries, exc,
                )

        # All retries exhausted — raise the last error
        raise last_error  # type: ignore[misc]

    def embed(self, text: str) -> list[float]:
        """Generate an embedding vector for the given text."""
        # Always use Gemini for embeddings (best free option, already configured)
        if _gemini.available:
            return _gemini.embed(text)
        if _openai.available:
            return _openai.embed(text)
        log.warning('No embedding provider available; returning empty vector.')
        return []

    def model_name(self) -> str:
        p = self._provider()
        return getattr(p, 'model', 'unknown') if p else 'none'


llm = LLMGateway()
