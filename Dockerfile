# Production Dockerfile for 印刷施工单跟踪系统

FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY backend/ ./backend/

# Set working directory to backend
WORKDIR /app/backend

# Collect static files
RUN python manage.py collectstatic --noinput || true

EXPOSE 8000

# Start with Daphne (HTTP + WebSocket)
CMD ["daphne", "-b", "0.0.0.0", "-p", "8000", "config.asgi:application"]
