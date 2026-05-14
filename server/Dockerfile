FROM node:20-slim AS base
WORKDIR /app

# sharp needs these system libs on Debian slim
RUN apt-get update && apt-get install -y --no-install-recommends \
    libvips-dev \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .
RUN mkdir -p uploads/verifications

EXPOSE 3001
CMD ["node", "server.js"]
