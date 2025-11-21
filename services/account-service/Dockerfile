# ============================
# 1) Builder stage
# ============================
FROM node:20.19-alpine AS builder

WORKDIR /app

# Copy package manifest
COPY package*.json ./

# Install deps (dev + prod)
RUN npm install

# Copy TS config, Prisma schema and source code
COPY tsconfig.json ./
COPY prisma ./prisma
COPY src ./src

# Generate Prisma client
RUN npx prisma generate

# Build TypeScript → dist/
RUN npm run build

# ============================
# 2) Runtime stage
# ============================
FROM node:20.19-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

# Copy built artifacts and prisma
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

# Copy package metadata
COPY package*.json ./

# Install only production deps
RUN npm install --omit=dev

# Expose account-service port
EXPOSE 4002

# Start the compiled server
CMD ["node", "dist/index.js"]
