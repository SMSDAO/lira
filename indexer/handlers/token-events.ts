/**
 * Token Event Handler
 * Processes Transfer and Approval events from LiraToken
 */

import { PrismaClient } from '@prisma/client';
import { Log } from 'ethers';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export interface TokenEventData {
  tokenAddress: string;
  eventType: string;
  fromAddress?: string;
  toAddress?: string;
  amount?: string;
  transactionHash: string;
  blockNumber: number;
  blockTimestamp: number;
  logIndex: number;
  metadata?: any;
}

/**
 * Handle Transfer events
 */
export async function handleTransfer(log: Log, decodedEvent: any): Promise<void> {
  try {
    const { from, to, value } = decodedEvent.args;
    
    const eventData: TokenEventData = {
      tokenAddress: log.address.toLowerCase(),
      eventType: 'Transfer',
      fromAddress: from.toLowerCase(),
      toAddress: to.toLowerCase(),
      amount: value.toString(),
      transactionHash: log.transactionHash,
      blockNumber: log.blockNumber,
      blockTimestamp: Date.now(), // Will be set from block timestamp
      logIndex: log.index,
      metadata: {}
    };

    // Check if event already exists (prevent duplicates)
    const existing = await prisma.tokenEvent.findFirst({
      where: {
        transactionHash: eventData.transactionHash,
        logIndex: eventData.logIndex
      }
    });

    if (existing) {
      logger.debug(`Transfer event already indexed: ${eventData.transactionHash}-${eventData.logIndex}`);
      return;
    }

    // Create token event
    await prisma.tokenEvent.create({
      data: {
        tokenAddress: eventData.tokenAddress,
        eventType: eventData.eventType,
        fromAddress: eventData.fromAddress,
        toAddress: eventData.toAddress,
        amount: eventData.amount,
        transactionHash: eventData.transactionHash,
        blockNumber: eventData.blockNumber,
        blockTimestamp: new Date(eventData.blockTimestamp),
        logIndex: eventData.logIndex,
        metadata: eventData.metadata
      }
    });

    // Update token stats
    await updateTokenStats(eventData.tokenAddress);

    // Update user token roles (balances)
    if (eventData.fromAddress && eventData.fromAddress !== '0x0000000000000000000000000000000000000000') {
      await updateUserBalance(eventData.fromAddress, eventData.tokenAddress);
    }
    if (eventData.toAddress && eventData.toAddress !== '0x0000000000000000000000000000000000000000') {
      await updateUserBalance(eventData.toAddress, eventData.tokenAddress);
    }

    logger.info(`Transfer indexed: ${eventData.transactionHash} - ${from} -> ${to}`);
  } catch (error) {
    logger.error(`Error handling Transfer event: ${error}`);
    throw error;
  }
}

/**
 * Handle Approval events
 */
export async function handleApproval(log: Log, decodedEvent: any): Promise<void> {
  try {
    const { owner, spender, value } = decodedEvent.args;
    
    const eventData: TokenEventData = {
      tokenAddress: log.address.toLowerCase(),
      eventType: 'Approval',
      fromAddress: owner.toLowerCase(),
      toAddress: spender.toLowerCase(),
      amount: value.toString(),
      transactionHash: log.transactionHash,
      blockNumber: log.blockNumber,
      blockTimestamp: Date.now(),
      logIndex: log.index,
      metadata: {}
    };

    // Check for duplicates
    const existing = await prisma.tokenEvent.findFirst({
      where: {
        transactionHash: eventData.transactionHash,
        logIndex: eventData.logIndex
      }
    });

    if (existing) {
      return;
    }

    // Create event
    await prisma.tokenEvent.create({
      data: {
        tokenAddress: eventData.tokenAddress,
        eventType: eventData.eventType,
        fromAddress: eventData.fromAddress,
        toAddress: eventData.toAddress,
        amount: eventData.amount,
        transactionHash: eventData.transactionHash,
        blockNumber: eventData.blockNumber,
        blockTimestamp: new Date(eventData.blockTimestamp),
        logIndex: eventData.logIndex,
        metadata: eventData.metadata
      }
    });

    logger.info(`Approval indexed: ${eventData.transactionHash}`);
  } catch (error) {
    logger.error(`Error handling Approval event: ${error}`);
    throw error;
  }
}

/**
 * Update token statistics
 */
async function updateTokenStats(tokenAddress: string): Promise<void> {
  try {
    // Get or create token stats
    let stats = await prisma.tokenStat.findFirst({
      where: { tokenAddress }
    });

    if (!stats) {
      stats = await prisma.tokenStat.create({
        data: {
          tokenAddress,
          holderCount: 0,
          transactionCount: 0,
          volume24h: 0,
          volume7d: 0,
          volume30d: 0,
          volumeTotal: 0
        }
      });
    }

    // Increment transaction count
    await prisma.tokenStat.update({
      where: { id: stats.id },
      data: {
        transactionCount: { increment: 1 },
        lastUpdated: new Date()
      }
    });
  } catch (error) {
    logger.error(`Error updating token stats: ${error}`);
  }
}

/**
 * Update user token balance
 */
async function updateUserBalance(userAddress: string, tokenAddress: string): Promise<void> {
  try {
    // Find or create user
    let user = await prisma.user.findUnique({
      where: { walletAddress: userAddress }
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          walletAddress: userAddress,
          role: 'user',
          isVerified: false
        }
      });
    }

    // Update or create user token role
    await prisma.userTokenRole.upsert({
      where: {
        userId_tokenAddress_role: {
          userId: user.id,
          tokenAddress,
          role: 'holder'
        }
      },
      update: {
        updatedAt: new Date()
      },
      create: {
        userId: user.id,
        tokenAddress,
        role: 'holder',
        balance: 0 // Will be updated by a balance fetcher
      }
    });
  } catch (error) {
    logger.error(`Error updating user balance: ${error}`);
  }
}
