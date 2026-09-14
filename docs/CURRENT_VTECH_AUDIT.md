# Current v-tech audit

Repository: `kamesh14151/v-tech`

## Already implemented
- Next.js 16 + React 19 application and workspace UI.
- Authenticated workspace route at `app/workspace/page.tsx`.
- Executive dashboard component that calls `/api/news` and `/api/analyze`.
- News ingestion from NewsAPI and The Guardian.
- Lexicon-based sentiment and relevance scoring.
- Gemini synthesis in `app/api/analyze/route.ts`.
- Gemini context validation in `app/api/validate-context/route.ts`.
- Gemini semantic expansion in `app/api/semantic-expand/route.ts`.
- Gemini extraction in `app/api/extract/route.ts`.
- PostgreSQL schema for users, profiles, articles, rules and briefings.
- PDF/DOCX export utilities.
- Gmail/Resend SMTP route exists.

## Current fake / placeholder / unsafe behavior to remove before production
1. `app/api/semantic-expand/route.ts` generates similarity with `Math.random()`. Those scores are not semantic similarity and must not be shown as evidence.
2. `app/api/extract/route.ts` returns `domainAuthority` using `Math.random()` and `paywallBypassed: true`. These are not trustworthy production claims.
3. `app/api/extract/route.ts` has a fabricated fallback sentiment score (`+0.60`). It should be `null`/unknown when not computed.
4. `app/api/send-email/route.ts` returns `success: true` even when it only creates a Gmail compose URL or when delivery fails. Production code must distinguish `sent`, `queued`, `compose_required`, and `failed`.
5. `components/workspace/modules/executive-dashboard.tsx` currently has a `handleSendEmail` that only toggles a success toast; it does not call `/api/send-email`.
6. The current `/api/analyze` route combines ingestion, lexical scoring, theme detection, risk detection, and Gemini synthesis in one large route. This is the main target for LangGraph extraction.
7. The existing dashboard hardcodes `85%` for Noise Filtered and labels it as a metric. It should be calculated from the discovery/validation stages.
8. The current `lib/db.ts` always enables SSL with `rejectUnauthorized: false`. Local Docker PostgreSQL should use non-SSL; production should use the provider's TLS settings.

## Files to preserve unchanged
- `app/page.tsx`
- `app/layout.tsx`
- `app/globals.css`
- auth/login/security/privacy/terms pages
- `components/ui/*`
- `lib/export-pdf.ts`
- `lib/export-word.ts`
- branding/assets in `public/`

## Files to integrate carefully
- `components/workspace/modules/executive-dashboard.tsx`: keep the UI contract; only change the email action and optional agent-trace/real metrics later.
- `components/workspace/workspace-layout.tsx`: keep navigation, scope selectors, and preference behavior.
- `app/api/news/route.ts`: can remain as the UI's live feed initially; migrate it to the Python ingestion service later.
- `app/api/analyze/route.ts`: replace its AI logic with the proxy in `frontend-patch/app/api/analyze/route.ts`.
- `app/api/validate-context/route.ts` and `app/api/semantic-expand/route.ts`: migrate their logic into agent tools if those UI flows still need them.
