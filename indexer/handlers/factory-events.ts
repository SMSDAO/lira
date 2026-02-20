/**
 * Factory Event Handler
 * Processes token launch events from factories
 */

import { PrismaClient } from '@prisma/client';
import { Log } from 'ethers';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

/**
 * Handle TokenLaunched events from TokenLaunchFactory
 */
export async function handleTokenLaunched(log: Log, decodedEvent: any): Promise<void> {
  try {
    const { tokenAddress, creator, name, symbol, totalSupply } = decodedEvent.args;
    
    logger.info(`TokenLaunched: ${name} (${symbol}) at ${tokenAddress} by ${creator}`);

    // Create token
    await prisma.token.upsert({
      where: { contractAddress: tokenAddress.toLowerCase() },
      update: {
        name,
        symbol,
        totalSupply: totalSupply.toString(),
        launchedAt: new Date(),
        updatedAt: new Date()
      },
      create: {
        contractAddress: tokenAddress.toLowerCase(),
        name,
        symbol,
        decimals: 18,
        totalSupply: totalSupply.toString(),
        tokenType: 'PROJECT',
        creatorAddress: creator.toLowerCase(),
        ownerAddress: creator.toLowerCase(),
        isActive: true,
        launchedAt: new Date(),
        metadata: {}
      }
    });

    // Create token event
    await prisma.tokenEvent.create({
      data: {
        tokenAddress: tokenAddress.toLowerCase(),
        eventType: 'TokenLaunched',
        toAddress: creator.toLowerCase(),
        amount: totalSupply.toString(),
        transactionHash: log.transactionHash,
        blockNumber: log.blockNumber,
        blockTimestamp: new Date(),
        logIndex: log.index,
        metadata: { name, symbol }
      }
    });

    // Create token stats
    await prisma.tokenStat.create({
      data: {
        tokenAddress: tokenAddress.toLowerCase(),
        holderCount: 1,
        transactionCount: 0,
        volume24h: 0,
        volume7d: 0,
        volume30d: 0,
        volumeTotal: 0
      }
    });

    // Ensure creator user exists
    const user = await prisma.user.upsert({
      where: { walletAddress: creator.toLowerCase() },
      update: {},
      create: {
        walletAddress: creator.toLowerCase(),
        role: 'user',
        isVerified: false
      }
    });

    // Create creator role
    await prisma.userTokenRole.create({
      data: {
        userId: user.id,
        tokenAddress: tokenAddress.toLowerCase(),
        role: 'creator',
        balance: totalSupply.toString()
      }
    });

    logger.info(`Token ${name} indexed successfully`);
  } catch (error) {
    logger.error(`Error handling TokenLaunched: ${error}`);
    throw error;
  }
}

/**
 * Handle user token creation events from LiraUserTokenFactory
 */
export async function handleReputationTokenCreated(log: Log, decodedEvent: any): Promise<void> {
  await handleUserTokenCreated(log, decodedEvent, 'USER', 'ReputationTokenCreated');
}

export async function handleSocialTokenCreated(log: Log, decodedEvent: any): Promise<void> {
  await handleUserTokenCreated(log, decodedEvent, 'SOCIAL', 'SocialTokenCreated');
}

export async function handleAccessTokenCreated(log: Log, decodedEvent: any): Promise<void> {
  await handleUserTokenCreated(log, decodedEvent, 'USER', 'AccessTokenCreated');
}

async function handleUserTokenCreated(log: Log, decodedEvent: any, tokenType: string, eventType: string): Promise<void> {
  try {
    const { tokenAddress, creator, name, symbol } = decodedEvent.args;
    
    logger.info(`${eventType}: ${name} (${symbol}) at ${tokenAddress} by ${creator}`);

    // Create token
    await prisma.token.upsert({
      where: { contractAddress: tokenAddress.toLowerCase() },
      update: {
        name,
        symbol,
        tokenType,
        launchedAt: new Date(),
        updatedAt: new Date()
      },
      create: {
        contractAddress: tokenAddress.toLowerCase(),
        name,
        symbol,
        decimals: 18,
        tokenType,
        creatorAddress: creator.toLowerCase(),
        ownerAddress: creator.toLowerCase(),
        isActive: true,
        launchedAt: new Date(),
        metadata: {}
      }
    });

    // Create token event
    await prisma.tokenEvent.create({
      data: {
        tokenAddress: tokenAddress.toLowerCase(),
        eventType,
        toAddress: creator.toLowerCase(),
        transactionHash: log.transactionHash,
        blockNumber: log.blockNumber,
        blockTimestamp: new Date(),
        logIndex: log.index,
        metadata: { name, symbol, tokenType }
      }
    });

    // Ensure creator exists
    const user = await prisma.user.upsert({
      where: { walletAddress: creator.toLowerCase() },
      update: {},
      create: {
        walletAddress: creator.toLowerCase(),
        role: 'user',
        isVerified: false
      }
    });

    // Create creator role
    await prisma.userTokenRole.create({
      data: {
        userId: user.id,
        tokenAddress: tokenAddress.toLowerCase(),
        role: 'creator'
      }
    });

    logger.info(`User token ${name} indexed successfully`);
  } catch (error) {
    logger.error(`Error handling ${eventType}: ${error}`);
    throw error;
  }
}
