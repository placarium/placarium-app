# Contexto de build = raiz do repositório (Railway: Root Directory = /)
FROM node:22-alpine AS base
RUN corepack enable
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/ingest/package.json apps/ingest/
COPY packages/core/package.json packages/core/
# Ao adicionar dependência de workspace nova ao ingest, copie o package.json dela aqui
RUN pnpm install --frozen-lockfile --prod --filter @placarium/ingest...

FROM base AS runner
ENV NODE_ENV=production
COPY --from=deps /app /app
COPY tsconfig.base.json ./
COPY apps/ingest apps/ingest
COPY packages/core packages/core
USER node
CMD ["pnpm", "--filter", "@placarium/ingest", "start"]
