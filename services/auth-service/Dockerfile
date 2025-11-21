# ============================
# 1) Builder stage
# ============================
FROM node:20.19-alpine AS builder

# Set working directory inside the container
WORKDIR /app

# Copy only package.json + package-lock.json first
# This allows Docker to cache dependencies layer
COPY package*.json ./

# Install ALL deps (including devDeps for TypeScript, ts-node-dev, etc.)
RUN npm install

# Copy the rest of the service code
COPY tsconfig.json ./
COPY prisma ./prisma
COPY src ./src

# Generate Prisma client (uses DATABASE_URL only for introspection/migrations;
# here we're just generating client, so no DB connection needed)
RUN npx prisma generate

# Build TypeScript -> dist/
RUN npm run build

# ============================
# 2) Runtime stage
# ============================
FROM node:20.19-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copy compiled JS and Prisma assets from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

# Copy package.json so node can find metadata if needed
COPY package*.json ./

# Install only production dependencies
RUN npm install --omit=dev

# Expose the port used by auth-service
EXPOSE 4001

# Default command: run compiled server
CMD ["node", "dist/index.js"]
