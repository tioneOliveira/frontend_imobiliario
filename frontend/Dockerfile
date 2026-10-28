FROM node:24-bookworm-slim@sha256:55fb5f5a527ea2c5c4a95f963e48ef90aa38c7b346054fdc8ee9957a2b55d205 AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
RUN npm run build && npm run check:bundle

FROM node:24-bookworm-slim@sha256:55fb5f5a527ea2c5c4a95f963e48ef90aa38c7b346054fdc8ee9957a2b55d205 AS production
ENV NODE_ENV=production HOST=0.0.0.0 PORT=8080 METRICS_HOST=127.0.0.1 METRICS_PORT=9464
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts --no-audit --no-fund && npm cache clean --force
COPY --from=build --chown=node:node /app/dist ./dist
COPY --from=build --chown=node:node /app/server ./server
COPY --from=build --chown=node:node /app/shared ./shared
ARG BUILD_ID=source
ENV BUILD_ID=${BUILD_ID}
USER node
EXPOSE 8080
HEALTHCHECK --interval=15s --timeout=3s --start-period=10s --retries=3 CMD ["node","--input-type=module","-e","const r=await fetch('http://127.0.0.1:8080/healthz');if(!r.ok)process.exit(1)"]
CMD ["node","server/index.mjs"]

