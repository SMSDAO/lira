// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./LiraReputationToken.sol";
import "./LiraSocialToken.sol";
import "./LiraAccessToken.sol";

// Import the registry interface
interface ILiraTokenRegistry {
    enum TokenType {
        PROJECT,
        USER,
        SOCIAL
    }
    
    function registerToken(
        address tokenAddress,
        address tokenOwner,
        TokenType tokenType
    ) external;
}

/**
 * @title LiraUserTokenFactory
 * @notice Factory for creating user-level tokens in the LIRA ecosystem
 * @dev Requires caller to hold LIRA tokens or be a DAO operator
 * @dev Auto-registers created tokens in LiraTokenRegistry
 */
contract LiraUserTokenFactory is Ownable, ReentrancyGuard {
    // Core contracts
    IERC20 public immutable liraToken;
    ILiraTokenRegistry public immutable registry;
    
    // Minimum LIRA required to create tokens
    uint256 public minLiraRequired = 1000 * 10**18; // 1000 LIRA
    
    // DAO operators can create tokens without LIRA requirement
    mapping(address => bool) public daoOperators;
    
    // Tracking deployed tokens
    mapping(address => address[]) public creatorTokens;
    address[] public allDeployedTokens;
    
    // Events
    event ReputationTokenCreated(
        address indexed tokenAddress,
        address indexed creator,
        string name,
        string symbol
    );
    
    event SocialTokenCreated(
        address indexed tokenAddress,
        address indexed creator,
        string name,
        string symbol,
        uint256 initialSupply
    );
    
    event AccessTokenCreated(
        address indexed tokenAddress,
        address indexed creator,
        string name,
        string symbol,
        uint256 initialSupply
    );
    
    event MinLiraRequiredUpdated(uint256 newAmount);
    event DAOOperatorUpdated(address indexed operator, bool status);
    
    constructor(
        address _liraToken,
        address _registry
    ) Ownable(msg.sender) {
        require(_liraToken != address(0), "Invalid LIRA token");
        require(_registry != address(0), "Invalid registry");
        
        liraToken = IERC20(_liraToken);
        registry = ILiraTokenRegistry(_registry);
    }
    
    /**
     * @dev Check if caller can create tokens
     */
    modifier canCreateToken() {
        require(
            liraToken.balanceOf(msg.sender) >= minLiraRequired || daoOperators[msg.sender] || msg.sender == owner(),
            "LiraUserTokenFactory: insufficient LIRA or not authorized"
        );
        _;
    }
    
    /**
     * @notice Create a reputation token (non-transferable)
     * @param name Token name
     * @param symbol Token symbol
     * @param metadataURI URI for token metadata
     * @return address The deployed token address
     */
    function createReputationToken(
        string memory name,
        string memory symbol,
        string memory metadataURI
    ) external nonReentrant canCreateToken returns (address) {
        // Deploy reputation token
        LiraReputationToken token = new LiraReputationToken(
            name,
            symbol,
            msg.sender,
            metadataURI
        );
        
        address tokenAddress = address(token);
        
        // Register in LIRA registry as USER type
        registry.registerToken(
            tokenAddress,
            msg.sender,
            ILiraTokenRegistry.TokenType.USER
        );
        
        // Track deployment
        creatorTokens[msg.sender].push(tokenAddress);
        allDeployedTokens.push(tokenAddress);
        
        emit ReputationTokenCreated(tokenAddress, msg.sender, name, symbol);
        
        return tokenAddress;
    }
    
    /**
     * @notice Create a social token (transferable ERC20)
     * @param name Token name
     * @param symbol Token symbol
     * @param initialSupply Initial supply to mint to creator
     * @param maxSupply Maximum supply (0 for unlimited)
     * @param metadataURI URI for token metadata
     * @return address The deployed token address
     */
    function createSocialToken(
        string memory name,
        string memory symbol,
        uint256 initialSupply,
        uint256 maxSupply,
        string memory metadataURI
    ) external nonReentrant canCreateToken returns (address) {
        // Deploy social token
        LiraSocialToken token = new LiraSocialToken(
            name,
            symbol,
            initialSupply,
            maxSupply,
            msg.sender,
            metadataURI
        );
        
        address tokenAddress = address(token);
        
        // Register in LIRA registry as SOCIAL type
        registry.registerToken(
            tokenAddress,
            msg.sender,
            ILiraTokenRegistry.TokenType.SOCIAL
        );
        
        // Track deployment
        creatorTokens[msg.sender].push(tokenAddress);
        allDeployedTokens.push(tokenAddress);
        
        emit SocialTokenCreated(tokenAddress, msg.sender, name, symbol, initialSupply);
        
        return tokenAddress;
    }
    
    /**
     * @notice Create an access token (transferable with restrictions)
     * @param name Token name
     * @param symbol Token symbol
     * @param initialSupply Initial supply to mint to creator
     * @param maxSupply Maximum supply (0 for unlimited)
     * @param metadataURI URI for token metadata
     * @param transfersEnabled Whether transfers are initially enabled
     * @return address The deployed token address
     */
    function createAccessToken(
        string memory name,
        string memory symbol,
        uint256 initialSupply,
        uint256 maxSupply,
        string memory metadataURI,
        bool transfersEnabled
    ) external nonReentrant canCreateToken returns (address) {
        // Deploy access token
        LiraAccessToken token = new LiraAccessToken(
            name,
            symbol,
            initialSupply,
            maxSupply,
            msg.sender,
            metadataURI,
            transfersEnabled
        );
        
        address tokenAddress = address(token);
        
        // Register in LIRA registry as USER type
        registry.registerToken(
            tokenAddress,
            msg.sender,
            ILiraTokenRegistry.TokenType.USER
        );
        
        // Track deployment
        creatorTokens[msg.sender].push(tokenAddress);
        allDeployedTokens.push(tokenAddress);
        
        emit AccessTokenCreated(tokenAddress, msg.sender, name, symbol, initialSupply);
        
        return tokenAddress;
    }
    
    /**
     * @notice Get all tokens created by an address
     * @param creator The creator address
     * @return address[] Array of token addresses
     */
    function getCreatorTokens(address creator) external view returns (address[] memory) {
        return creatorTokens[creator];
    }
    
    /**
     * @notice Get total number of deployed tokens
     * @return uint256 Total count
     */
    function getTotalDeployedTokens() external view returns (uint256) {
        return allDeployedTokens.length;
    }
    
    /**
     * @notice Get deployed token at index
     * @param index The index
     * @return address The token address
     */
    function getDeployedTokenAt(uint256 index) external view returns (address) {
        require(index < allDeployedTokens.length, "Index out of bounds");
        return allDeployedTokens[index];
    }
    
    /**
     * @notice Set minimum LIRA required (only owner)
     * @param _minLiraRequired New minimum amount
     */
    function setMinLiraRequired(uint256 _minLiraRequired) external onlyOwner {
        minLiraRequired = _minLiraRequired;
        emit MinLiraRequiredUpdated(_minLiraRequired);
    }
    
    /**
     * @notice Set or remove a DAO operator (only owner)
     * @param operator The operator address
     * @param status Whether to grant or revoke DAO operator status
     */
    function setDAOOperator(address operator, bool status) external onlyOwner {
        require(operator != address(0), "Invalid address");
        daoOperators[operator] = status;
        emit DAOOperatorUpdated(operator, status);
    }
}
