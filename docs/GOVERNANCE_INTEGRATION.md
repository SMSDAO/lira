# LIRA Governance Integration Guide

## Overview

This document describes how LIRA token governance is wired into the protocol, making LIRA the canonical root token that controls all subtokens and protocol operations.

## Governance Hierarchy

```
LIRA Token (Root Governance)
    ↓
LiraTokenRegistry (Central Registry)
    ↓
Token Factories
    ├── TokenLaunchFactory (PROJECT tokens)
    └── LiraUserTokenFactory (USER/SOCIAL tokens)
        ├── LiraReputationToken (non-transferable)
        ├── LiraSocialToken (standard ERC20)
        └── LiraAccessToken (restricted transfers)
```

## Core Contracts

### LiraToken (Root Governance)

**Address:** See deployment info
**Role:** Canonical governance token for the entire ecosystem

**Governance Functions:**
- `setTreasury(address)` - Update treasury address (onlyOwner)
- `setProtocolFee(uint256)` - Update protocol fee (onlyOwner, max 5%)
- `setCreatorFee(uint256)` - Update creator fee (onlyOwner, max 10%)
- `setMinter(address, bool)` - Authorize minters (onlyOwner)
- `pause() / unpause()` - Emergency controls (onlyOwner)

**Supply:**
- Max Supply: 1,000,000,000 LIRA
- Initial Supply: 100,000,000 LIRA
- Minted to treasury on deployment

### LiraTokenRegistry (Central Registry)

**Address:** See deployment info
**Role:** Tracks all tokens in the LIRA ecosystem

**Governance Integration:**
```solidity
address public liraToken;              // Root governance token
address public tokenFactory;           // Main token factory
mapping(address => bool) public daoOperators;  // DAO operators
```

**Access Control:**

1. **onlyOwner** - Contract owner (deployer or multisig)
   - Set DAO operators
   - Update token factory
   - Deregister tokens

2. **onlyDAOOrOwner** - Owner or DAO operators
   - Currently used for future governance functions

3. **onlyFactoryOrDAO** - Factory, DAO operators, or owner
   - Register tokens
   - Manage token entries

**Key Functions:**
```solidity
// Governance
function setDAOOperator(address operator, bool status) external onlyOwner;
function setTokenFactory(address _tokenFactory) external onlyOwner;

// Token Registration (restricted)
function registerToken(
    address tokenAddress,
    address tokenOwner,
    TokenType tokenType
) external onlyFactoryOrDAO;
```

### TokenLaunchFactory

**Address:** See deployment info
**Role:** Launches PROJECT tokens with bonding curves

**Registry Integration:**
- Auto-registers all launched tokens as `TokenType.PROJECT`
- Authorized as registrar in LiraTokenRegistry
- Emits `TokenRegistered` event

**Usage:**
```solidity
// Launch a token - automatically registered
function launchToken(
    string memory name,
    string memory symbol,
    uint256 initialSupply
) external payable returns (address);
```

### LiraUserTokenFactory

**Address:** See deployment info
**Role:** Creates user-level tokens (reputation, social, access)

**LIRA Integration:**
- Requires 1000+ LIRA tokens OR DAO operator status
- Auto-registers tokens in registry with correct type
- Tracks all created tokens per user

**Token Types:**
1. **Reputation Tokens** (TokenType.USER)
   - Non-transferable
   - Only owner can mint/burn
   - For achievements and reputation

2. **Social Tokens** (TokenType.SOCIAL)
   - Standard ERC20
   - Transferable
   - Optional max supply

3. **Access Tokens** (TokenType.USER)
   - ERC20 with whitelist
   - Owner-controlled transfers
   - For gated access

**Usage:**
```solidity
// Requires 1000 LIRA or DAO status
function createReputationToken(...) external returns (address);
function createSocialToken(...) external returns (address);
function createAccessToken(...) external returns (address);
```

## Access Control Matrix

| Action | Owner | DAO Operator | Factory | LIRA Holder (1000+) | Regular User |
|--------|-------|--------------|---------|---------------------|--------------|
| Set DAO Operator | ✅ | ❌ | ❌ | ❌ | ❌ |
| Update Factory Address | ✅ | ❌ | ❌ | ❌ | ❌ |
| Authorize Registrar | ✅ | ❌ | ❌ | ❌ | ❌ |
| Register PROJECT Token | ✅ | ✅ | ✅ (auto) | ❌ | ❌ |
| Register USER/SOCIAL Token | ✅ | ✅ | ✅ (via factory) | ✅ (via factory) | ❌ |
| Deregister Token | ✅ | ❌ | ❌ | ❌ | ❌ |
| Launch PROJECT Token | N/A | N/A | Anyone (via factory) | Anyone (via factory) | Anyone (via factory) |
| Create User Tokens | ✅ | ✅ | N/A | ✅ (via factory) | ❌ |

