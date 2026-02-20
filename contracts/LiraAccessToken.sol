// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title LiraAccessToken
 * @notice ERC20 access token with transfer restrictions for the LIRA ecosystem
 * @dev Transferable with owner-controlled whitelist for gated access
 * @dev Used for access control, memberships, and gated content
 */
contract LiraAccessToken is ERC20, Ownable {
    // Metadata
    string public metadataURI;
    address public creator;
    uint256 public createdAt;
    uint256 public maxSupply;
    
    // Transfer restrictions
    bool public transfersEnabled;
    mapping(address => bool) public whitelistedAddresses;
    
    // Events
    event AccessTokenMinted(address indexed to, uint256 amount);
    event AccessTokenBurned(address indexed from, uint256 amount);
    event MetadataUpdated(string newURI);
    event TransfersEnabled(bool enabled);
    event AddressWhitelisted(address indexed account, bool whitelisted);
    
    constructor(
        string memory name,
        string memory symbol,
        uint256 initialSupply,
        uint256 _maxSupply,
        address _creator,
        string memory _metadataURI,
        bool _transfersEnabled
    ) ERC20(name, symbol) Ownable(_creator) {
        require(_creator != address(0), "Invalid creator");
        require(_maxSupply == 0 || initialSupply <= _maxSupply, "Initial supply exceeds max");
        
        creator = _creator;
        metadataURI = _metadataURI;
        maxSupply = _maxSupply; // 0 means unlimited
        transfersEnabled = _transfersEnabled;
        createdAt = block.timestamp;
        
        // Creator is always whitelisted
        whitelistedAddresses[_creator] = true;
        
        if (initialSupply > 0) {
            _mint(_creator, initialSupply);
        }
    }
    
    /**
     * @dev Mint access tokens (only owner)
     * @param to The address to mint to
     * @param amount The amount to mint
     */
    function mint(address to, uint256 amount) external onlyOwner {
        require(to != address(0), "Cannot mint to zero address");
        if (maxSupply > 0) {
            require(totalSupply() + amount <= maxSupply, "Max supply exceeded");
        }
        _mint(to, amount);
        emit AccessTokenMinted(to, amount);
    }
    
    /**
     * @dev Burn tokens from an address (only owner)
     * @param from The address to burn from
     * @param amount The amount to burn
     */
    function burn(address from, uint256 amount) external onlyOwner {
        _burn(from, amount);
        emit AccessTokenBurned(from, amount);
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
     * @dev Enable or disable transfers (only owner)
     * @param enabled Whether transfers should be enabled
     */
    function setTransfersEnabled(bool enabled) external onlyOwner {
        transfersEnabled = enabled;
        emit TransfersEnabled(enabled);
    }
    
    /**
     * @dev Whitelist or unwhitelist an address (only owner)
     * @param account The address to whitelist/unwhitelist
     * @param whitelisted Whether the address should be whitelisted
     */
    function setWhitelisted(address account, bool whitelisted) external onlyOwner {
        require(account != address(0), "Invalid address");
        whitelistedAddresses[account] = whitelisted;
        emit AddressWhitelisted(account, whitelisted);
    }
    
    /**
     * @dev Whitelist multiple addresses at once (only owner)
     * @param accounts Array of addresses to whitelist
     * @param whitelisted Whether addresses should be whitelisted
     */
    function setWhitelistedBatch(address[] calldata accounts, bool whitelisted) external onlyOwner {
        for (uint256 i = 0; i < accounts.length; i++) {
            require(accounts[i] != address(0), "Invalid address");
            whitelistedAddresses[accounts[i]] = whitelisted;
            emit AddressWhitelisted(accounts[i], whitelisted);
        }
    }
    
    /**
     * @dev Override transfer to enforce restrictions
     */
    function transfer(address to, uint256 amount) public override returns (bool) {
        require(
            transfersEnabled || whitelistedAddresses[msg.sender] || whitelistedAddresses[to],
            "LiraAccessToken: transfers restricted"
        );
        return super.transfer(to, amount);
    }
    
    /**
     * @dev Override transferFrom to enforce restrictions
     */
    function transferFrom(address from, address to, uint256 amount) public override returns (bool) {
        require(
            transfersEnabled || whitelistedAddresses[from] || whitelistedAddresses[to],
            "LiraAccessToken: transfers restricted"
        );
        return super.transferFrom(from, to, amount);
    }
}
