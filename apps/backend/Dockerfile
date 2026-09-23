FROM node:20-bookworm-slim AS base

# Install Chromium and system dependencies for Puppeteer PDF export
RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium \
    fonts-freefont-ttf \
    fonts-ipafont-gothic \
    fonts-wqy-zenhei \
    fonts-thai-tlwg \
    fonts-kacst \
    ca-certificates \
    openssl \
    && rm -rf /var/lib/apt/lists/*

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium \
    NODE_ENV=production \
    PORT=3001

WORKDIR /app

# Copy root manifest files and package manifests for clean layer caching
COPY package.json package-lock.json turbo.json tsconfig.json ./
COPY packages/shared-types/package.json packages/shared-types/tsconfig.json ./packages/shared-types/
COPY packages/shared-utils/package.json packages/shared-utils/tsconfig.json ./packages/shared-utils/
COPY apps/backend/package.json apps/backend/tsconfig.json apps/backend/prisma.config.ts ./apps/backend/

# Install dependencies across workspaces (including dev dependencies for build)
RUN npm ci --include=dev

# Copy package sources
COPY packages/shared-types ./packages/shared-types
COPY packages/shared-utils ./packages/shared-utils
COPY apps/backend ./apps/backend

# Generate Prisma client and compile TypeScript
RUN npm --workspace @resumax/backend run prisma:generate && \
    npm --workspace @resumax/shared-types run build && \
    npm --workspace @resumax/shared-utils run build && \
    npm --workspace @resumax/backend run build

# Ensure uploads directory exists
RUN mkdir -p /app/apps/backend/uploads

WORKDIR /app/apps/backend

EXPOSE 3001

CMD ["node", "dist/server.js"]
