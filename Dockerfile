# Stage 1: Build the Vite frontend
FROM node:20-alpine AS builder
WORKDIR /app

# Install git to clone template assets
RUN apk add --no-cache git

# Clone miniverse repo for world/sprite assets
RUN git clone --depth 1 https://github.com/ianscott313/miniverse.git /miniverse

# Copy project files
COPY package.json .
COPY tsconfig.json .
COPY vite.config.ts .
COPY index.html .
COPY src/ src/

# Copy world and sprite assets from miniverse templates
RUN mkdir -p public/worlds public/universal_assets
RUN cp -r /miniverse/packages/create-miniverse/templates/worlds/cozy-startup public/worlds/cozy-startup
RUN cp -r /miniverse/packages/create-miniverse/templates/universal_assets/. public/universal_assets/

# Install dependencies and build
RUN npm install
RUN npm run build

# Stage 2: Production image
FROM node:20-alpine AS runner
WORKDIR /app

# Install nginx
RUN apk add --no-cache nginx

# Copy built frontend
COPY --from=builder /app/dist /app/dist

# Copy node_modules for the miniverse server binary
COPY --from=builder /app/node_modules /app/node_modules
COPY --from=builder /app/package.json /app/package.json

# Copy nginx config and start script
COPY nginx.conf /etc/nginx/nginx.conf
COPY start.sh /start.sh
RUN chmod +x /start.sh

EXPOSE 80
CMD ["/start.sh"]
