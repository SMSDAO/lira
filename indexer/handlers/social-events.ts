/**
 * Social Graph Event Handler
 * Processes social events from LiraSocialGraph contract
 */

import { PrismaClient } from '@prisma/client';
import { Log } from 'ethers';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

/**
 * Handle Followed events
 */
export async function handleFollowed(log: Log, decodedEvent: any): Promise<void> {
  try {
    const { follower, following } = decodedEvent.args;
    
    logger.info(`Followed: ${follower} -> ${following}`);

    // Ensure both users exist
    const followerUser = await ensureUser(follower.toLowerCase());
    const followingUser = await ensureUser(following.toLowerCase());

    // Create social edge
    await prisma.socialEdge.upsert({
      where: {
        followerId_followingId_edgeType: {
          followerId: followerUser.id,
          followingId: followingUser.id,
          edgeType: 'follow'
        }
      },
      update: {
        createdAt: new Date() // Update timestamp
      },
      create: {
        followerId: followerUser.id,
        followingId: followingUser.id,
        edgeType: 'follow'
      }
    });

    logger.info(`Follow edge created: ${follower} -> ${following}`);
  } catch (error) {
    logger.error(`Error handling Followed: ${error}`);
    throw error;
  }
}

/**
 * Handle Unfollowed events
 */
export async function handleUnfollowed(log: Log, decodedEvent: any): Promise<void> {
  try {
    const { follower, following } = decodedEvent.args;
    
    logger.info(`Unfollowed: ${follower} -> ${following}`);

    // Get users
    const followerUser = await prisma.user.findUnique({
      where: { walletAddress: follower.toLowerCase() }
    });
    const followingUser = await prisma.user.findUnique({
      where: { walletAddress: following.toLowerCase() }
    });

    if (!followerUser || !followingUser) {
      logger.warn(`User not found for Unfollowed event`);
      return;
    }

    // Delete social edge
    await prisma.socialEdge.deleteMany({
      where: {
        followerId: followerUser.id,
        followingId: followingUser.id,
        edgeType: 'follow'
      }
    });

    logger.info(`Follow edge deleted: ${follower} -> ${following}`);
  } catch (error) {
    logger.error(`Error handling Unfollowed: ${error}`);
    throw error;
  }
}

/**
 * Handle Blocked events
 */
export async function handleBlocked(log: Log, decodedEvent: any): Promise<void> {
  try {
    const { blocker, blocked } = decodedEvent.args;
    
    logger.info(`Blocked: ${blocker} -> ${blocked}`);

    // Ensure both users exist
    const blockerUser = await ensureUser(blocker.toLowerCase());
    const blockedUser = await ensureUser(blocked.toLowerCase());

    // Create block edge
    await prisma.socialEdge.upsert({
      where: {
        followerId_followingId_edgeType: {
          followerId: blockerUser.id,
          followingId: blockedUser.id,
          edgeType: 'block'
        }
      },
      update: {
        createdAt: new Date()
      },
      create: {
        followerId: blockerUser.id,
        followingId: blockedUser.id,
        edgeType: 'block'
      }
    });

    // Delete follow edges in both directions
    await prisma.socialEdge.deleteMany({
      where: {
        OR: [
          {
            followerId: blockerUser.id,
            followingId: blockedUser.id,
            edgeType: 'follow'
          },
          {
            followerId: blockedUser.id,
            followingId: blockerUser.id,
            edgeType: 'follow'
          }
        ]
      }
    });

    logger.info(`Block edge created: ${blocker} -> ${blocked}`);
  } catch (error) {
    logger.error(`Error handling Blocked: ${error}`);
    throw error;
  }
}

/**
 * Handle Unblocked events
 */
export async function handleUnblocked(log: Log, decodedEvent: any): Promise<void> {
  try {
    const { blocker, blocked } = decodedEvent.args;
    
    logger.info(`Unblocked: ${blocker} -> ${blocked}`);

    // Get users
    const blockerUser = await prisma.user.findUnique({
      where: { walletAddress: blocker.toLowerCase() }
    });
    const blockedUser = await prisma.user.findUnique({
      where: { walletAddress: blocked.toLowerCase() }
    });

    if (!blockerUser || !blockedUser) {
      logger.warn(`User not found for Unblocked event`);
      return;
    }

    // Delete block edge
    await prisma.socialEdge.deleteMany({
      where: {
        followerId: blockerUser.id,
        followingId: blockedUser.id,
        edgeType: 'block'
      }
    });

    logger.info(`Block edge deleted: ${blocker} -> ${blocked}`);
  } catch (error) {
    logger.error(`Error handling Unblocked: ${error}`);
    throw error;
  }
}

/**
 * Handle Muted events
 */
export async function handleMuted(log: Log, decodedEvent: any): Promise<void> {
  try {
    const { muter, muted } = decodedEvent.args;
    
    logger.info(`Muted: ${muter} -> ${muted}`);

    // Ensure both users exist
    const muterUser = await ensureUser(muter.toLowerCase());
    const mutedUser = await ensureUser(muted.toLowerCase());

    // Create mute edge
    await prisma.socialEdge.upsert({
      where: {
        followerId_followingId_edgeType: {
          followerId: muterUser.id,
          followingId: mutedUser.id,
          edgeType: 'mute'
        }
      },
      update: {
        createdAt: new Date()
      },
      create: {
        followerId: muterUser.id,
        followingId: mutedUser.id,
        edgeType: 'mute'
      }
    });

    logger.info(`Mute edge created: ${muter} -> ${muted}`);
  } catch (error) {
    logger.error(`Error handling Muted: ${error}`);
    throw error;
  }
}

/**
 * Handle Unmuted events
 */
export async function handleUnmuted(log: Log, decodedEvent: any): Promise<void> {
  try {
    const { muter, muted } = decodedEvent.args;
    
    logger.info(`Unmuted: ${muter} -> ${muted}`);

    // Get users
    const muterUser = await prisma.user.findUnique({
      where: { walletAddress: muter.toLowerCase() }
    });
    const mutedUser = await prisma.user.findUnique({
      where: { walletAddress: muted.toLowerCase() }
    });

    if (!muterUser || !mutedUser) {
      logger.warn(`User not found for Unmuted event`);
      return;
    }

    // Delete mute edge
    await prisma.socialEdge.deleteMany({
      where: {
        followerId: muterUser.id,
        followingId: mutedUser.id,
        edgeType: 'mute'
      }
    });

    logger.info(`Mute edge deleted: ${muter} -> ${muted}`);
  } catch (error) {
    logger.error(`Error handling Unmuted: ${error}`);
    throw error;
  }
}

/**
 * Ensure user exists, create if not
 */
async function ensureUser(walletAddress: string) {
  return await prisma.user.upsert({
    where: { walletAddress },
    update: {},
    create: {
      walletAddress,
      role: 'user',
      isVerified: false
    }
  });
}
