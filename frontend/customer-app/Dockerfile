# --------- STAGE 1: Build the React app ----------
FROM node:20-alpine AS builder

WORKDIR /app

# Install deps
COPY package*.json ./
RUN npm install

# Copy source & build
COPY . .
RUN npm run build

# --------- STAGE 2: Nginx to serve static files ----------
FROM nginx:1.27-alpine

# Remove default Nginx site
RUN rm -rf /usr/share/nginx/html/*

# Copy built files from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# (Optional) Custom Nginx config for SPA routing
# If your customer app uses React Router, add this:
#   create nginx.conf next to Dockerfile and uncomment:
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
