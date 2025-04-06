FROM node:18-alpine AS base

# Instalar dependências apenas
FROM base AS deps
WORKDIR /app

# Copiar arquivos de projeto
COPY package.json package-lock.json ./

# Instalar dependências
RUN npm ci

# Setup para produção
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Variáveis de ambiente para build
ENV NEXT_TELEMETRY_DISABLED 1
ENV NODE_ENV production

# Build da aplicação
RUN npm run build

# Produção
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Criar usuário não privilegiado
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copiar arquivos necessários
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Alternar para usuário não privilegiado
USER nextjs

# Expor porta e definir comando
EXPOSE 3000
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

CMD ["node", "server.js"] 