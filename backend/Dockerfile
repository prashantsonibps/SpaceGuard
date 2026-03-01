# SpaceGuard Backend - FastAPI on Cloud Run
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies for scientific packages (numpy, pandas, skyfield)
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better layer caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY src/ ./src/

# Cloud Run uses PORT env var (default 8080)
ENV PORT=8080
EXPOSE 8080

# Run uvicorn - Cloud Run sets PORT at runtime
CMD exec uvicorn src.api:app --host 0.0.0.0 --port ${PORT}
