// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title LiraSocialToken
 * @notice Standard ERC20 social token for the LIRA ecosystem
 * @dev Transferable social token with owner controls for minting
 * @dev Used for community engagement and social interactions
 */
contract LiraSocialToken is ERC20, Ownable {
    // Metadata
    string public metadataURI;
    address public creator;
    uint256 public createdAt;
    uint256 public maxSupply;
    
    // Events
    event SocialTokenMinted(address indexed to, uint256 amount);
    event SocialTokenBurned(address indexed from, uint256 amount);
    event MetadataUpdated(string newURI);
    event MaxSupplyUpdated(uint256 newMaxSupply);
    
    constructor(
        string memory name,
        string memory symbol,
        uint256 initialSupply,
        uint256 _maxSupply,
        address _creator,
        string memory _metadataURI
    ) ERC20(name, symbol) Ownable(_creator) {
        require(_creator != address(0), "Invalid creator");
        require(_maxSupply == 0 || initialSupply <= _maxSupply, "Initial supply exceeds max");
        
        creator = _creator;
        metadataURI = _metadataURI;
        maxSupply = _maxSupply; // 0 means unlimited
        createdAt = block.timestamp;
        
        if (initialSupply > 0) {
            _mint(_creator, initialSupply);
        }
    }
    
    /**
     * @dev Mint social tokens (only owner)
     * @param to The address to mint to
     * @param amount The amount to mint
     */
    function mint(address to, uint256 amount) external onlyOwner {
        require(to != address(0), "Cannot mint to zero address");
        if (maxSupply > 0) {
            require(totalSupply() + amount <= maxSupply, "Max supply exceeded");
        }
        _mint(to, amount);
        emit SocialTokenMinted(to, amount);
    }
    
    /**
     * @dev Burn tokens from caller's balance
     * @param amount The amount to burn
     */
    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
        emit SocialTokenBurned(msg.sender, amount);
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
     * @dev Update max supply (only owner, can only increase or set to unlimited)
     * @param _maxSupply New max supply (0 for unlimited)
     */
    function setMaxSupply(uint256 _maxSupply) external onlyOwner {
        require(_maxSupply == 0 || _maxSupply >= totalSupply(), "Max supply below current supply");
        if (maxSupply > 0) {
            require(_maxSupply == 0 || _maxSupply >= maxSupply, "Cannot decrease max supply");
        }
        maxSupply = _maxSupply;
        emit MaxSupplyUpdated(_maxSupply);
    }
}
