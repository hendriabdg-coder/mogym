FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/backend/package.json apps/backend/package.json
COPY apps/frontend/package.json apps/frontend/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN npm ci

FROM deps AS builder
COPY tsconfig.base.json ./
COPY apps/backend apps/backend
COPY packages/shared packages/shared
RUN npm run db:generate
RUN npm run build -w @cuttrack/backend

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN apk add --no-cache dumb-init
COPY --from=builder /app/package.json /app/package-lock.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/backend/package.json ./apps/backend/package.json
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist
COPY --from=builder /app/apps/backend/prisma ./apps/backend/prisma
RUN mkdir -p /app/apps/backend/uploads && chown -R node:node /app
USER node
WORKDIR /app/apps/backend
EXPOSE 3030
ENTRYPOINT ["dumb-init","--"]
CMD ["sh","-c","npx prisma migrate deploy && node dist/main.js"]
