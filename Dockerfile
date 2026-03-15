# ============================================================================
# Bewo Healthcare AI - Multi-stage Dockerfile
# Stage 1: Build Next.js frontend
# Stage 2: Python runtime serving both backend API and frontend
# ============================================================================

# ---------------------------------------------------------------------------
# Stage 1: Build the Next.js frontend
# ---------------------------------------------------------------------------
FROM node:20-slim AS frontend-build

WORKDIR /build/frontend

# Install dependencies first (layer cache)
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

# Copy frontend source and build
COPY frontend/ ./
RUN npm run build

# ---------------------------------------------------------------------------
# Stage 2: Production runtime
# ---------------------------------------------------------------------------
FROM python:3.11-slim

LABEL maintainer="Bewo Healthcare <bewo@nus.edu>"
LABEL description="Bewo Healthcare AI Platform"

# System dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js 20 for serving the Next.js frontend
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y --no-install-recommends nodejs \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python dependencies
COPY backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY backend/ ./backend/
COPY core/ ./core/
COPY tools/ ./tools/
COPY database/ ./database/
COPY scripts/ ./scripts/

# Copy built frontend (includes node_modules needed at runtime by Next.js)
COPY --from=frontend-build /build/frontend/ ./frontend/

# Create non-root user for security
RUN groupadd -r bewo && useradd -r -g bewo -d /app bewo \
    && chown -R bewo:bewo /app
USER bewo

# Expose ports
EXPOSE 8000 3000

# Health check against the FastAPI backend
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8000/ || exit 1

# Start both services
CMD ["sh", "-c", "cd /app/frontend && npm run start & cd /app && uvicorn backend.api:app --host 0.0.0.0 --port 8000"]
