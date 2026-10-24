import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const demoSeedEnabled = process.env.SEED_DEMO_DATA === 'true';

async function main() {
  console.log('🌱 Starting database seed...');

  if (process.env.NODE_ENV === 'production' && !demoSeedEnabled) {
    console.log('Skipping demo seed in production. Set SEED_DEMO_DATA=true to seed example data.');
    return;
  }

  const adminWallet = process.env.ADMIN_ADDRESSES?.split(',')[0]?.trim() ?? '0x0000000000000000000000000000000000000000';

  await prisma.systemSetting.upsert({
    where: { key: 'protocol_fee_bps' },
    update: { value: process.env.DEFAULT_PROTOCOL_FEE ?? '100' },
    create: {
      key: 'protocol_fee_bps',
      value: process.env.DEFAULT_PROTOCOL_FEE ?? '100',
      description: 'Protocol fee in basis points (1%)',
    },
  });

  await prisma.systemSetting.upsert({
    where: { key: 'treasury_address' },
    update: { value: process.env.NEXT_PUBLIC_ADMIN_WALLET ?? adminWallet },
    create: {
      key: 'treasury_address',
      value: process.env.NEXT_PUBLIC_ADMIN_WALLET ?? adminWallet,
      description: 'Treasury or protocol admin wallet address',
    },
  });

  const alice = await prisma.user.upsert({
    where: { walletAddress: '0x742d35cc6634c0532925a3b844bc9e7595f0e5e5' },
    update: {},
    create: {
      walletAddress: '0x742d35cc6634c0532925a3b844bc9e7595f0e5e5',
      handle: 'alice',
      role: 'admin',
      profile: {
        create: {
          bio: 'Token creator and LIRA enthusiast 🚀',
          avatarUrl: 'https://avatar.example.com/alice.png',
          twitter: 'alice_crypto',
          website: 'https://alice.xyz',
        },
      },
    },
  });

  const bob = await prisma.user.upsert({
    where: { walletAddress: '0x8626f6940e2eb28930efb4cef49b2d1f2c9c1199' },
    update: {},
    create: {
      walletAddress: '0x8626f6940e2eb28930efb4cef49b2d1f2c9c1199',
      handle: 'bob',
      profile: {
        create: {
          bio: 'DeFi developer building on LIRA',
          avatarUrl: 'https://avatar.example.com/bob.png',
          twitter: 'bob_defi',
          discord: 'bob#1234',
        },
      },
    },
  });

  const carol = await prisma.user.upsert({
    where: { walletAddress: '0xdd2fd4581271e230360230f9337d5c0430bf44c0' },
    update: {},
    create: {
      walletAddress: '0xdd2fd4581271e230360230f9337d5c0430bf44c0',
      handle: 'carol',
      profile: {
        create: {
          bio: 'Artist and NFT creator',
          avatarUrl: 'https://avatar.example.com/carol.png',
        },
      },
    },
  });

  await prisma.socialEdge.upsert({
    where: {
      followerId_followingId_edgeType: {
        followerId: alice.id,
        followingId: bob.id,
        edgeType: 'follow',
      },
    },
    update: {},
    create: {
      followerId: alice.id,
      followingId: bob.id,
      edgeType: 'follow',
    },
  });

  await prisma.socialEdge.upsert({
    where: {
      followerId_followingId_edgeType: {
        followerId: bob.id,
        followingId: alice.id,
        edgeType: 'follow',
      },
    },
    update: {},
    create: {
      followerId: bob.id,
      followingId: alice.id,
      edgeType: 'follow',
    },
  });

  const aliceToken = await prisma.token.upsert({
    where: { contractAddress: '0x1111111111111111111111111111111111111111' },
    update: {},
    create: {
      contractAddress: '0x1111111111111111111111111111111111111111',
      name: 'Alice Token',
      symbol: 'ALT',
      tokenType: 'PROJECT',
      creatorAddress: alice.walletAddress,
      ownerAddress: alice.walletAddress,
      totalSupply: '1000000000000000000000000',
      decimals: 18,
      metadata: {
        description: 'Alice\'s project token for community governance',
        website: 'https://alicetoken.xyz',
        twitter: 'alicetoken',
      },
    },
  });

  const bobToken = await prisma.token.upsert({
    where: { contractAddress: '0x2222222222222222222222222222222222222222' },
    update: {},
    create: {
      contractAddress: '0x2222222222222222222222222222222222222222',
      name: 'Bob Social Token',
      symbol: 'BOB',
      tokenType: 'SOCIAL',
      creatorAddress: bob.walletAddress,
      ownerAddress: bob.walletAddress,
      totalSupply: '500000000000000000000000',
      decimals: 18,
      metadata: {
        description: 'Bob\'s social token for exclusive content',
      },
    },
  });

  await prisma.tokenStat.upsert({
    where: { tokenAddress: aliceToken.contractAddress },
    update: {},
    create: {
      tokenAddress: aliceToken.contractAddress,
      holderCount: 123,
      volumeTotal: '15500000000000000000',
      marketCap: '5000000000000000000000',
      transactionCount: 456,
    },
  });

  await prisma.tokenStat.upsert({
    where: { tokenAddress: bobToken.contractAddress },
    update: {},
    create: {
      tokenAddress: bobToken.contractAddress,
      holderCount: 89,
      volumeTotal: '8200000000000000000',
      marketCap: '2500000000000000000000',
      transactionCount: 234,
    },
  });

  await prisma.userTokenRole.upsert({
    where: {
      userId_tokenAddress_role: {
        userId: alice.id,
        tokenAddress: aliceToken.contractAddress,
        role: 'creator',
      },
    },
    update: {},
    create: {
      userId: alice.id,
      tokenAddress: aliceToken.contractAddress,
      role: 'creator',
      balance: '500000000000000000000000',
    },
  });

  await prisma.post.createMany({
    data: [
      {
        authorId: alice.id,
        content: 'Just launched my first token on LIRA! 🚀 Check out ALT token!',
        mediaUrls: '[]',
      },
      {
        authorId: bob.id,
        content: 'LIRA SOCIAL is amazing! Love the on-chain profiles and social graph.',
        mediaUrls: '[]',
      },
      {
        authorId: carol.id,
        content: 'Excited to be part of the LIRA ecosystem! 💜',
        mediaUrls: '[]',
      },
    ],
    skipDuplicates: true,
  });

  console.log('✅ Database seed complete.');
}

main()
  .catch((error) => {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
