# -----------------------------
# Builder stage
# -----------------------------
FROM node:20.19-alpine AS builder

WORKDIR /app

# Copy package files first
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy TypeScript config + Prisma schema
COPY tsconfig.json ./
COPY prisma ./prisma

# Copy source code
COPY src ./src

# Generate Prisma Client
RUN npx prisma generate

# Build TypeScript
RUN npm run build


# -----------------------------
# Runner stage
# -----------------------------
FROM node:20.19-alpine AS runner

WORKDIR /app

# Copy build output & package files
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY package*.json ./

# Install prod-only deps
RUN npm install --omit=dev

EXPOSE 4003

CMD ["node", "dist/index.js"]
