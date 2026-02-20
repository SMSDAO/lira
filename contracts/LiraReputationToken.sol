// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title LiraReputationToken
 * @notice Non-transferable reputation token for the LIRA ecosystem
 * @dev Tokens cannot be transferred between addresses, only minted/burned by owner
 * @dev Used for on-chain reputation and achievement tracking
 */
contract LiraReputationToken is ERC20, Ownable {
    // Metadata
    string public metadataURI;
    address public creator;
    uint256 public createdAt;
    
    // Events
    event ReputationMinted(address indexed to, uint256 amount);
    event ReputationBurned(address indexed from, uint256 amount);
    event MetadataUpdated(string newURI);
    
    constructor(
        string memory name,
        string memory symbol,
        address _creator,
        string memory _metadataURI
    ) ERC20(name, symbol) Ownable(_creator) {
        require(_creator != address(0), "Invalid creator");
        creator = _creator;
        metadataURI = _metadataURI;
        createdAt = block.timestamp;
    }
    
    /**
     * @dev Mint reputation tokens (only owner)
     * @param to The address to mint to
     * @param amount The amount to mint
     */
    function mint(address to, uint256 amount) external onlyOwner {
        require(to != address(0), "Cannot mint to zero address");
        _mint(to, amount);
        emit ReputationMinted(to, amount);
    }
    
    /**
     * @dev Burn reputation tokens from an address (only owner)
     * @param from The address to burn from
     * @param amount The amount to burn
     */
    function burn(address from, uint256 amount) external onlyOwner {
        _burn(from, amount);
        emit ReputationBurned(from, amount);
    }
    
    /**
     * @dev Update metadata URI (only owner)
     * @param _metadataURI New metadata URI
     */
    function setMetadataURI(string memory _metadataURI) external onlyOwner {
        metadataURI = _metadataURI;
        emit MetadataUpdated(_metadataURI);
    }
    
    /**
     * @dev Override transfer to make non-transferable
     * @notice Reputation tokens cannot be transferred, only minted/burned
     */
    function transfer(address, uint256) public pure override returns (bool) {
        revert("LiraReputationToken: non-transferable");
    }
    
    /**
     * @dev Override transferFrom to make non-transferable
     * @notice Reputation tokens cannot be transferred, only minted/burned
     */
    function transferFrom(address, address, uint256) public pure override returns (bool) {
        revert("LiraReputationToken: non-transferable");
    }
    
    /**
     * @dev Override approve to prevent approvals since tokens are non-transferable
     */
    function approve(address, uint256) public pure override returns (bool) {
        revert("LiraReputationToken: non-transferable");
    }
}
