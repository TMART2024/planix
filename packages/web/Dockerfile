# Planix Web — multi-stage build.
# tsc --noEmit + lint run in the builder stage so the image fails on type or
# lint errors (Phase 0 DoD). Final image serves the static build via Nginx.
FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
COPY tsconfig.base.json ./
COPY packages/shared/package.json ./packages/shared/package.json
COPY packages/web/package.json ./packages/web/package.json
RUN npm ci --workspace @planix/web --include-workspace-root

COPY packages/shared ./packages/shared
COPY packages/web ./packages/web

WORKDIR /app/packages/web
RUN npm run typecheck
RUN npm run lint
RUN npm run build

# ---- runtime image ----
FROM nginx:alpine
COPY packages/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/packages/web/dist /usr/share/nginx/html
EXPOSE 80
