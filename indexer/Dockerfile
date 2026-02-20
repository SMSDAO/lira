FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci --only=production

# Copy indexer source
COPY . .

# Build TypeScript
RUN npm run build

# Set environment
ENV NODE_ENV=production

# Run indexer
CMD ["node", "dist/index.js"]
