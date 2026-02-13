/**
 * LIRA Blockchain Event Indexer
 * Main service entry point
 */

import { ethers } from 'ethers';
import { PrismaClient } from '@prisma/client';
import { NETWORKS, CONTRACTS, ACTIVE_NETWORK, INDEXER_CONFIG } from './config';
import { logger } from './utils/logger';
import { retryWithBackoff } from './utils/retry';
import * as tokenHandlers from './handlers/token-events';
import * as registryHandlers from './handlers/registry-events';
import * as profileHandlers from './handlers/profile-events';
import * as socialHandlers from './handlers/social-events';
import * as factoryHandlers from './handlers/factory-events';

const prisma = new PrismaClient();

interface Checkpoint {
  contract: string;
  lastBlock: number;
}

export class LiraIndexer {
  private provider: ethers.Provider;
  private contracts: Map<string, ethers.Contract> = new Map();
  private checkpoints: Map<string, number> = new Map();
  private isRunning: boolean = false;

  constructor() {
    const network = NETWORKS[ACTIVE_NETWORK];
    if (!network) {
      throw new Error(`Network ${ACTIVE_NETWORK} not configured`);
    }

    logger.info(`Initializing indexer for ${network.name}`);
    this.provider = new ethers.JsonRpcProvider(network.rpcUrl);
  }

  /**
   * Initialize contracts
   */
  async initialize(): Promise<void> {
    logger.info('Initializing contracts...');

    for (const [name, config] of Object.entries(CONTRACTS)) {
      if (!config.address) {
        logger.warn(`Contract ${name} has no address configured, skipping`);
        continue;
      }

      try {
        // Load ABI from artifacts
        const artifact = require(`../artifacts/contracts/${name}.sol/${name}.json`);
        const contract = new ethers.Contract(
          config.address,
          artifact.abi,
          this.provider
        );

        this.contracts.set(name, contract);
        logger.info(`Initialized contract: ${name} at ${config.address}`);
      } catch (error) {
        logger.warn(`Failed to initialize contract ${name}: ${error}`);
      }
    }

    // Load checkpoints from DB or use start blocks
    await this.loadCheckpoints();
  }

  /**
   * Load last processed blocks from database or use configured start blocks
   */
  async loadCheckpoints(): Promise<void> {
    logger.info('Loading checkpoints...');

    const network = NETWORKS[ACTIVE_NETWORK];
    
    for (const contractName of this.contracts.keys()) {
      // Try to get last processed block from DB
      const lastEvent = await prisma.tokenEvent.findFirst({
        where: {
          tokenAddress: CONTRACTS[contractName]?.address?.toLowerCase()
        },
        orderBy: {
          blockNumber: 'desc'
        },
        select: {
          blockNumber: true
        }
      });

      const checkpoint = lastEvent?.blockNumber || network.startBlock || 0;
      this.checkpoints.set(contractName, checkpoint);
      logger.info(`${contractName} checkpoint: block ${checkpoint}`);
    }
  }

  /**
   * Save checkpoint to memory (could be persisted to DB)
   */
  async saveCheckpoint(contractName: string, blockNumber: number): Promise<void> {
    this.checkpoints.set(contractName, blockNumber);
  }

  /**
   * Start indexing
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      logger.warn('Indexer is already running');
      return;
    }

    this.isRunning = true;
    logger.info('Starting indexer...');

    // Start listening for new events
    await this.subscribeToEvents();

    // Backfill historical events
    await this.backfillEvents();

    // Start polling loop
    this.startPolling();

    logger.info('Indexer started successfully');
  }

  /**
   * Stop indexing
   */
  async stop(): Promise<void> {
    this.isRunning = false;
    logger.info('Stopping indexer...');
    await prisma.$disconnect();
    logger.info('Indexer stopped');
  }

  /**
   * Subscribe to real-time events
   */
  async subscribeToEvents(): Promise<void> {
    logger.info('Subscribing to real-time events...');

    for (const [contractName, contract] of this.contracts.entries()) {
      const eventNames = CONTRACTS[contractName]?.events || [];

      for (const eventName of eventNames) {
        contract.on(eventName, async (...args) => {
          const event = args[args.length - 1]; // Last arg is the event object
          await this.processEvent(contractName, eventName, event);
        });

        logger.info(`Subscribed to ${contractName}.${eventName}`);
      }
    }
  }

