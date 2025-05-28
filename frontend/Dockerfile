# ---------- Stage 1: Build ----------
FROM node:20-alpine AS builder

WORKDIR /app

# Copy .env early so it's available at build time
COPY .env .env

# Copy and install all dependencies
COPY frontend/package*.json ./
RUN npm install --legacy-peer-deps

# Copy the full app source code
COPY frontend ./
RUN npm run build

# ---------- Stage 2: Production ----------
FROM node:20-alpine

WORKDIR /app

# Install production dependencies
COPY frontend/package*.json ./
RUN npm install --legacy-peer-deps --only=production

# Copy built output from builder
COPY --from=builder /app/.next .next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.mjs ./next.config.mjs
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/load-env.js ./load-env.js
COPY --from=builder /app/next-env.d.ts ./next-env.d.ts

# Copy shared environment and credentials from project root
COPY .env /app/.env
COPY credentials /app/credentials

EXPOSE 3000

CMD ["npm", "run", "start"]




# # ---------- Stage 1: Build ----------
# FROM node:20-alpine AS builder

# WORKDIR /app

# # Install all dependencies (including dev)
# COPY package*.json ./
# RUN npm install --legacy-peer-deps

# # Copy rest of the app and build it
# COPY . .
# RUN npm run build

# # ---------- Stage 2: Production ----------
# FROM node:20-alpine

# WORKDIR /app

# # Copy only production dependencies
# COPY package*.json ./
# RUN npm install --legacy-peer-deps --only=production

# # Copy the build output and necessary files from the builder
# COPY --from=builder /app/.next .next
# COPY --from=builder /app/public ./public
# COPY --from=builder /app/next.config.mjs ./next.config.mjs
# COPY --from=builder /app/package.json ./package.json

# # Expose Next.js default port
# EXPOSE 3000

# # Run the production server
# CMD ["npm", "run", "start"]
