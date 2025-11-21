# -----------------------------
# Builder stage
# -----------------------------
FROM node:20.19-alpine AS builder

WORKDIR /app

# Install deps
COPY package*.json ./
RUN npm install

# Copy TS config, Prisma schema, and source
COPY tsconfig.json ./
COPY prisma ./prisma
COPY src ./src

# Generate Prisma client
RUN npx prisma generate

# Build TS -> dist
RUN npm run build

# -----------------------------
# Runtime stage
# -----------------------------
FROM node:20.19-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

# Copy build output and prisma folder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY package*.json ./

# Install only production deps
RUN npm install --omit=dev

EXPOSE 4005

CMD ["node", "dist/index.js"]
