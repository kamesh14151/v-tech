# Optimus Media Intelligence Platform

Optimus is an enterprise-grade AI media intelligence and executive briefing platform. Powered by a Next.js 14 frontend and a FastAPI / LangGraph multi-agent orchestration backend, Optimus automatically discovers, analyzes, clusters, and summarizes news across 35+ global news outlets and dynamic search feeds.

---

## 🚀 Version Release History

### **v2.0.0 — Universal News Discovery, Daily Digest Automation & Rate-Limit NLP Optimization** *(Current Release)*
* **Universal Source Expansion (35+ RSS Outlets & Dynamic Search)**:
  * Expanded RSS coverage to 35+ verified sources across 7 categories (BBC, Reuters, TechCrunch, The Hindu, Economic Times, NDTV, LiveMint, Business Standard, etc.).
  * Added dynamic **Google News RSS Search** fallback (`https://news.google.com/rss/search?q={query}`) to guarantee live coverage for any custom search query (e.g. *"Vijay"*, *"Paytm"*, *"Tesla"*, *"Semiconductors"*).
  * Added per-source breakdown counts in API responses.
* **Automated Daily Email Digest System**:
  * Integrated ARQ scheduled worker running daily morning dispatches at 08:00 AM UTC (customizable schedule).
  * Multi-provider email engine supporting **Resend API**, **Gmail / SMTP Transporter**, and fallback 1-click Gmail Compose links.
  * Added Daily Digest preferences & automated dispatch controls in the Workspace Account Settings.
* **PostgreSQL Report History & Page Refresh Persistence**:
  * Persists full AI analysis dossiers into the `saved_reports` PostgreSQL table.
  * Eliminates unnecessary AI re-runs on page refresh by displaying saved reports.
  * Introduced an interactive **Report History** modal to view and reload past intelligence reports.
* **Zero-Cost Rate-Limit NLP Optimization**:
  * Replaced auxiliary LLM calls with a high-speed **Lexicon Sentiment Analyzer** and **Regex / Gazetteer NER Parser**.
  * Reduced LLM API calls per run by 85% (~8 calls → 1 call), improving speed by 5x and eliminating API rate limits (`429 Too Many Requests`).

---

### **v1.1.0 — LangGraph Multi-Agent Architecture & Observability**
* **Parallel LangGraph Workflow**:
  * Implemented parallel multi-agent graph execution: `discover` → `validate` → `cluster` → `[topic, impact, entity, sentiment]` → `importance` → `summary`.
* **Model-Agnostic LLM Gateway**:
  * Unified LLM service supporting **Google Gemini 2.0 Flash**, **OpenAI (gpt-4o-mini)**, and **Anthropic (claude-3-5-haiku)**.
* **Agent Observability & Traceability**:
  * Added per-agent token tracking, latency monitoring, cost calculation, and confidence scoring stored in `agent_run_logs`.
* **pgvector Vector Store**:
  * Added `pgvector` semantic similarity search using Gemini embeddings (`gemini-embedding-001`).

---

### **v1.0.0 — Foundation & Executive Dashboard**
* Next.js 14 App Router UI with dark glassmorphism aesthetic.
* Executive Dashboard with key story metrics, risk alerts, and sentiment distribution charts.
* Authenticated NextAuth session management and PostgreSQL database setup.
* Word (.docx) and PDF report exporter.

---

## 🛠️ Architecture & Stack

* **Frontend**: Next.js 14, React, TailwindCSS, Lucide Icons, NextAuth.js.
* **Backend**: FastAPI, LangGraph, Pydantic v2, PostgreSQL (`psycopg`), Redis, ARQ background worker.
* **LLM Engine**: Google Gemini 2.0 Flash / OpenAI / Anthropic via unified Gateway.
* **Vector Database**: PostgreSQL with `pgvector` extension.
* **Email & Delivery**: Resend API / Gmail SMTP.

---

## 💻 Local Development

### 1. Environment Setup
Copy `.env.example` to `.env` and populate your API credentials:
```bash
cp .env.example .env
```

### 2. Infrastructure Services (Docker)
Start PostgreSQL (with `pgvector`) and Redis:
```bash
docker compose up -d postgres redis
```

### 3. FastAPI Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### 4. Next.js Frontend
```bash
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to access the application.

---

## 🐳 Full Stack Docker Deployment

To run the complete production stack (Next.js frontend, FastAPI backend, Redis worker, PostgreSQL DB):
```bash
docker compose up --build
```
* **Frontend**: [http://localhost:3000](http://localhost:3000)
* **FastAPI Backend Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
