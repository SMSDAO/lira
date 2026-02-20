/**
 * Profile Event Handler
 * Processes events from LiraProfile contract
 */

import { PrismaClient } from '@prisma/client';
import { Log } from 'ethers';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

/**
 * Handle ProfileCreated events
 */
export async function handleProfileCreated(log: Log, decodedEvent: any): Promise<void> {
  try {
    const { userAddress, handle, metadataURI } = decodedEvent.args;
    
    logger.info(`ProfileCreated: ${handle} for ${userAddress}`);

    // Create or get user
    const user = await prisma.user.upsert({
      where: { walletAddress: userAddress.toLowerCase() },
      update: {
        handle: handle,
        updatedAt: new Date()
      },
      create: {
        walletAddress: userAddress.toLowerCase(),
        handle: handle,
        role: 'user',
        isVerified: false
      }
    });

    // Create profile
    await prisma.profile.upsert({
      where: { userId: user.id },
      update: {
        metadataUri: metadataURI || null,
        updatedAt: new Date()
      },
      create: {
        userId: user.id,
        metadataUri: metadataURI || null,
        preferences: {}
      }
    });

    logger.info(`Profile created in DB for user ${userAddress}`);
  } catch (error) {
    logger.error(`Error handling ProfileCreated: ${error}`);
    throw error;
  }
}

/**
 * Handle ProfileUpdated events
 */
export async function handleProfileUpdated(log: Log, decodedEvent: any): Promise<void> {
  try {
    const { userAddress, metadataURI } = decodedEvent.args;
    
    logger.info(`ProfileUpdated: ${userAddress}`);

    // Get user
    const user = await prisma.user.findUnique({
      where: { walletAddress: userAddress.toLowerCase() }
    });

    if (!user) {
      logger.warn(`User not found for ProfileUpdated: ${userAddress}`);
      return;
    }

    // Update profile
    await prisma.profile.update({
      where: { userId: user.id },
      data: {
        metadataUri: metadataURI || null,
        updatedAt: new Date()
      }
    });

    logger.info(`Profile updated for user ${userAddress}`);
  } catch (error) {
    logger.error(`Error handling ProfileUpdated: ${error}`);
    throw error;
  }
}

/**
 * Handle HandleUpdated events
 */
export async function handleHandleUpdated(log: Log, decodedEvent: any): Promise<void> {
  try {
    const { userAddress, oldHandle, newHandle } = decodedEvent.args;
    
    logger.info(`HandleUpdated: ${oldHandle} -> ${newHandle} for ${userAddress}`);

    // Update user handle
    await prisma.user.update({
      where: { walletAddress: userAddress.toLowerCase() },
      data: {
        handle: newHandle,
        updatedAt: new Date()
      }
    });

    logger.info(`Handle updated for user ${userAddress}`);
  } catch (error) {
    logger.error(`Error handling HandleUpdated: ${error}`);
    throw error;
  }
}

/**
 * Handle PrimaryTokenLinked events
 */
export async function handlePrimaryTokenLinked(log: Log, decodedEvent: any): Promise<void> {
  try {
    const { userAddress, tokenAddress } = decodedEvent.args;
    
    logger.info(`PrimaryTokenLinked: ${tokenAddress} for ${userAddress}`);

    // Get user
    const user = await prisma.user.findUnique({
      where: { walletAddress: userAddress.toLowerCase() }
    });

    if (!user) {
      logger.warn(`User not found for PrimaryTokenLinked: ${userAddress}`);
      return;
    }

    // Update profile with primary token
    await prisma.profile.update({
      where: { userId: user.id },
      data: {
        primaryTokenAddress: tokenAddress.toLowerCase(),
        updatedAt: new Date()
      }
    });

    logger.info(`Primary token linked for user ${userAddress}`);
  } catch (error) {
    logger.error(`Error handling PrimaryTokenLinked: ${error}`);
    throw error;
  }
}
