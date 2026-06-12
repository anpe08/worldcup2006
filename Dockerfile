# Multi-stage build for Next.js web application
# Optimized for ARM architectures (like Raspberry Pi)

# Stage 1: Install dependencies & Build
FROM node:18-alpine AS builder
WORKDIR /app

# Install dependencies based on preferred package manager
COPY package*.json ./
RUN npm ci

# Copy source code and build
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Stage 2: Production Runner
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copy only build artifacts and production node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/seed.mjs ./seed.mjs

# Next.js listening port
EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["npm", "start"]
