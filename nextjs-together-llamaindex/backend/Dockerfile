# Build stage
FROM node:20-bullseye AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files and env file if it exists
COPY package*.json .env* ./

# Copy package files
COPY package*.json ./

# Install dependencies including TypeScript
RUN pnpm install
RUN pnpm add -D typescript

# Copy source code
COPY . .

# Build TypeScript code
RUN pnpm run build

# Production stage
FROM node:20-bullseye

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files and built code
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist

# Install production dependencies only
RUN pnpm install --prod

EXPOSE 3000

CMD ["pnpm", "tsx", "dist/services.js"]