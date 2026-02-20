# LIRA SOCIAL - Decentralized Social Layer

## Overview

LIRA SOCIAL is the on-chain social layer for the LIRA ecosystem, enabling users to build profiles, follow each other, and create community-driven token economies.

## Architecture

### Smart Contracts

#### 1. LiraProfile.sol

On-chain user profile management with handle registration and metadata.

**Features:**
- Unique handle system (alphanumeric + underscore)
- IPFS/Arweave metadata URIs for rich profiles
- Primary token linking for user tokens
- Handle transfers and updates
- Profile creation timestamps

**Functions:**
```solidity
setProfile(handle, metadataURI)  // Create or update profile
setMetadataURI(metadataURI)      // Update metadata only
linkPrimaryToken(tokenAddress)    // Link primary social token
getProfile(address)               // Get user profile
getAddressByHandle(handle)        // Lookup address by handle
isHandleAvailable(handle)         // Check handle availability
```

#### 2. LiraSocialGraph.sol

Social graph management with follows, blocks, and mutes.

**Features:**
- Follow/unfollow system
- Block/unblock functionality
- Mute/unmute for content filtering
- Auto-unfollow on block
- Bidirectional relationship tracking

**Functions:**
```solidity
follow(address)          // Follow a user
unfollow(address)        // Unfollow a user
block(address)           // Block a user (auto-unfollows)
unblock(address)         // Unblock a user
mute(address)            // Mute a user's content
unmute(address)          // Unmute a user
getFollowing(address)    // Get list of users being followed
getFollowers(address)    // Get list of followers
getFollowingCount()      // Get following count
getFollowerCount()       // Get follower count
isFollowing(a, b)        // Check if A follows B
isBlocked(a, b)          // Check if A blocked B
isMuted(a, b)            // Check if A muted B
```

#### 3. LiraTokenRegistry.sol

Subtoken and user token registry.

**Token Types:**
- `PROJECT`: Project/protocol tokens
- `USER`: User reputation/social tokens
- `SOCIAL`: Community/social tokens

**Features:**
- Register all launched tokens
- Track token ownership
- Query tokens by owner or type
- Authorized registrar system (e.g., TokenLaunchFactory)

## Database Schema

### Users Table

```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    wallet_address VARCHAR(42) UNIQUE NOT NULL,
    handle VARCHAR(32) UNIQUE,
    email VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    role VARCHAR(20) DEFAULT 'user',
    is_verified BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_users_wallet ON users(wallet_address);
CREATE INDEX idx_users_handle ON users(handle);
```

### Profiles Table

```sql
CREATE TABLE profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    bio TEXT,
    avatar_url VARCHAR(500),
    banner_url VARCHAR(500),
    website VARCHAR(500),
    twitter VARCHAR(100),
    discord VARCHAR(100),
    telegram VARCHAR(100),
    metadata_uri VARCHAR(500),
    primary_token_address VARCHAR(42),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_profiles_user ON profiles(user_id);
```

### Social Edges Table

```sql
CREATE TABLE social_edges (
    id SERIAL PRIMARY KEY,
    follower_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    following_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    edge_type VARCHAR(20) NOT NULL, -- 'follow', 'block', 'mute'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(follower_id, following_id, edge_type)
);

CREATE INDEX idx_social_follower ON social_edges(follower_id, edge_type);
CREATE INDEX idx_social_following ON social_edges(following_id, edge_type);
```

### Token Events Table

```sql
CREATE TABLE token_events (
    id SERIAL PRIMARY KEY,
    token_address VARCHAR(42) NOT NULL,
    event_type VARCHAR(50) NOT NULL, -- 'launch', 'transfer', 'burn', 'mint'
    from_address VARCHAR(42),
    to_address VARCHAR(42),
    amount NUMERIC(78, 0),
    transaction_hash VARCHAR(66) NOT NULL,
    block_number BIGINT NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    metadata JSONB
);

CREATE INDEX idx_token_events_address ON token_events(token_address);
CREATE INDEX idx_token_events_type ON token_events(event_type);
CREATE INDEX idx_token_events_block ON token_events(block_number);
```

### User Token Roles Table

```sql
CREATE TABLE user_token_roles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    token_address VARCHAR(42) NOT NULL,
    role VARCHAR(20) NOT NULL, -- 'creator', 'holder', 'minter'
    balance NUMERIC(78, 0) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, token_address, role)
);

CREATE INDEX idx_user_tokens_user ON user_token_roles(user_id);
CREATE INDEX idx_user_tokens_token ON user_token_roles(token_address);
```

## API Endpoints

### Social Profile Endpoints

#### GET /api/social/profile/:address
Get user profile by wallet address.

