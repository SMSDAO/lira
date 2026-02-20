/**
 * Registry Event Handler
 * Processes events from LiraTokenRegistry
 */

import { PrismaClient } from '@prisma/client';
import { Log } from 'ethers';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

/**
 * Handle TokenRegistered events
 */
export async function handleTokenRegistered(log: Log, decodedEvent: any): Promise<void> {
  try {
    const { tokenAddress, owner, tokenType, registryId } = decodedEvent.args;
    
    logger.info(`TokenRegistered: ${tokenAddress} by ${owner} type=${tokenType} id=${registryId}`);

    // Create or update token
    await prisma.token.upsert({
      where: { contractAddress: tokenAddress.toLowerCase() },
      update: {
        tokenType: getTokenTypeName(tokenType),
        ownerAddress: owner.toLowerCase(),
        registryId: registryId.toNumber(),
        isActive: true,
        updatedAt: new Date()
      },
      create: {
        contractAddress: tokenAddress.toLowerCase(),
        name: 'Unknown', // Will be updated by separate fetch
        symbol: 'UNK',
        decimals: 18,
        tokenType: getTokenTypeName(tokenType),
        creatorAddress: owner.toLowerCase(),
        ownerAddress: owner.toLowerCase(),
        registryId: registryId.toNumber(),
        isActive: true,
        metadata: {}
      }
    });

    // Create token event
    await prisma.tokenEvent.create({
      data: {
        tokenAddress: tokenAddress.toLowerCase(),
        eventType: 'TokenRegistered',
        toAddress: owner.toLowerCase(),
        transactionHash: log.transactionHash,
        blockNumber: log.blockNumber,
        blockTimestamp: new Date(),
        logIndex: log.index,
        metadata: { tokenType: tokenType.toNumber(), registryId: registryId.toNumber() }
      }
    });

    // Create user if doesn't exist
    await prisma.user.upsert({
      where: { walletAddress: owner.toLowerCase() },
      update: {},
      create: {
        walletAddress: owner.toLowerCase(),
        role: 'user',
        isVerified: false
      }
    });

    // Create creator role
    const user = await prisma.user.findUnique({
      where: { walletAddress: owner.toLowerCase() }
    });

    if (user) {
      await prisma.userTokenRole.upsert({
        where: {
          userId_tokenAddress_role: {
            userId: user.id,
            tokenAddress: tokenAddress.toLowerCase(),
            role: 'creator'
          }
        },
        update: {},
        create: {
          userId: user.id,
          tokenAddress: tokenAddress.toLowerCase(),
          role: 'creator'
        }
      });
    }

    logger.info(`Token registered in DB: ${tokenAddress}`);
  } catch (error) {
    logger.error(`Error handling TokenRegistered: ${error}`);
    throw error;
  }
}

/**
 * Handle TokenUpdated events
 */
export async function handleTokenUpdated(log: Log, decodedEvent: any): Promise<void> {
  try {
    const { tokenAddress, owner, tokenType } = decodedEvent.args;
    
    await prisma.token.update({
      where: { contractAddress: tokenAddress.toLowerCase() },
      data: {
        ownerAddress: owner.toLowerCase(),
        tokenType: getTokenTypeName(tokenType),
        updatedAt: new Date()
      }
    });

    // Create event
    await prisma.tokenEvent.create({
      data: {
        tokenAddress: tokenAddress.toLowerCase(),
        eventType: 'TokenUpdated',
        toAddress: owner.toLowerCase(),
        transactionHash: log.transactionHash,
        blockNumber: log.blockNumber,
        blockTimestamp: new Date(),
        logIndex: log.index,
        metadata: { tokenType: tokenType.toNumber() }
      }
    });

    logger.info(`Token updated: ${tokenAddress}`);
  } catch (error) {
    logger.error(`Error handling TokenUpdated: ${error}`);
    throw error;
  }
}

/**
 * Handle TokenRemoved events
 */
export async function handleTokenRemoved(log: Log, decodedEvent: any): Promise<void> {
  try {
    const { tokenAddress } = decodedEvent.args;
    
    await prisma.token.update({
      where: { contractAddress: tokenAddress.toLowerCase() },
      data: {
        isActive: false,
        updatedAt: new Date()
      }
    });

    // Create event
    await prisma.tokenEvent.create({
      data: {
        tokenAddress: tokenAddress.toLowerCase(),
        eventType: 'TokenRemoved',
        transactionHash: log.transactionHash,
        blockNumber: log.blockNumber,
        blockTimestamp: new Date(),
        logIndex: log.index,
        metadata: {}
      }
    });

    logger.info(`Token removed: ${tokenAddress}`);
  } catch (error) {
    logger.error(`Error handling TokenRemoved: ${error}`);
    throw error;
  }
}

/**
 * Convert token type number to name
 */
function getTokenTypeName(tokenType: any): string {
  const typeNum = typeof tokenType === 'number' ? tokenType : tokenType.toNumber();
  const types = ['PROJECT', 'USER', 'SOCIAL'];
  return types[typeNum] || 'UNKNOWN';
}
