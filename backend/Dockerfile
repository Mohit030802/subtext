FROM python:3.12-slim

# System deps (PyMuPDF needs libgl, python-docx needs libxml2)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 libglib2.0-0 libxml2 libxslt1.1 curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python deps first (layer cache)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Railway injects PORT env var — default to 8000
ENV PORT=8000

EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:${PORT}/health || exit 1

CMD uvicorn app.main:app --host 0.0.0.0 --port ${PORT}
