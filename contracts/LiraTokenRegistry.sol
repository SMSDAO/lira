// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

/**
 * @title LiraTokenRegistry
 * @notice Central registry for all tokens launched under the LIRA ecosystem
 * @dev Tracks subtokens, user tokens, and social tokens with proper access control
 */
contract LiraTokenRegistry is Ownable {
    using EnumerableSet for EnumerableSet.AddressSet;

    enum TokenType {
        PROJECT,    // Project/protocol tokens
        USER,       // User reputation/social tokens
        SOCIAL      // Community/social tokens
    }

    struct TokenInfo {
        address tokenAddress;
        address owner;
        TokenType tokenType;
        uint256 registeredAt;
        bool isActive;
    }

    // Main registry mapping
    mapping(address => TokenInfo) public tokenRegistry;
    
    // Owner to tokens mapping
    mapping(address => EnumerableSet.AddressSet) private ownerTokens;
    
    // Type to tokens mapping
    mapping(TokenType => EnumerableSet.AddressSet) private typeTokens;
    
    // All registered tokens
    EnumerableSet.AddressSet private allTokens;
    
    // Authorized registrars (e.g., TokenLaunchFactory)
    mapping(address => bool) public authorizedRegistrars;

    // Events
    event TokenRegistered(
        address indexed tokenAddress,
        address indexed owner,
        TokenType tokenType,
        uint256 timestamp
    );
    
    event TokenDeregistered(
        address indexed tokenAddress,
        uint256 timestamp
    );
    
    event RegistrarAuthorized(address indexed registrar, bool authorized);
    
    event TokenOwnershipTransferred(
        address indexed tokenAddress,
        address indexed previousOwner,
        address indexed newOwner
    );

    /**
     * @dev Modifier to restrict functions to authorized registrars or owner
     */
    modifier onlyAuthorized() {
        require(
            authorizedRegistrars[msg.sender] || msg.sender == owner(),
            "LiraTokenRegistry: unauthorized"
        );
        _;
    }

    constructor() Ownable(msg.sender) {}

    /**
     * @notice Register a new token in the LIRA ecosystem
     * @param tokenAddress The address of the token contract
     * @param tokenOwner The owner of the token
     * @param tokenType The type of token (PROJECT, USER, or SOCIAL)
     */
    function registerToken(
        address tokenAddress,
        address tokenOwner,
        TokenType tokenType
    ) external onlyAuthorized {
        require(tokenAddress != address(0), "LiraTokenRegistry: zero address");
        require(tokenOwner != address(0), "LiraTokenRegistry: zero owner");
        require(!allTokens.contains(tokenAddress), "LiraTokenRegistry: already registered");

        TokenInfo memory info = TokenInfo({
            tokenAddress: tokenAddress,
            owner: tokenOwner,
            tokenType: tokenType,
            registeredAt: block.timestamp,
            isActive: true
        });

        tokenRegistry[tokenAddress] = info;
        allTokens.add(tokenAddress);
        ownerTokens[tokenOwner].add(tokenAddress);
        typeTokens[tokenType].add(tokenAddress);

        emit TokenRegistered(tokenAddress, tokenOwner, tokenType, block.timestamp);
    }

    /**
     * @notice Deregister a token (mark as inactive)
     * @param tokenAddress The address of the token to deregister
     */
    function deregisterToken(address tokenAddress) external onlyOwner {
        require(allTokens.contains(tokenAddress), "LiraTokenRegistry: not registered");
        
        TokenInfo storage info = tokenRegistry[tokenAddress];
        info.isActive = false;

        emit TokenDeregistered(tokenAddress, block.timestamp);
    }

    /**
     * @notice Transfer token ownership in the registry
     * @param tokenAddress The token address
     * @param newOwner The new owner address
     */
    function transferTokenOwnership(
        address tokenAddress,
        address newOwner
    ) external {
        require(allTokens.contains(tokenAddress), "LiraTokenRegistry: not registered");
        TokenInfo storage info = tokenRegistry[tokenAddress];
        require(msg.sender == info.owner, "LiraTokenRegistry: not token owner");
        require(newOwner != address(0), "LiraTokenRegistry: zero address");

        address previousOwner = info.owner;
        
        // Update mappings
        ownerTokens[previousOwner].remove(tokenAddress);
        ownerTokens[newOwner].add(tokenAddress);
        info.owner = newOwner;

        emit TokenOwnershipTransferred(tokenAddress, previousOwner, newOwner);
    }

    /**
     * @notice Authorize or deauthorize a registrar
     * @param registrar The registrar address
     * @param authorized Whether to authorize or deauthorize
     */
    function setAuthorizedRegistrar(address registrar, bool authorized) external onlyOwner {
        require(registrar != address(0), "LiraTokenRegistry: zero address");
        authorizedRegistrars[registrar] = authorized;
        emit RegistrarAuthorized(registrar, authorized);
    }

    /**
     * @notice Check if a token is registered as a LIRA subtoken
     * @param tokenAddress The token address to check
     * @return bool True if registered and active
     */
    function isLiraSubtoken(address tokenAddress) external view returns (bool) {
        return allTokens.contains(tokenAddress) && tokenRegistry[tokenAddress].isActive;
    }

    /**
     * @notice Get all tokens owned by an address
     * @param owner The owner address
     * @return address[] Array of token addresses
     */
    function getSubtokensByOwner(address owner) external view returns (address[] memory) {
        uint256 length = ownerTokens[owner].length();
        address[] memory tokens = new address[](length);
        for (uint256 i = 0; i < length; i++) {
            tokens[i] = ownerTokens[owner].at(i);
        }
        return tokens;
    }

    /**
     * @notice Get all tokens of a specific type
     * @param tokenType The type to query
     * @return address[] Array of token addresses
     */
    function getTokensByType(TokenType tokenType) external view returns (address[] memory) {
        uint256 length = typeTokens[tokenType].length();
        address[] memory tokens = new address[](length);
        for (uint256 i = 0; i < length; i++) {
            tokens[i] = typeTokens[tokenType].at(i);
        }
        return tokens;
    }

    /**
     * @notice Get token information
     * @param tokenAddress The token address
     * @return TokenInfo The token information struct
     */
    function getTokenInfo(address tokenAddress) external view returns (TokenInfo memory) {
        require(allTokens.contains(tokenAddress), "LiraTokenRegistry: not registered");
        return tokenRegistry[tokenAddress];
    }

    /**
     * @notice Get total number of registered tokens
     * @return uint256 The total count
     */
    function getTotalTokens() external view returns (uint256) {
        return allTokens.length();
    }

    /**
     * @notice Get token at index (for iteration)
     * @param index The index
     * @return address The token address
     */
    function getTokenAt(uint256 index) external view returns (address) {
        require(index < allTokens.length(), "LiraTokenRegistry: index out of bounds");
        return allTokens.at(index);
    }
}
