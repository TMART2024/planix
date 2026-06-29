# Planix API — multi-stage build.
# The Phase 0 DoD requires tsc --noEmit and the linter to run as part of the
# Docker build, so the builder stage fails the image if either fails.
FROM node:20-alpine AS builder
WORKDIR /app

# Install workspace deps using the root lockfile + workspace manifests.
COPY package.json package-lock.json ./
COPY tsconfig.base.json .eslintrc.json ./
COPY packages/shared/package.json ./packages/shared/package.json
COPY packages/api/package.json ./packages/api/package.json
RUN npm ci --workspace @planix/api --include-workspace-root

# Bring in source for the shared + api packages.
COPY packages/shared ./packages/shared
COPY packages/api ./packages/api

WORKDIR /app/packages/api
RUN npm run typecheck
RUN npm run lint
RUN npm run build

# ---- runtime image ----
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json ./
COPY packages/shared/package.json ./packages/shared/package.json
COPY packages/api/package.json ./packages/api/package.json
RUN npm ci --workspace @planix/api --omit=dev --include-workspace-root

COPY --from=builder /app/packages/api/dist ./packages/api/dist

EXPOSE 3000
CMD ["node", "packages/api/dist/main.js"]
