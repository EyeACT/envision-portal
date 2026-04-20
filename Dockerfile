FROM node:22-alpine AS builder

# Use alpine-based image and install only necessary dependencies
RUN apk add --no-cache openssl
RUN corepack enable

WORKDIR /app

# Only needed for prisma build
ARG DATABASE_URL

# Copy only necessary files for dependency installation
COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma/

RUN pnpm install --frozen-lockfile \
  && pnpm prisma:generate \
  && pnpm store prune

# Copy source files and build
COPY . .
RUN pnpm run build

# Production stage
FROM node:22-alpine

LABEL maintainer="FAIR Data Innovations Hub <contact@fairdataihub.org>" \
  description="The Envision Portal is developed for the EyeACT project to streamline the uploading, preparation, and sharing of eye imaging research and data."

RUN apk add --no-cache openssl busybox-extras


WORKDIR /app

# Copy only the necessary files from builder stage
# COPY --from=builder /app/package.json ./
COPY --from=builder /app/.output ./
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Copy the Prisma schema & migrations, so `prisma migrate deploy` can see them
COPY --from=builder /app/prisma ./prisma

# Create startup script that runs migrations before starting the app
RUN echo '#!/bin/sh' > /app/start.sh && \
  # echo 'pnpm prisma:migrate:deploy' >> /app/start.sh && \
  echo 'exec node /app/server/index.mjs' >> /app/start.sh && \
  chmod +x /app/start.sh

EXPOSE 3000

CMD ["/bin/sh", "/app/start.sh"]