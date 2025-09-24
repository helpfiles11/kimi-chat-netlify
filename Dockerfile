# Dockerfile for development
FROM node:18-alpine

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

# Start development server
CMD ["npm", "run", "dev"]