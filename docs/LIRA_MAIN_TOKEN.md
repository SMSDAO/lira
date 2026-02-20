# LIRA Main Token – Monetary + Governance Policy

## Overview

LIRA is the canonical governance and utility token for the entire LIRA ecosystem. It serves as the root token that controls all subtokens, provides governance rights, and enables protocol-wide operations.

## Token Specifications

### Contract: LiraToken.sol

**Token Details:**
- **Name:** LIRA Protocol Token
- **Symbol:** LIRA
- **Standard:** ERC20 with Governance Extensions
- **Total Supply:** 1,000,000,000 (1 billion) tokens
- **Initial Supply:** 100,000,000 (100 million) tokens
- **Decimals:** 18

### Supply Management

**Fixed Supply Rules:**
- Maximum supply is capped at 1 billion LIRA tokens
- Initial 100 million tokens minted to deployer/treasury
- Additional minting requires authorized minter role
- No token burning mechanism (permanent supply)

**Minting Control:**
- Only authorized minters can create new tokens
- Minters are managed by contract owner (DAO)
- Total supply cannot exceed max supply cap
- All minting events are tracked on-chain

### Governance Hooks

**Role Management:**
- **Owner:** Full protocol control, can pause contracts, manage fees
- **Minters:** Authorized to mint new tokens within cap
- **Registry Admin:** Can authorize token registrars

**Governance Functions:**
- Treasury address management
- Fee collector configuration
- Protocol fee adjustment (1% default)
- Creator fee adjustment (2% default)
- Emergency pause functionality

### Fee Structure

**Protocol Fees:**
- 1% protocol fee on token launches
- 2% creator fee on token launches
- Fees collected in ETH and sent to fee collector
- Fee rates adjustable by owner/DAO

## Ecosystem Position

### Root Governance Token

LIRA is the **root governance token** for the ecosystem with the following powers:

1. **Registry Control:** LIRA holders/DAO control the LiraTokenRegistry
2. **Subtoken Management:** All launched tokens are registered under LIRA
3. **Protocol Parameters:** Fee rates, launch costs, and system settings
4. **Social Layer:** Control over profile verification and social features
5. **Treasury Management:** Control over protocol treasury and revenue

### Integration with Subtokens

All tokens launched through the protocol are registered in the LiraTokenRegistry and considered "subtokens" under the LIRA ecosystem:

- Project tokens (launched via TokenLaunchFactory)
- User reputation tokens
- Community/social tokens
- Agent-specific tokens

## Security

### Access Control

The contract uses OpenZeppelin's battle-tested access control:
- `Ownable`: Single owner with admin privileges
- Role-based permissions for minting
- Multi-sig recommended for owner address in production

### Safety Features

- **Pausable:** Emergency pause stops all transfers
- **Reentrancy Guard:** Prevents reentrancy attacks
- **Max Supply Cap:** Hard limit prevents infinite inflation
- **Fee Limits:** Reasonable fee caps prevent exploitation

### Audit Status

- Contracts built with OpenZeppelin standards
- Automated security testing via Slither
- Full test coverage with property-based tests
- External audit recommended before mainnet deployment

## Deployment

### Mainnet Deployments

**BASE Mainnet:**
- Contract Address: TBD
- Chain ID: 8453
- Launch Date: TBD

**Monad Mainnet:**
- Contract Address: TBD
- Chain ID: TBD
- Launch Date: TBD

### Verification

All contracts will be verified on:
- BaseScan (for BASE)
- Monad Explorer (for Monad)

## Tokenomics

### Distribution

- **100M (10%):** Initial treasury allocation
- **200M (20%):** Team & advisors (4-year vesting)
- **300M (30%):** Community incentives & rewards
- **200M (20%):** Liquidity mining & staking
- **200M (20%):** Protocol development fund

### Utility

1. **Governance:** Vote on protocol parameters
2. **Staking:** Earn rewards by staking LIRA
3. **Fee Discounts:** Reduced launch fees for LIRA holders
4. **Access:** Premium features and early access
5. **Rewards:** Earn LIRA through protocol participation

## Integration Guide

### For Developers

```solidity
// Import LIRA token interface
import "./LiraToken.sol";

// Check user LIRA balance
uint256 balance = liraToken.balanceOf(userAddress);

// Require minimum LIRA holdings
require(balance >= minLiraRequired, "Insufficient LIRA");
```

### For DApps

```javascript
// Web3 integration
const liraToken = new ethers.Contract(LIRA_ADDRESS, LIRA_ABI, signer);

// Check balance
const balance = await liraToken.balanceOf(address);

// Check if address is minter
const isMinter = await liraToken.isMinter(address);
```

## Governance Roadmap

### Phase 1: Foundation (Current)
- Single owner contract deployment
- Basic minting and fee management
- Registry integration

### Phase 2: DAO Transition (Q2 2026)
- Transition to DAO governance
- Token holder voting
- Proposal system
- Timelock for critical changes

### Phase 3: Full Decentralization (Q3 2026)
- Multi-sig treasury
- Community-driven development
- Autonomous protocol operations
- Cross-chain governance

## References

- OpenZeppelin ERC20: https://docs.openzeppelin.com/contracts/4.x/erc20
- Contract Source: `/contracts/LiraToken.sol`
- Registry Contract: `/contracts/LiraTokenRegistry.sol`
- Test Suite: `/test/Lira.test.js`
