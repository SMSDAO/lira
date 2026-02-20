# LIRA Event Indexer

The LIRA Event Indexer is a Node.js service that listens to blockchain events from LIRA smart contracts and writes them to the PostgreSQL database in real-time.

## Features

- **Real-time Event Processing**: Subscribes to new blockchain events as they occur
- **Historical Backfill**: Catches up on missed events from configured start blocks
- **Automatic Retry**: Exponential backoff for failed RPC calls
- **Checkpoint System**: Tracks last processed block per contract
- **Duplicate Prevention**: Detects and skips already-indexed events
- **Multi-Contract Support**: Handles events from 6+ LIRA contracts

## Supported Contracts

1. **LiraToken** - Transfer, Approval events
2. **LiraTokenRegistry** - TokenRegistered, TokenUpdated, TokenRemoved
3. **LiraProfile** - ProfileCreated, ProfileUpdated, HandleUpdated, PrimaryTokenLinked
4. **LiraSocialGraph** - Followed, Unfollowed, Blocked, Unblocked, Muted, Unmuted
5. **TokenLaunchFactory** - TokenLaunched
6. **LiraUserTokenFactory** - ReputationTokenCreated, SocialTokenCreated, AccessTokenCreated

## Configuration

Set the following environment variables:

```bash
# Network selection
INDEXER_NETWORK=base-sepolia  # or base-mainnet

# RPC endpoints
BASE_SEPOLIA_RPC=https://sepolia.base.org
BASE_MAINNET_RPC=https://mainnet.base.org

# Contract addresses
NEXT_PUBLIC_LIRA_TOKEN=0x...
NEXT_PUBLIC_LIRA_REGISTRY=0x...
NEXT_PUBLIC_LIRA_PROFILE=0x...
NEXT_PUBLIC_LIRA_SOCIAL_GRAPH=0x...
NEXT_PUBLIC_FACTORY=0x...
NEXT_PUBLIC_USER_TOKEN_FACTORY=0x...

# Start blocks (optional)
START_BLOCK_SEPOLIA=0
START_BLOCK_MAINNET=0

# Indexer settings (optional)
INDEXER_POLL_INTERVAL=5000    # Poll every 5 seconds
INDEXER_BATCH_SIZE=1000       # Max events per batch
INDEXER_RETRY_ATTEMPTS=3      # Retry failed calls 3 times
INDEXER_RETRY_DELAY=1000      # Initial retry delay (ms)
INDEXER_LOG_LEVEL=info        # debug, info, warn, error

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/lira
```

## Installation

```bash
cd indexer
npm install
```

## Running

### Development
```bash
npm run dev
```

### Production
```bash
npm run build
npm start
```

### Docker
```bash
docker build -t lira-indexer .
docker run -d --env-file .env lira-indexer
```

## Architecture

### Event Flow
```
Blockchain → RPC Provider → Event Listener → Handler → Database
```

### Components

1. **config.ts** - Network and contract configuration
2. **index.ts** - Main indexer service and orchestration
3. **handlers/** - Event-specific processing logic
4. **utils/** - Logger and retry utilities

### Handler Responsibilities

Each handler:
- Decodes event parameters
- Checks for duplicates
- Creates/updates database records
- Handles related entities (users, stats, roles)
- Logs success/errors

### Database Operations

- **Users**: Auto-created from wallet addresses
- **Profiles**: Created from on-chain profile events
- **Tokens**: Created from launch/registration events
- **TokenEvents**: All events recorded for history
- **TokenStats**: Transaction counts and volumes
- **UserTokenRoles**: Creator and holder tracking
- **SocialEdges**: Follow/block/mute relationships

## Monitoring

The indexer logs:
- Startup and initialization
- Event processing (info level)
- Errors and retries (error/warn level)
- Checkpoints (debug level)

## Graceful Shutdown

The indexer handles SIGINT and SIGTERM signals:
- Stops accepting new events
- Completes in-flight operations
- Closes database connections
- Exits cleanly

## Testing

```bash
npm test
```

## Troubleshooting

### No events being processed
- Check RPC URL is accessible
- Verify contract addresses are correct
- Check start block is not too far in the future
- Review logs for connection errors

### Duplicate events
- The indexer automatically detects and skips duplicates based on (txHash, logIndex)

### Missing events
- Check checkpoints in logs
- Verify backfill completed
- Check for RPC rate limiting

### High memory usage
- Reduce INDEXER_BATCH_SIZE
- Increase INDEXER_POLL_INTERVAL
- Check for memory leaks in handlers

## Production Deployment

1. Set environment variables securely
2. Use a persistent database
3. Configure monitoring and alerting
4. Set up log aggregation
5. Use process manager (PM2, systemd)
6. Consider horizontal scaling for high volumes

## Future Enhancements

- [ ] Persistent checkpoint storage in DB
- [ ] Reorg detection and handling
- [ ] Webhook notifications
- [ ] Prometheus metrics
- [ ] GraphQL subscription support
- [ ] Multi-network support in single instance
