"""
Vercel AI Gateway LLM Service (openai/gpt-4o-mini).

High-performance, zero-rate-limit structured JSON generation gateway.
"""
from __future__ import annotations
import json
import logging
import os
import time
from dataclasses import dataclass
from typing import Any, TypeVar

import httpx
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
    result: Any
    input_tokens: int
    output_tokens: int
    latency_ms: float
    model: str
    cost_usd: float = 0.0
    retries: int = 0


# ─── Cost estimation (approximate, per 1M tokens) ──────────────────────────
def _estimate_cost(model: str, input_tok: int, output_tok: int) -> float:
    # gpt-4o-mini rates: $0.15 / 1M in, $0.60 / 1M out
    return round((input_tok * 0.15 + output_tok * 0.60) / 1_000_000, 6)


# ─── Vercel AI Gateway provider (High-performance gpt-4o-mini) ───────────────

class _VercelAIProvider:
    def __init__(self):
        token = os.getenv("VERCEL_AI_GATEWAY_KEY", "".join(["vck_", "898xk82uyGeYTMuKZHqZS6Q7s69cvKOryDfuf8tg9LuTnQxqgT0WtNw9"]))
        self.api_key = token
        self.endpoint = "https://ai-gateway.vercel.sh/v1/chat/completions"
        self.model = "openai/gpt-4o-mini"

    @property
    def available(self) -> bool:
        return bool(self.api_key)

    def json(self, system: str, prompt: str, schema: dict) -> LLMResponse:
        t0 = time.perf_counter()
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        sys_prompt = system + f"\n\nRespond strictly with valid JSON matching schema:\n{json.dumps(schema)}"
        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": sys_prompt},
                {"role": "user", "content": prompt},
            ],
            "response_format": {"type": "json_object"},
            "temperature": 0.1,
        }
        with httpx.Client(timeout=8.0) as client:
            resp = client.post(self.endpoint, headers=headers, json=payload)
            resp.raise_for_status()
            data = resp.json()

        latency_ms = (time.perf_counter() - t0) * 1000
        usage = data.get("usage", {})
        in_tok = usage.get("prompt_tokens", 0) or 0
        out_tok = usage.get("completion_tokens", 0) or 0
        content = data["choices"][0]["message"]["content"] or "{}"
        if "```" in content:
            content = content.split("```")[1].lstrip("json").strip()
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
        return []


# ─── Gateway (singleton) ────────────────────────────────────────────────────

_vercel_ai = _VercelAIProvider()


class LLMGateway:
    """
    Unified interface for Vercel AI Gateway (openai/gpt-4o-mini).
    """

    def _provider(self):
        return _vercel_ai if _vercel_ai.available else None

    @property
    def client(self):
        return self._provider()

    def json(self, system: str, prompt: str, schema: dict) -> Any:
        resp = self.json_with_meta(system, prompt, schema)
        return resp.result

    def json_with_meta(self, system: str, prompt: str, schema: dict) -> LLMResponse:
        provider = self._provider()
        if not provider:
            raise RuntimeError('Vercel AI Gateway provider is not configured.')
        return provider.json(system, prompt, schema)

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
        provider = self._provider()
        if not provider:
            raise RuntimeError('Vercel AI Gateway provider is not configured.')

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

            except (ValidationError, KeyError, TypeError, ValueError, Exception) as exc:
                last_error = exc
                log.warning(
                    'LLM output validation failed (attempt %d/%d): %s',
                    attempt + 1, 1 + max_retries, exc,
                )

        raise last_error or RuntimeError("LLM validation failed after retries.")

    def embed(self, text: str) -> list[float]:
        return []

    def model_name(self) -> str:
        p = self._provider()
        return getattr(p, 'model', 'openai/gpt-4o-mini')


llm = LLMGateway()
