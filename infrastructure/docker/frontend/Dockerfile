# Base stage
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat
RUN npm install -g pnpm@8.15.6
WORKDIR /app

# Dependencies stage
FROM base AS deps
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml ./
COPY apps/frontend/package.json ./apps/frontend/
COPY packages/*/package.json ./packages/*/
RUN pnpm install --frozen-lockfile

# Development stage
FROM base AS development
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/frontend/node_modules ./apps/frontend/node_modules
COPY . .
WORKDIR /app/apps/frontend
EXPOSE 3000
ENV NEXT_TELEMETRY_DISABLED 1
ENV NODE_ENV development
CMD ["pnpm", "dev"]

# Builder stage
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED 1
RUN pnpm --filter @kaif-crm/frontend build

# Production stage
FROM node:20-alpine AS production
RUN apk add --no-cache libc6-compat
WORKDIR /app
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

COPY --from=builder --chown=nextjs:nodejs /app/apps/frontend/.next/standalone ./
COPY --from=builder /app/apps/frontend/public ./apps/frontend/public
COPY --from=builder --chown=nextjs:nodejs /app/apps/frontend/.next/static ./apps/frontend/.next/static

USER nextjs
EXPOSE 3000
ENV PORT 3000
ENV NEXT_TELEMETRY_DISABLED 1

CMD ["node", "apps/frontend/server.js"]