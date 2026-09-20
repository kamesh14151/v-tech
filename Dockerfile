# ─── Stage 1: Build Next.js ───────────────────────────────────────────────────
FROM node:22-alpine AS frontend-builder
WORKDIR /app
COPY frontend/package*.json ./
RUN npm ci
COPY frontend ./
RUN npm run build

# ─── Stage 2: Final unified image ─────────────────────────────────────────────
FROM python:3.12-slim

# Install Node.js in the Python image
RUN apt-get update && apt-get install -y \
    curl \
    supervisor \
    && curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
    && apt-get install -y nodejs \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# ─── Install Python backend dependencies ──────────────────────────────────────
WORKDIR /app/backend
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source code
COPY backend/app ./app

# ─── Copy built Next.js frontend ──────────────────────────────────────────────
WORKDIR /app/frontend
COPY --from=frontend-builder /app/.next ./.next
COPY --from=frontend-builder /app/public ./public
COPY --from=frontend-builder /app/node_modules ./node_modules
COPY --from=frontend-builder /app/package.json ./package.json
COPY --from=frontend-builder /app/next.config.mjs ./next.config.mjs

# ─── Supervisord config to run both services ──────────────────────────────────
RUN mkdir -p /var/log/supervisor
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

EXPOSE 3000
EXPOSE 8000

# Start both Next.js and FastAPI with supervisord
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