**Response:**
```json
{
  "address": "0x...",
  "handle": "alice",
  "bio": "Building on LIRA",
  "avatar": "ipfs://...",
  "primaryToken": "0x...",
  "followingCount": 42,
  "followerCount": 123,
  "createdAt": "2026-01-15T..."
}
```

#### POST /api/social/profile
Create or update profile.

**Body:**
```json
{
  "handle": "alice",
  "bio": "Builder",
  "avatar": "ipfs://...",
  "metadata": {...}
}
```

#### POST /api/social/follow
Follow a user.

**Body:**
```json
{
  "targetAddress": "0x..."
}
```

#### GET /api/social/feed
Get social feed (following + global).

**Query Params:**
- `type`: "following" | "global" | "tokens"
- `page`: number
- `limit`: number

**Response:**
```json
{
  "posts": [...],
  "hasMore": true,
  "nextPage": 2
}
```

### Token Graph Endpoints

#### GET /api/tokens/by-user/:address
Get all tokens owned/created by user.

**Response:**
```json
{
  "created": [...],
  "holding": [...],
  "social": [...]
}
```

#### GET /api/tokens/by-project/:address
Get project tokens and their subtokens.

**Response:**
```json
{
  "token": {...},
  "subtokens": [...],
  "volume": "1234.56",
  "holders": 789
}
```

## Event Ingestion

### Contract Event Listeners

The backend services listen to on-chain events and sync to database:

**Profile Events:**
- `ProfileCreated`: Create user/profile in DB
- `ProfileUpdated`: Update profile metadata
- `HandleChanged`: Update handle mappings
- `PrimaryTokenLinked`: Update user token link

**Social Graph Events:**
- `Followed`: Create follow edge
- `Unfollowed`: Remove follow edge
- `Blocked`: Create block edge, remove follow edges
- `Muted`: Create mute edge

**Registry Events:**
- `TokenRegistered`: Create token record
- `TokenDeregistered`: Mark token inactive
- `TokenOwnershipTransferred`: Update token owner

### Ingestion Service

Located in `backend/go/services/ingestion/`:

```go
// Event listener that syncs blockchain to database
type EventIngester struct {
    client *ethclient.Client
    db     *sql.DB
}

func (e *EventIngester) Start() {
    // Subscribe to contract events
    // Parse and validate events
    // Write to database
    // Handle reorgs
}
```

## Frontend Integration

### Profile Pages

Route: `/u/[handle]`

**Components:**
- `ProfileHeader`: Avatar, handle, bio, stats
- `ProfileTokensGrid`: User's created and held tokens
- `ProfileActivityFeed`: Recent activity
- `FollowButton`: Follow/unfollow interaction

### Social Feed

Route: `/social`

**Components:**
- `SocialComposer`: Create posts
- `FeedList`: Display posts with engagement
- `FeedFilters`: Following/Global/Token feeds
- `TrendingTopics`: Popular topics/tokens

### Neo Design Integration

All LIRA SOCIAL components use the Neo design system:
- `NeoCard` for content containers
- `NeoButton` for interactions
- `NeoGlowBackground` for sections
- Consistent color palette and animations

## User Flows

### 1. Create Profile

1. Connect wallet
2. Choose unique handle
3. Upload avatar to IPFS
4. Set bio and links
5. Sign transaction to create on-chain profile
6. Profile immediately available at /u/[handle]

### 2. Follow Users

1. Navigate to user profile or social feed
2. Click "Follow" button
3. Sign transaction (gasless with meta-transactions)
4. Follow relationship recorded on-chain
5. See followed user's content in feed

### 3. Launch Social Token

1. Create profile first (if not exists)
2. Navigate to token launch page
3. Configure token parameters
4. Launch token (auto-registers in registry)
5. Token linked to profile
6. Available at /tokens/[address]

## Security Considerations

### On-Chain Security

- Handle uniqueness enforced by contract
- Only profile owner can update
- Follow/block/mute are user-controlled
- No admin override for social actions

### Privacy

- On-chain data is public by default
- Mutes are private (not visible on-chain)
- Metadata URIs can be encrypted
- Users control their data

### Spam Prevention

- Gas costs for creating profiles
- Rate limiting on backend APIs
- Token-gating for verified badges
- Community moderation tools

## Future Enhancements

### Phase 2 Features

- [ ] Private messages (encrypted)
- [ ] Group chats and communities
- [ ] Post reactions and comments
- [ ] Content moderation tools
- [ ] Reputation scoring

### Phase 3 Features

- [ ] Cross-chain profiles
- [ ] NFT profile pictures
- [ ] Token-gated content
- [ ] DAO integration
- [ ] Analytics dashboard

## References

- Smart Contracts: `/contracts/Lira*.sol`
- API Implementation: `/src/pages/api/social/`
- Frontend Components: `/src/components/social/`
- Database Migrations: `/database/migrations/`
- Tests: `/test/Lira*.test.js`
