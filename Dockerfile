# Multi-stage Dockerfile for Kimi Chat Application
# Supports both development and production builds

# Development stage
FROM node:20-alpine AS development
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies for Next.js dev mode)
RUN npm ci && npm cache clean --force

# Copy source code
COPY . .

# Expose Next.js default development port
EXPOSE 3000

# Set development environment
ENV NODE_ENV=development

# Start development server with hot reload
CMD ["npm", "run", "dev"]

# Production build stage
FROM node:20-alpine AS builder
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (needed for build)
RUN npm ci && npm cache clean --force

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production runtime stage
FROM node:20-alpine AS production
WORKDIR /app

# Install only production dependencies
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy built application from builder stage
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.ts ./next.config.ts
COPY --from=builder /app/package.json ./package.json

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001
USER nextjs

# Expose port
EXPOSE 3000

# Set production environment
ENV NODE_ENV=production

# Start production server
CMD ["npm", "start"]