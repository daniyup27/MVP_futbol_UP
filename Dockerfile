# ============================================
# ETAPA 1: Builder (imagen pesada con herramientas de desarrollo)
# ============================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar primero los archivos de dependencias para aprovechar caché de capas
COPY package.json package-lock.json* ./

# Instalar dependencias (incluye devDependencies necesarias para el build)
RUN npm ci

# Copiar el resto del código fuente
COPY . .

# Generar el build de producción de Next.js
RUN npm run build

# ============================================
# ETAPA 2: Producción (imagen minimalista)
# ============================================
FROM node:20-alpine AS production

# Crear usuario no root por seguridad
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

WORKDIR /app

# Copiar solo las dependencias de producción
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev && npm cache clean --force

# Copiar el build y los archivos estáticos desde el builder
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Asignar propietario al usuario no root
RUN chown -R nextjs:nodejs /app

# Cambiar a usuario no root
USER nextjs

# Variables de entorno por defecto (sobrescribibles en runtime)
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

EXPOSE 3000

# Comando de inicio
CMD ["node", "server.js"]
