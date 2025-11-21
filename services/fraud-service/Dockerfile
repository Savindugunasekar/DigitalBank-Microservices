# -----------------------------
# Builder stage
# -----------------------------
FROM node:20.19-alpine AS builder

WORKDIR /app

# Copy package manifest and install deps
COPY package*.json ./
RUN npm install

# Copy TS config and source
COPY tsconfig.json ./
COPY src ./src

# Build TS → dist
RUN npm run build

# -----------------------------
# Runtime stage
# -----------------------------
FROM node:20.19-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

# Copy built code
COPY --from=builder /app/dist ./dist
COPY package*.json ./

# Install only production deps
RUN npm install --omit=dev

EXPOSE 4004

CMD ["node", "dist/index.js"]
