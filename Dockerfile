# Tivorah web (Next.js) image, built and run by Coolify on our Contabo server(s).
# Coolify's proxy (Traefik) terminates HTTPS for tivorah.com and forwards to port 7456.
#
#   docker build --build-arg NEXT_PUBLIC_API_URL=https://apiprod.tivorah.com --build-arg NEXT_PUBLIC_SITE_URL=https://tivorah.com -t tivorah-web .
#   docker run -p 7456:7456 tivorah-web
#
# NEXT_PUBLIC_* values are baked into the build, so mark them "Build Variable" in Coolify; the
# build checks them (npm run env:check). Server-only values (API_INTERNAL_URL) can be runtime only.

FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_SITE_URL
ARG NEXT_PUBLIC_MEDIA_CDN_HOST
ARG NEXT_PUBLIC_APP_DOWNLOAD_URL
ARG NEXT_PUBLIC_IOS_APP_URL
ARG NEXT_PUBLIC_ANDROID_APP_URL
ARG APPLE_TEAM_ID
ARG APPLE_APP_BUNDLE_IDENTIFIER
ARG ANDROID_APP_PACKAGE_NAME
ARG SITE_NOINDEX
ARG API_INTERNAL_URL
ARG NEXT_PUBLIC_POSTHOG_KEY
ARG NEXT_PUBLIC_POSTHOG_HOST
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL} \
    NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL} \
    NEXT_PUBLIC_MEDIA_CDN_HOST=${NEXT_PUBLIC_MEDIA_CDN_HOST} \
    NEXT_PUBLIC_APP_DOWNLOAD_URL=${NEXT_PUBLIC_APP_DOWNLOAD_URL} \
    NEXT_PUBLIC_IOS_APP_URL=${NEXT_PUBLIC_IOS_APP_URL} \
    NEXT_PUBLIC_ANDROID_APP_URL=${NEXT_PUBLIC_ANDROID_APP_URL} \
    APPLE_TEAM_ID=${APPLE_TEAM_ID} \
    APPLE_APP_BUNDLE_IDENTIFIER=${APPLE_APP_BUNDLE_IDENTIFIER} \
    ANDROID_APP_PACKAGE_NAME=${ANDROID_APP_PACKAGE_NAME} \
    SITE_NOINDEX=${SITE_NOINDEX} \
    API_INTERNAL_URL=${API_INTERNAL_URL} \
    NEXT_PUBLIC_POSTHOG_KEY=${NEXT_PUBLIC_POSTHOG_KEY} \
    NEXT_PUBLIC_POSTHOG_HOST=${NEXT_PUBLIC_POSTHOG_HOST}
RUN npm run build

FROM node:22-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production PORT=7456
COPY --from=build --chown=node:node /app /app
USER node
EXPOSE 7456
HEALTHCHECK --interval=15s --timeout=5s --start-period=40s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:7456/').then(r=>process.exit(r.status<500?0:1),()=>process.exit(1))"
# Node runs Next directly (not through npm) so it receives SIGTERM and stops cleanly.
CMD ["node", "node_modules/next/dist/bin/next", "start", "-p", "7456"]
