# Build stage
FROM node:22-alpine AS builder
WORKDIR /app

COPY package*.json ./
# Install pnpm globally
RUN npm install -g pnpm
# Install dependencies
RUN pnpm install --frozen-lockfile

COPY . .
RUN npm run build

# Runtime stage
FROM node:22-alpine
WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app ./

EXPOSE 3000

CMD ["npm", "run", "start"]