## Deployment Process

### 1. Deploy LIRA Token
```bash
npx hardhat run scripts/deploy/00_LiraToken.js --network <network>
```
Sets: `LIRA_TOKEN_ADDRESS`

### 2. Deploy Token Registry
```bash
LIRA_TOKEN_ADDRESS=0x... npx hardhat run scripts/deploy/01_LiraTokenRegistry.js --network <network>
```
Sets: `REGISTRY_ADDRESS`

### 3. Deploy Social Contracts
```bash
npx hardhat run scripts/deploy/02_LiraSocial.js --network <network>
```

### 4. Deploy Factories
```bash
LIRA_TOKEN_ADDRESS=0x... REGISTRY_ADDRESS=0x... npx hardhat run scripts/deploy/03_Factories.js --network <network>
```

### Or Deploy All at Once
```bash
npx hardhat run scripts/deploy/deploy-all.js --network <network>
```

## Post-Deployment Configuration

### Set DAO Operators

```javascript
const registry = await ethers.getContractAt("LiraTokenRegistry", REGISTRY_ADDRESS);
await registry.setDAOOperator(DAO_ADDRESS, true);
```

### Set DAO Operators in User Factory

```javascript
const userFactory = await ethers.getContractAt("LiraUserTokenFactory", USER_FACTORY_ADDRESS);
await userFactory.setDAOOperator(DAO_ADDRESS, true);
```

### Adjust Minimum LIRA Requirement

```javascript
const userFactory = await ethers.getContractAt("LiraUserTokenFactory", USER_FACTORY_ADDRESS);
await userFactory.setMinLiraRequired(ethers.parseEther("500")); // 500 LIRA
```

### Transfer Ownership to Multisig (Production)

```javascript
// Transfer all contract ownership to multisig
const MULTISIG = "0x...";

await liraToken.transferOwnership(MULTISIG);
await registry.transferOwnership(MULTISIG);
await tokenFactory.transferOwnership(MULTISIG);
await userFactory.transferOwnership(MULTISIG);
```

## Usage Examples

### For Users

#### Launch a Project Token
```javascript
const factory = await ethers.getContractAt("TokenLaunchFactory", FACTORY_ADDRESS);
const tx = await factory.launchToken(
    "My Project",
    "PROJ",
    ethers.parseEther("1000000"),
    { value: ethers.parseEther("0.01") }
);
// Token automatically registered in registry
```

#### Create a Reputation Token
```javascript
// Must hold 1000+ LIRA
const userFactory = await ethers.getContractAt("LiraUserTokenFactory", USER_FACTORY_ADDRESS);
const tx = await userFactory.createReputationToken(
    "My Reputation",
    "REP",
    "ipfs://metadata"
);
```

### For DAO Operators

#### Register a Special Token
```javascript
// DAO operator can register tokens directly
const registry = await ethers.getContractAt("LiraTokenRegistry", REGISTRY_ADDRESS);
await registry.registerToken(
    tokenAddress,
    ownerAddress,
    1 // TokenType.USER
);
```

#### Create Tokens Without LIRA Requirement
```javascript
// DAO operator bypass LIRA requirement
const userFactory = await ethers.getContractAt("LiraUserTokenFactory", USER_FACTORY_ADDRESS);
await userFactory.createSocialToken(
    "DAO Token",
    "DAO",
    ethers.parseEther("1000000"),
    0,
    "ipfs://metadata"
);
```

## Security Considerations

### Access Control
- All governance functions are protected by `onlyOwner`
- DAO operators have limited privileges (registration only)
- Factory addresses are explicitly set and authorized
- Token registration requires authorization

### LIRA Holding Requirement
- User token creation requires 1000 LIRA minimum
- Prevents spam and ensures commitment
- Can be adjusted by owner
- DAO operators and owner exempt

### Token Registry
- Only authorized factories can register PROJECT tokens
- DAO operators can register USER/SOCIAL tokens
- Prevents unauthorized token registration
- Deregistration (soft delete) available for owner

## Future Enhancements

### DAO Transition
- Implement timelock for governance actions
- Add proposal and voting system
- Multi-sig treasury management
- Community-driven parameter changes

### Token Features
- Staking requirements for token creation
- Fee discounts for LIRA holders
- Reputation-based creation limits
- Token verification system

### Registry Features
- Token metadata standards
- Verification badges
- Token categories and tags
- Search and discovery features

## Support

For questions or issues:
- GitHub: https://github.com/SMSDAO/lira
- Discord: [Link TBD]
- Docs: https://docs.lira.ai

## References

- LiraToken.sol: Root governance token
- LiraTokenRegistry.sol: Central token registry
- TokenLaunchFactory.sol: PROJECT token factory
- LiraUserTokenFactory.sol: USER/SOCIAL token factory
- Test Suite: test/LiraTokenRegistry*.test.js
