# Dockerfile for EchoPitch Studio (Agent ID #9230) OKX A2A Node Daemon Service
FROM node:22-slim

# Install curl, ca-certificates, git, and process tools
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    git \
    procps \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Create directory for OKX Agent Task Home data storage
RUN mkdir -p /app/data && chmod 777 /app/data

# Install global OKX A2A Node CLI
RUN npm install -g @okxweb3/a2a-node@0.1.10

# Copy package manifests first for efficient caching
COPY package.json package-lock.json* ./

# Install application dependencies
RUN npm install --omit=dev || npm install

# Copy application scripts and source code
COPY . .

# Set default environment variables for EchoPitch Studio (Agent ID #9230)
ENV PORT=10000 \
    NODE_ENV=production \
    NEXT_PUBLIC_OKX_AGENT_ID=9230 \
    NEXT_PUBLIC_OKX_A2A_SERVICE_ID=36961 \
    NEXT_PUBLIC_OKX_CONTRACT_ADDRESS=0x779ded0c9e1022225f8e0630b35a9b54be713736 \
    NEXT_PUBLIC_OKX_NETWORK="OKX X Layer Mainnet" \
    NEXT_PUBLIC_OKX_CHAIN_ID=196 \
    NEXT_PUBLIC_OKX_COMMUNICATION_ADDRESS=0x78507f00f3BA4665a505e616ead3211e405fC11e \
    OKX_AGENT_TASK_HOME=/app/data \
    OKX_A2A_AI_PERMISSION_PRESET=auto \
    XMTP_ENV=production

# Expose Render web service port
EXPOSE 10000

# Healthcheck instruction for container engines
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:10000/health || exit 1

# Start healthy daemon runtime 24/7 with HTTP health check endpoint
CMD ["node", "scripts/start-a2a.js"]
