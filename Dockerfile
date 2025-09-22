# Multi-stage Dockerfile for User Management Service
# 
# This Dockerfile creates an optimized Node.js container using multi-stage builds
# to reduce final image size and improve security by excluding development dependencies.
#
# Features:
# - Multi-stage build for smaller production image
# - Non-root user for security
# - Proper dependency caching
# - Health check for container monitoring
# - Optimized layer structure

# Stage 1: Dependencies and Build
# Use the official Node.js LTS (Long Term Support) image as base
FROM node:18-alpine AS dependencies

# Set metadata for the image
LABEL maintainer="your-email@example.com"
LABEL description="User Management Service - Node.js + Express + MongoDB"
LABEL version="1.0.0"

# Install system dependencies for native modules (if needed)
# Alpine uses apk package manager
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    && rm -rf /var/cache/apk/*

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package files for dependency installation
# Copy package.json and package-lock.json (if available) separately
# This allows Docker to cache the npm install step if dependencies haven't changed
COPY package*.json ./

# Install dependencies
# --only=production: Install only production dependencies
# --no-audit: Skip vulnerability audit for faster build
# --no-fund: Skip funding messages
RUN npm install --only=production --no-audit --no-fund && npm cache clean --force

# Stage 2: Production Image
FROM node:18-alpine AS production

# Install dumb-init for proper signal handling
# dumb-init ensures that Node.js receives signals properly in containers
RUN apk add --no-cache dumb-init

# Create a non-root user for security
# Running as non-root reduces security risks
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodeuser -u 1001

# Set the working directory
WORKDIR /usr/src/app

# Copy dependencies from the dependencies stage
COPY --from=dependencies --chown=nodeuser:nodejs /usr/src/app/node_modules ./node_modules

# Copy application source code
# Use --chown to set proper ownership for the non-root user
COPY --chown=nodeuser:nodejs . .

# Create logs directory with proper permissions
RUN mkdir -p logs && chown nodeuser:nodejs logs

# Switch to non-root user
USER nodeuser

# Expose the application port
# This is the port your Express app listens on (default: 5000)
EXPOSE 5000

# Add health check to monitor container health
# This endpoint should return 200 OK when the app is healthy
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD node -e "require('http').get('http://localhost:5000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) }).on('error', () => process.exit(1))"

# Use dumb-init to handle signals properly and start the application
# dumb-init ensures graceful shutdown and proper signal forwarding
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "src/app.js"]