  /**
   * Backfill historical events
   */
  async backfillEvents(): Promise<void> {
    logger.info('Backfilling historical events...');

    const currentBlock = await this.provider.getBlockNumber();

    for (const [contractName, contract] of this.contracts.entries()) {
      const checkpoint = this.checkpoints.get(contractName) || 0;
      
      if (checkpoint >= currentBlock) {
        logger.info(`${contractName} is up to date`);
        continue;
      }

      logger.info(`Backfilling ${contractName} from block ${checkpoint} to ${currentBlock}`);

      const eventNames = CONTRACTS[contractName]?.events || [];
      
      for (const eventName of eventNames) {
        await retryWithBackoff(async () => {
          const filter = contract.filters[eventName]?.();
          if (!filter) {
            logger.warn(`No filter found for ${contractName}.${eventName}`);
            return;
          }

          const events = await contract.queryFilter(
            filter,
            checkpoint + 1,
            currentBlock
          );

          logger.info(`Found ${events.length} ${eventName} events for ${contractName}`);

          for (const event of events) {
            await this.processEvent(contractName, eventName, event);
          }
        }, INDEXER_CONFIG.retryAttempts);
      }

      await this.saveCheckpoint(contractName, currentBlock);
    }

    logger.info('Backfill complete');
  }

  /**
   * Start polling for new blocks
   */
  startPolling(): void {
    setInterval(async () => {
      if (!this.isRunning) return;

      try {
        const currentBlock = await this.provider.getBlockNumber();

        for (const [contractName, contract] of this.contracts.entries()) {
          const checkpoint = this.checkpoints.get(contractName) || 0;

          if (checkpoint >= currentBlock) continue;

          const eventNames = CONTRACTS[contractName]?.events || [];

          for (const eventName of eventNames) {
            const filter = contract.filters[eventName]?.();
            if (!filter) continue;

            const events = await contract.queryFilter(
              filter,
              checkpoint + 1,
              currentBlock
            );

            for (const event of events) {
              await this.processEvent(contractName, eventName, event);
            }
          }

          await this.saveCheckpoint(contractName, currentBlock);
        }
      } catch (error) {
        logger.error(`Polling error: ${error}`);
      }
    }, INDEXER_CONFIG.pollInterval);

    logger.info(`Polling started (interval: ${INDEXER_CONFIG.pollInterval}ms)`);
  }

  /**
   * Process a single event
   */
  async processEvent(contractName: string, eventName: string, event: any): Promise<void> {
    try {
      logger.debug(`Processing ${contractName}.${eventName} at block ${event.blockNumber}`);

      // Route to appropriate handler
      const handler = this.getEventHandler(contractName, eventName);
      if (handler) {
        await handler(event, event);
      } else {
        logger.warn(`No handler found for ${contractName}.${eventName}`);
      }
    } catch (error) {
      logger.error(`Error processing ${contractName}.${eventName}: ${error}`);
    }
  }

  /**
   * Get handler function for event
   */
  getEventHandler(contractName: string, eventName: string): Function | null {
    const handlers: Record<string, Record<string, Function>> = {
      LiraToken: {
        Transfer: tokenHandlers.handleTransfer,
        Approval: tokenHandlers.handleApproval,
      },
      LiraTokenRegistry: {
        TokenRegistered: registryHandlers.handleTokenRegistered,
        TokenUpdated: registryHandlers.handleTokenUpdated,
        TokenRemoved: registryHandlers.handleTokenRemoved,
      },
      LiraProfile: {
        ProfileCreated: profileHandlers.handleProfileCreated,
        ProfileUpdated: profileHandlers.handleProfileUpdated,
        HandleUpdated: profileHandlers.handleHandleUpdated,
        PrimaryTokenLinked: profileHandlers.handlePrimaryTokenLinked,
      },
      LiraSocialGraph: {
        Followed: socialHandlers.handleFollowed,
        Unfollowed: socialHandlers.handleUnfollowed,
        Blocked: socialHandlers.handleBlocked,
        Unblocked: socialHandlers.handleUnblocked,
        Muted: socialHandlers.handleMuted,
        Unmuted: socialHandlers.handleUnmuted,
      },
      TokenLaunchFactory: {
        TokenLaunched: factoryHandlers.handleTokenLaunched,
      },
      LiraUserTokenFactory: {
        ReputationTokenCreated: factoryHandlers.handleReputationTokenCreated,
        SocialTokenCreated: factoryHandlers.handleSocialTokenCreated,
        AccessTokenCreated: factoryHandlers.handleAccessTokenCreated,
      },
    };

    return handlers[contractName]?.[eventName] || null;
  }
}

// Main entry point
async function main() {
  logger.info('LIRA Event Indexer starting...');

  const indexer = new LiraIndexer();
  
  try {
    await indexer.initialize();
    await indexer.start();

    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      logger.info('Received SIGINT, shutting down...');
      await indexer.stop();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      logger.info('Received SIGTERM, shutting down...');
      await indexer.stop();
      process.exit(0);
    });
  } catch (error) {
    logger.error(`Fatal error: ${error}`);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch((error) => {
    logger.error(`Unhandled error: ${error}`);
    process.exit(1);
  });
}

export default LiraIndexer;
