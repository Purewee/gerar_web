# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files AND lockfile first
COPY package*.json pnpm-lock.yaml ./

# Install pnpm globally
RUN npm install -g pnpm

# Install dependencies using lockfile
RUN pnpm install --frozen-lockfile

# Copy the rest of the source code
COPY . .

# Build the app
RUN npm run build

# Runtime stage
FROM node:22-alpine

WORKDIR /app
ENV NODE_ENV=production

# Copy build output from builder
COPY --from=builder /app ./

EXPOSE 3000

CMD ["npm", "run", "start"]