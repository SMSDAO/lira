-- LIRA Protocol Database Schema
-- Version: 1.0
-- Description: Complete schema for LIRA SOCIAL and token ecosystem

-- ====================
-- Users & Profiles
-- ====================

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    wallet_address VARCHAR(42) UNIQUE NOT NULL,
    handle VARCHAR(32) UNIQUE,
    email VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    role VARCHAR(20) DEFAULT 'user',
    is_verified BOOLEAN DEFAULT FALSE,
    last_login TIMESTAMP
);

CREATE INDEX idx_users_wallet ON users(wallet_address);
CREATE INDEX idx_users_handle ON users(handle);
CREATE INDEX idx_users_role ON users(role);

CREATE TABLE IF NOT EXISTS profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    bio TEXT,
    avatar_url VARCHAR(500),
    banner_url VARCHAR(500),
    website VARCHAR(500),
    twitter VARCHAR(100),
    discord VARCHAR(100),
    telegram VARCHAR(100),
    metadata_uri VARCHAR(500),
    primary_token_address VARCHAR(42),
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_profiles_user ON profiles(user_id);
CREATE INDEX idx_profiles_token ON profiles(primary_token_address);

-- ====================
-- Social Graph
-- ====================

CREATE TABLE IF NOT EXISTS social_edges (
    id SERIAL PRIMARY KEY,
    follower_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    following_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    edge_type VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(follower_id, following_id, edge_type),
    CHECK (follower_id != following_id)
);

CREATE INDEX idx_social_follower ON social_edges(follower_id, edge_type);
CREATE INDEX idx_social_following ON social_edges(following_id, edge_type);

-- ====================
-- Tokens
-- ====================

CREATE TABLE IF NOT EXISTS tokens (
    id SERIAL PRIMARY KEY,
    contract_address VARCHAR(42) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    symbol VARCHAR(50) NOT NULL,
    decimals INTEGER DEFAULT 18,
    total_supply NUMERIC(78, 0),
    token_type VARCHAR(20),
    creator_address VARCHAR(42) NOT NULL,
    owner_address VARCHAR(42) NOT NULL,
    registry_id INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    launched_at TIMESTAMP,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tokens_contract ON tokens(contract_address);
CREATE INDEX idx_tokens_creator ON tokens(creator_address);
CREATE INDEX idx_tokens_owner ON tokens(owner_address);
CREATE INDEX idx_tokens_type ON tokens(token_type);

-- ====================
-- Token Events
-- ====================

CREATE TABLE IF NOT EXISTS token_events (
    id SERIAL PRIMARY KEY,
    token_address VARCHAR(42) NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    from_address VARCHAR(42),
    to_address VARCHAR(42),
    amount NUMERIC(78, 0),
    transaction_hash VARCHAR(66) NOT NULL,
    block_number BIGINT NOT NULL,
    log_index INTEGER,
    timestamp TIMESTAMP NOT NULL,
    metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_token_events_address ON token_events(token_address);
CREATE INDEX idx_token_events_type ON token_events(event_type);
CREATE INDEX idx_token_events_block ON token_events(block_number);
CREATE INDEX idx_token_events_tx ON token_events(transaction_hash);
CREATE INDEX idx_token_events_timestamp ON token_events(timestamp DESC);

-- ====================
-- Token Statistics
-- ====================

CREATE TABLE IF NOT EXISTS token_stats (
    id SERIAL PRIMARY KEY,
    token_address VARCHAR(42) UNIQUE NOT NULL,
    holder_count INTEGER DEFAULT 0,
    total_volume NUMERIC(78, 0) DEFAULT 0,
    total_transactions INTEGER DEFAULT 0,
    market_cap NUMERIC(20, 8),
    price_usd NUMERIC(20, 8),
    liquidity_usd NUMERIC(20, 8),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_token_stats_address ON token_stats(token_address);
CREATE INDEX idx_token_stats_volume ON token_stats(total_volume DESC);
CREATE INDEX idx_token_stats_holders ON token_stats(holder_count DESC);

-- ====================
-- User Token Roles
-- ====================

CREATE TABLE IF NOT EXISTS user_token_roles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    token_address VARCHAR(42) NOT NULL,
    role VARCHAR(20) NOT NULL,
    balance NUMERIC(78, 0) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, token_address, role)
);

CREATE INDEX idx_user_tokens_user ON user_token_roles(user_id);
CREATE INDEX idx_user_tokens_token ON user_token_roles(token_address);
CREATE INDEX idx_user_tokens_role ON user_token_roles(role);
