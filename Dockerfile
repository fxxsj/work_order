# Multi-stage Dockerfile for 印刷施工单跟踪系统

# Build stage for frontend
FROM node:16-alpine AS frontend-build

WORKDIR /app/frontend

# Copy frontend package files
COPY frontend/package*.json ./

# Install frontend dependencies
RUN npm ci --only=production

# Copy frontend source code
COPY frontend/ ./

# Build frontend
RUN npm run build

# Production stage
FROM python:3.9-slim AS production

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV DEBIAN_FRONTEND=noninteractive

# Install system dependencies
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        postgresql-client \
        build-essential \
        libpq-dev \
        curl \
        gnupg \
        git \
    && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /app

# Create non-root user
RUN addgroup --system django \
    && adduser --system --ingroup django django

# Install Python dependencies
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY backend/ ./

# Copy frontend build files from frontend-build stage
COPY --from=frontend-build /app/frontend/dist ./static/

# Create necessary directories
RUN mkdir -p /app/logs /app/media /app/staticfiles \
    && chown -R django:django /app

# Set correct permissions
RUN chmod +x /app/entrypoint.sh

# Switch to non-root user
USER django

# Collect static files
RUN python manage.py collectstatic --noinput --clear

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8000/api/health/ || exit 1

# Expose port
EXPOSE 8000

# Set entrypoint
ENTRYPOINT ["/app/entrypoint.sh"]

# Default command
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "--workers", "3", "--timeout", "120", "config.wsgi:application"]