# Multi-stage build for CCCD Analysis System
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY src/ ./src/
COPY jest.config.js ./
COPY README.md ./

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S cccd -u 1001

# Change ownership of the app directory
RUN chown -R cccd:nodejs /app

# Switch to non-root user
USER cccd

# Create necessary directories
RUN mkdir -p logs output

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Default command
CMD ["node", "src/main.js", "api"]

# Production stage
FROM node:18-alpine AS production

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code from builder stage
COPY --from=builder /app/src ./src
COPY --from=builder /app/jest.config.js ./
COPY --from=builder /app/README.md ./

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S cccd -u 1001

# Create necessary directories
RUN mkdir -p logs output && \
    chown -R cccd:nodejs /app

# Switch to non-root user
USER cccd

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Default command
CMD ["node", "src/main.js", "api"]