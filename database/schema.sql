-- Lira Protocol Database Schema
-- PostgreSQL 14+

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    address VARCHAR(42) UNIQUE NOT NULL,
    username VARCHAR(50),
    email VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    is_admin BOOLEAN DEFAULT FALSE
);

-- Tokens table
CREATE TABLE IF NOT EXISTS tokens (
    id SERIAL PRIMARY KEY,
    contract_address VARCHAR(42) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    symbol VARCHAR(20) NOT NULL,
    creator_id INTEGER REFERENCES users(id),
    initial_supply NUMERIC(78, 0) NOT NULL,
    current_supply NUMERIC(78, 0) NOT NULL,
    launch_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    liquidity_raised NUMERIC(78, 0) DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    network VARCHAR(20) DEFAULT 'base',
    metadata JSONB
);

-- Agents table
CREATE TABLE IF NOT EXISTS agents (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    model_type VARCHAR(50) NOT NULL,
    model_hash VARCHAR(66),
    owner_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    execution_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    config JSONB
);

-- Agent executions table
CREATE TABLE IF NOT EXISTS agent_executions (
    id SERIAL PRIMARY KEY,
    agent_id INTEGER REFERENCES agents(id),
    executor_id INTEGER REFERENCES users(id),
    input_hash VARCHAR(66),
    output_hash VARCHAR(66),
    gas_used BIGINT,
    success BOOLEAN DEFAULT TRUE,
    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    execution_time_ms INTEGER,
    metadata JSONB
);

-- Models table
CREATE TABLE IF NOT EXISTS models (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL,
    version VARCHAR(20) NOT NULL,
    description TEXT,
    owner_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_public BOOLEAN DEFAULT FALSE,
    config JSONB
);

-- Token launches tracking
CREATE TABLE IF NOT EXISTS token_launches (
    id SERIAL PRIMARY KEY,
    token_id INTEGER REFERENCES tokens(id),
    creator_id INTEGER REFERENCES users(id),
    launch_fee NUMERIC(78, 0),
    protocol_fee NUMERIC(78, 0),
    status VARCHAR(20) DEFAULT 'pending',
    launched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB
);

-- Social timeline posts (Zora-like)
CREATE TABLE IF NOT EXISTS timeline_posts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    content TEXT NOT NULL,
    media_url VARCHAR(500),
    token_id INTEGER REFERENCES tokens(id),
    agent_id INTEGER REFERENCES agents(id),
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_visible BOOLEAN DEFAULT TRUE
);

-- Social interactions (likes, comments)
CREATE TABLE IF NOT EXISTS social_interactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    post_id INTEGER REFERENCES timeline_posts(id),
    interaction_type VARCHAR(20) NOT NULL,
    content TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Smart wallets
CREATE TABLE IF NOT EXISTS smart_wallets (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    wallet_address VARCHAR(42) UNIQUE NOT NULL,
    wallet_type VARCHAR(50) DEFAULT 'erc4337',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    config JSONB
);

-- Fee settings
CREATE TABLE IF NOT EXISTS fee_settings (
    id SERIAL PRIMARY KEY,
    protocol_fee_percent NUMERIC(5, 2) DEFAULT 1.00,
    creator_fee_percent NUMERIC(5, 2) DEFAULT 2.00,
    launch_fee_eth NUMERIC(78, 18) DEFAULT 0.01,
    agent_creation_fee_eth NUMERIC(78, 18) DEFAULT 0.001,
    agent_execution_fee_eth NUMERIC(78, 18) DEFAULT 0.0001,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by INTEGER REFERENCES users(id)
);

-- Billing and revenue tracking
CREATE TABLE IF NOT EXISTS billing_records (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    transaction_type VARCHAR(50) NOT NULL,
    amount NUMERIC(78, 18) NOT NULL,
    currency VARCHAR(10) DEFAULT 'ETH',
    tx_hash VARCHAR(66),
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB
);

-- Quantum oracle jobs
CREATE TABLE IF NOT EXISTS quantum_jobs (
    id SERIAL PRIMARY KEY,
    job_type VARCHAR(50) NOT NULL,
    input_data JSONB,
    output_data JSONB,
    status VARCHAR(20) DEFAULT 'queued',
    qubits_used INTEGER,
    execution_time_ms INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    created_by INTEGER REFERENCES users(id)
);

-- Indexes
CREATE INDEX idx_users_address ON users(address);
CREATE INDEX idx_tokens_creator ON tokens(creator_id);
CREATE INDEX idx_tokens_network ON tokens(network);
CREATE INDEX idx_agents_owner ON agents(owner_id);
CREATE INDEX idx_agent_executions_agent ON agent_executions(agent_id);
CREATE INDEX idx_timeline_posts_user ON timeline_posts(user_id);
CREATE INDEX idx_social_interactions_post ON social_interactions(post_id);
CREATE INDEX idx_billing_records_user ON billing_records(user_id);
CREATE INDEX idx_quantum_jobs_status ON quantum_jobs(status);

-- Insert default fee settings
INSERT INTO fee_settings (protocol_fee_percent, creator_fee_percent, launch_fee_eth)
VALUES (1.00, 2.00, 0.01)
ON CONFLICT DO NOTHING;
