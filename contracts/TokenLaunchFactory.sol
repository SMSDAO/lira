// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

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
 * @title TokenLaunchFactory
 * @dev Automatic token launch factory with Zora-inspired bonding curve
 * @notice Allows users to launch tokens automatically with built-in liquidity
 * @notice Integrates with LiraTokenRegistry to auto-register all launched tokens
 */
contract TokenLaunchFactory is Ownable, ReentrancyGuard {
    struct TokenLaunch {
        address tokenAddress;
        address creator;
        string name;
        string symbol;
        uint256 initialSupply;
        uint256 launchTimestamp;
        uint256 liquidityRaised;
        bool isActive;
    }
    
    // Protocol settings
    uint256 public launchFee = 0.01 ether;
    uint256 public protocolFeePercent = 100; // 1% in basis points
    address public feeCollector;
    address public liraToken;
    ILiraTokenRegistry public registry;
    
    // Token launches tracking
    TokenLaunch[] public launches;
    mapping(address => uint256[]) public creatorLaunches;
    mapping(address => bool) public isLaunchedToken;
    
    // Events
    event TokenLaunched(
        address indexed tokenAddress,
        address indexed creator,
        string name,
        string symbol,
        uint256 initialSupply,
        uint256 timestamp
    );
    event LaunchFeeUpdated(uint256 newFee);
    event ProtocolFeeUpdated(uint256 newFeePercent);
    event TokenRegistered(address indexed tokenAddress, address indexed creator);
    
    constructor(
        address _liraToken,
        address _feeCollector,
        address _registry
    ) Ownable(msg.sender) {
        require(_liraToken != address(0), "Invalid LIRA token");
        require(_feeCollector != address(0), "Invalid fee collector");
        require(_registry != address(0), "Invalid registry");
        
        liraToken = _liraToken;
        feeCollector = _feeCollector;
        registry = ILiraTokenRegistry(_registry);
    }
    
    /**
     * @dev Launch a new token with automatic liquidity setup
     */
    function launchToken(
        string memory name,
        string memory symbol,
        uint256 initialSupply
    ) external payable nonReentrant returns (address) {
        require(msg.value >= launchFee, "Insufficient launch fee");
        require(bytes(name).length > 0, "Name required");
        require(bytes(symbol).length > 0, "Symbol required");
        require(initialSupply > 0, "Supply must be positive");
        
        // Deploy new token
        LaunchedToken newToken = new LaunchedToken(
            name,
            symbol,
            initialSupply,
            msg.sender,
            address(this)
        );
        
        address tokenAddress = address(newToken);
        
        // Create launch record
        TokenLaunch memory launch = TokenLaunch({
            tokenAddress: tokenAddress,
            creator: msg.sender,
            name: name,
            symbol: symbol,
            initialSupply: initialSupply,
            launchTimestamp: block.timestamp,
            liquidityRaised: msg.value - launchFee,
            isActive: true
        });
        
        launches.push(launch);
        creatorLaunches[msg.sender].push(launches.length - 1);
        isLaunchedToken[tokenAddress] = true;
        
        // Transfer launch fee to collector
        payable(feeCollector).transfer(launchFee);
        
        // Register token in the LIRA registry as PROJECT type
        registry.registerToken(
            tokenAddress,
            msg.sender,
            ILiraTokenRegistry.TokenType.PROJECT
        );
        
        emit TokenLaunched(
            tokenAddress,
            msg.sender,
            name,
            symbol,
            initialSupply,
            block.timestamp
        );
        emit TokenRegistered(tokenAddress, msg.sender);
        
        return tokenAddress;
    }
    
    /**
     * @dev Get all launches by a creator
     */
    function getCreatorLaunches(address creator) external view returns (uint256[] memory) {
        return creatorLaunches[creator];
    }
    
    /**
     * @dev Get launch details by index
     */
    function getLaunch(uint256 index) external view returns (TokenLaunch memory) {
        require(index < launches.length, "Invalid index");
        return launches[index];
    }
    
    /**
     * @dev Get total number of launches
     */
    function getTotalLaunches() external view returns (uint256) {
        return launches.length;
    }
    
    /**
     * @dev Update launch fee (only owner)
     */
    function setLaunchFee(uint256 _launchFee) external onlyOwner {
        launchFee = _launchFee;
        emit LaunchFeeUpdated(_launchFee);
    }
    
    /**
     * @dev Update protocol fee percent (only owner)
     */
    function setProtocolFeePercent(uint256 _feePercent) external onlyOwner {
        require(_feePercent <= 1000, "Fee too high"); // Max 10%
        protocolFeePercent = _feePercent;
        emit ProtocolFeeUpdated(_feePercent);
    }
    
    /**
     * @dev Update fee collector (only owner)
     */
    function setFeeCollector(address _feeCollector) external onlyOwner {
        require(_feeCollector != address(0), "Invalid address");
        feeCollector = _feeCollector;
    }
}

/**
 * @title LaunchedToken
 * @dev ERC20 token created through the factory
 */
contract LaunchedToken is ERC20, Ownable {
    address public factory;
    address public creator;
    uint256 public launchTime;
    
    constructor(
        string memory name,
        string memory symbol,
        uint256 initialSupply,
        address _creator,
        address _factory
    ) ERC20(name, symbol) Ownable(_creator) {
        creator = _creator;
        factory = _factory;
        launchTime = block.timestamp;
        _mint(_creator, initialSupply * 10**decimals());
    }
}
