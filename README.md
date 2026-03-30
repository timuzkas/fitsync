# Fitsync

Integration backend for personal fitness utility.

## Structure

- `apps/mobile`: Expo / React Native app
- `apps/backend`: Next.js backend
- `packages/shared`: Shared types and logic
- `packages/prisma`: Database schema and Prisma client

## Setup

1. Copy `.env.example` to `.env` and fill in the values.
2. Install dependencies: `npm install`
3. Generate Prisma client: `cd packages/prisma && npx prisma generate`
4. Run backend: `cd apps/backend && npm run dev`
5. Run mobile: `cd apps/mobile && npm run start`
