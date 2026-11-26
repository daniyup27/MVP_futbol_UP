# ============================================
# MVP Fútbol UP · imagen del servidor de bienestar (FPI-III-15)
# Multietapa (ADR-10): la etapa de build compila TypeScript; la de producción solo lleva
# dependencias de runtime, el JavaScript compilado y las migraciones. Usuario no root.
# ============================================
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY tsconfig.build.json ./
COPY src ./src
RUN npm run build

FROM node:20-alpine AS production
ARG APP_VERSION=sin-version
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 --ingroup nodejs app
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=builder /app/dist ./dist
COPY db ./db
USER app
ENV NODE_ENV=production \
    PORT=3000 \
    APP_VERSION=${APP_VERSION}
EXPOSE 3000
HEALTHCHECK --interval=10s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "dist/composicion/main.js"]
