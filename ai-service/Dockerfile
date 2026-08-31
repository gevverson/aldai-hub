FROM python:3.12-slim
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .
RUN mkdir -p chroma_db documents

# Bake the OAG corpus into the image so the index survives an ephemeral disk.
# Local ONNX embeddings — no API key needed at build time. Kept non-fatal so a
# build without ./documents still produces a runnable image; the service logs
# loudly and declines questions when the index is empty.
RUN python ingest_all.py || echo "WARNING: corpus not indexed at build time" 

EXPOSE 8002
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8002"]
