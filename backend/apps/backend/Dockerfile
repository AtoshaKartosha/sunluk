# Build context must be the repository root (monorepo).
# Build: docker build -f backend/apps/backend/Dockerfile -t sunluk-backend .

# --------------- build ---------------
FROM node:20-alpine AS build

WORKDIR /app

# Copy workspace manifests first for better layer caching.
COPY backend/package.json backend/package-lock.json backend/
COPY backend/apps/backend/package.json backend/apps/backend/
# ponytail: Medusa optional peer graph; remove when upstream locks resolve under npm 10
RUN cd backend && npm ci --workspace=@dtc/backend --legacy-peer-deps

COPY backend/ backend/

WORKDIR /app/backend/apps/backend
RUN npx medusa build

# --------------- production-deps ---------------
FROM node:20-alpine AS production-deps

WORKDIR /app

COPY backend/package.json backend/package-lock.json backend/
COPY backend/apps/backend/package.json backend/apps/backend/
# ponytail: Medusa optional peer graph; remove when upstream locks resolve under npm 10
RUN cd backend && npm ci --omit=dev --workspace=@dtc/backend --legacy-peer-deps

# --------------- production ---------------
FROM node:20-alpine AS production

RUN addgroup -S sunluk && adduser -S sunluk -G sunluk

WORKDIR /app

COPY --from=build --chown=sunluk:sunluk /app/backend/apps/backend/.medusa/server ./
COPY --from=build --chown=sunluk:sunluk /app/backend/apps/backend/static ./static
COPY --from=production-deps --chown=sunluk:sunluk /app/backend/node_modules ./node_modules

USER sunluk

ENV NODE_ENV=production
ENV PORT=9000

EXPOSE 9000

CMD ["npm", "run", "start"]
