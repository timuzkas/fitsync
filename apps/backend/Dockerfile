FROM node:20-alpine AS base

# 1. Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy root workspace and package files
COPY package.json package-lock.json* ./
COPY apps/backend/package.json ./apps/backend/
COPY packages/shared/package.json ./packages/shared/
COPY packages/prisma/package.json ./packages/prisma/

# Install dependencies including workspaces
RUN npm install

# 2. Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma Client
RUN cd packages/prisma && npx prisma generate

# Build Next.js
ENV NEXT_TELEMETRY_DISABLED 1
RUN cd apps/backend && npm run build

# 3. Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built assets from builder
COPY --from=builder /app/apps/backend/public ./apps/backend/public
COPY --from=builder --chown=nextjs:nodejs /app/apps/backend/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/backend/.next/static ./apps/backend/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/packages/prisma ./packages/prisma

# Add entrypoint script
COPY apps/backend/docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

ENTRYPOINT ["docker-entrypoint.sh"]
# Note: Standalone output requires running the server from the root of the build output
CMD ["node", "apps/backend/server.js"]
