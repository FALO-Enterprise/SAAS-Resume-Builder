# Install dependencies only when needed
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy root and workspace package files
COPY package.json package-lock.json turbo.json tsconfig.json ./
COPY packages/shared-types/package.json packages/shared-types/tsconfig.json ./packages/shared-types/
COPY packages/shared-utils/package.json packages/shared-utils/tsconfig.json ./packages/shared-utils/
COPY apps/frontend/package.json apps/frontend/tsconfig.json ./apps/frontend/

RUN npm ci --include=dev

# Rebuild the source code only when needed
FROM node:20-alpine AS builder
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json turbo.json tsconfig.json ./
COPY packages/shared-types ./packages/shared-types
COPY packages/shared-utils ./packages/shared-utils
COPY apps/frontend ./apps/frontend

# Build arguments for Next.js public variables (inlined at build time)
ARG NEXT_PUBLIC_BACKEND_URL
ENV NEXT_PUBLIC_BACKEND_URL=$NEXT_PUBLIC_BACKEND_URL

ARG NEXT_PUBLIC_PADDLE_ENVIRONMENT
ENV NEXT_PUBLIC_PADDLE_ENVIRONMENT=$NEXT_PUBLIC_PADDLE_ENVIRONMENT

ARG NEXT_PUBLIC_PADDLE_CLIENT_TOKEN
ENV NEXT_PUBLIC_PADDLE_CLIENT_TOKEN=$NEXT_PUBLIC_PADDLE_CLIENT_TOKEN

ARG NEXT_PUBLIC_PADDLE_PRICE_PRO
ENV NEXT_PUBLIC_PADDLE_PRICE_PRO=$NEXT_PUBLIC_PADDLE_PRICE_PRO

ARG NEXT_PUBLIC_PADDLE_PRICE_ENTERPRISE
ENV NEXT_PUBLIC_PADDLE_PRICE_ENTERPRISE=$NEXT_PUBLIC_PADDLE_PRICE_ENTERPRISE

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Build dependencies and Next.js app
RUN npm --workspace @resumax/shared-types run build && \
    npm --workspace @resumax/shared-utils run build && \
    npm --workspace @resumax/frontend run build

# Production image, copy all the files and run next
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy static assets and public assets
COPY --from=builder /app/apps/frontend/public ./apps/frontend/public

# Copy standalone server and static chunks
COPY --from=builder --chown=nextjs:nodejs /app/apps/frontend/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/frontend/.next/static ./apps/frontend/.next/static

USER nextjs

EXPOSE 3000

CMD ["node", "apps/frontend/server.js"]
