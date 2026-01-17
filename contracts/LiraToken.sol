// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title LiraToken
 * @dev LIRA base token with Zora-inspired logic for BASE and Monad mainnets
 * @notice This is the core governance and utility token for the Lira protocol
 */
contract LiraToken is ERC20, Ownable, ReentrancyGuard, Pausable {
    // Token constants
    uint256 public constant MAX_SUPPLY = 1_000_000_000 * 10**18; // 1 billion tokens
    uint256 public constant INITIAL_SUPPLY = 100_000_000 * 10**18; // 100 million initial
    
    // Fee structure (in basis points, 100 = 1%)
    uint256 public protocolFee = 100; // 1%
    uint256 public creatorFee = 200; // 2%
    
    // Treasury and fee collectors
    address public treasury;
    address public feeCollector;
    
    // Minting control
    mapping(address => bool) public minters;
    
    // Events
    event FeesUpdated(uint256 protocolFee, uint256 creatorFee);
    event TreasuryUpdated(address indexed newTreasury);
    event FeeCollectorUpdated(address indexed newFeeCollector);
    event MinterUpdated(address indexed minter, bool status);
    
    constructor(
        address _treasury,
        address _feeCollector
    ) ERC20("Lira", "LIRA") Ownable(_treasury) {
        require(_treasury != address(0), "Invalid treasury");
        require(_feeCollector != address(0), "Invalid fee collector");
        
        treasury = _treasury;
        feeCollector = _feeCollector;
        
        // Mint initial supply to treasury
        _mint(treasury, INITIAL_SUPPLY);
    }
    
    /**
     * @dev Mint new tokens (only by authorized minters)
     */
    function mint(address to, uint256 amount) external nonReentrant whenNotPaused {
        require(minters[msg.sender], "Not authorized to mint");
        require(totalSupply() + amount <= MAX_SUPPLY, "Max supply exceeded");
        _mint(to, amount);
    }
    
    /**
     * @dev Burn tokens
     */
    function burn(uint256 amount) external nonReentrant {
        _burn(msg.sender, amount);
    }
    
    /**
     * @dev Update protocol fee (only owner)
     */
    function setProtocolFee(uint256 _protocolFee) external onlyOwner {
        require(_protocolFee <= 500, "Fee too high"); // Max 5%
        protocolFee = _protocolFee;
        emit FeesUpdated(protocolFee, creatorFee);
    }
    
    /**
     * @dev Update creator fee (only owner)
     */
    function setCreatorFee(uint256 _creatorFee) external onlyOwner {
        require(_creatorFee <= 1000, "Fee too high"); // Max 10%
        creatorFee = _creatorFee;
        emit FeesUpdated(protocolFee, creatorFee);
    }
    
    /**
     * @dev Update treasury address (only owner)
     */
    function setTreasury(address _treasury) external onlyOwner {
        require(_treasury != address(0), "Invalid treasury");
        treasury = _treasury;
        emit TreasuryUpdated(_treasury);
    }
    
    /**
     * @dev Update fee collector address (only owner)
     */
    function setFeeCollector(address _feeCollector) external onlyOwner {
        require(_feeCollector != address(0), "Invalid fee collector");
        feeCollector = _feeCollector;
        emit FeeCollectorUpdated(_feeCollector);
    }
    
    /**
     * @dev Add or remove minter (only owner)
     */
    function setMinter(address minter, bool status) external onlyOwner {
        require(minter != address(0), "Invalid minter");
        minters[minter] = status;
        emit MinterUpdated(minter, status);
    }
    
    /**
     * @dev Pause contract (emergency)
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev Unpause contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
}
