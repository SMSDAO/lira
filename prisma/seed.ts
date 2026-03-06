import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create test users with profiles
  const alice = await prisma.user.upsert({
    where: { walletAddress: '0x742d35cc6634c0532925a3b844bc9e7595f0e5e5' },
    update: {},
    create: {
      walletAddress: '0x742d35cc6634c0532925a3b844bc9e7595f0e5e5',
      handle: 'alice',
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

  console.log('✅ Created users: alice, bob, carol');

  // Create social edges (follows)
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

  await prisma.socialEdge.upsert({
    where: {
      followerId_followingId_edgeType: {
        followerId: carol.id,
        followingId: alice.id,
        edgeType: 'follow',
      },
    },
    update: {},
    create: {
      followerId: carol.id,
      followingId: alice.id,
      edgeType: 'follow',
    },
  });

  console.log('✅ Created social edges (follows)');

  // Create tokens
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

  console.log('✅ Created tokens: ALT, BOB');

  // Create token stats
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

  console.log('✅ Created token stats');

  // Create user token roles
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

  await prisma.userTokenRole.upsert({
    where: {
      userId_tokenAddress_role: {
        userId: bob.id,
        tokenAddress: aliceToken.contractAddress,
        role: 'holder',
      },
    },
    update: {},
    create: {
      userId: bob.id,
      tokenAddress: aliceToken.contractAddress,
      role: 'holder',
      balance: '10000000000000000000000',
    },
  });

  console.log('✅ Created user token roles');

  // Create posts
  await prisma.post.create({
    data: {
      authorId: alice.id,
      content: 'Just launched my first token on LIRA! 🚀 Check out ALT token!',
      mediaUrls: [],
    },
  });

  await prisma.post.create({
    data: {
      authorId: bob.id,
      content: 'LIRA SOCIAL is amazing! Love the on-chain profiles and social graph.',
      mediaUrls: [],
    },
  });

  await prisma.post.create({
    data: {
      authorId: carol.id,
      content: 'Excited to be part of the LIRA ecosystem! 💜',
      mediaUrls: [],
    },
  });

  console.log('✅ Created posts');

  // Create system settings
  await prisma.systemSetting.upsert({
    where: { key: 'protocol_fee_bps' },
    update: {},
    create: {
      key: 'protocol_fee_bps',
      value: '100',
      description: 'Protocol fee in basis points (1%)',
    },
  });

  await prisma.systemSetting.upsert({
    where: { key: 'treasury_address' },
    update: {},
    create: {
      key: 'treasury_address',
      value: '0x0000000000000000000000000000000000000000',
      description: 'Treasury contract address',
    },
  });

  console.log('✅ Created system settings');

  console.log('🎉 Database seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

