// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title AgentExecutor
 * @dev Manages parallel agent execution and model deployment on-chain
 * @notice Integrates with quantum oracle for advanced agent intelligence
 */
contract AgentExecutor is Ownable, ReentrancyGuard, Pausable {
    struct Agent {
        uint256 id;
        string name;
        string modelType;
        address owner;
        uint256 createdAt;
        uint256 executionCount;
        bool isActive;
        bytes32 modelHash;
    }
    
    struct Execution {
        uint256 agentId;
        address executor;
        uint256 timestamp;
        bytes32 inputHash;
        bytes32 outputHash;
        uint256 gasUsed;
        bool success;
    }
    
    // Storage
    uint256 public nextAgentId = 1;
    mapping(uint256 => Agent) public agents;
    mapping(address => uint256[]) public userAgents;
    Execution[] public executions;
    
    // Oracle integration
    address public quantumOracle;
    
    // Fee structure
    uint256 public agentCreationFee = 0.001 ether;
    uint256 public executionFee = 0.0001 ether;
    address public feeCollector;
    
    // Events
    event AgentCreated(
        uint256 indexed agentId,
        address indexed owner,
        string name,
        string modelType,
        bytes32 modelHash
    );
    event AgentExecuted(
        uint256 indexed agentId,
        address indexed executor,
        bytes32 inputHash,
        bytes32 outputHash,
        bool success
    );
    event AgentUpdated(uint256 indexed agentId, bool isActive);
    event QuantumOracleUpdated(address indexed newOracle);
    
    constructor(address _feeCollector) Ownable(msg.sender) {
        require(_feeCollector != address(0), "Invalid fee collector");
        feeCollector = _feeCollector;
    }
    
    /**
     * @dev Create a new agent with model configuration
     */
    function createAgent(
        string memory name,
        string memory modelType,
        bytes32 modelHash
    ) external payable nonReentrant whenNotPaused returns (uint256) {
        require(msg.value >= agentCreationFee, "Insufficient fee");
        require(bytes(name).length > 0, "Name required");
        require(bytes(modelType).length > 0, "Model type required");
        
        uint256 agentId = nextAgentId++;
        
        agents[agentId] = Agent({
            id: agentId,
            name: name,
            modelType: modelType,
            owner: msg.sender,
            createdAt: block.timestamp,
            executionCount: 0,
            isActive: true,
            modelHash: modelHash
        });
        
        userAgents[msg.sender].push(agentId);
        
        // Transfer fee
        payable(feeCollector).transfer(msg.value);
        
        emit AgentCreated(agentId, msg.sender, name, modelType, modelHash);
        
        return agentId;
    }
    
    /**
     * @dev Execute an agent (parallel execution supported)
     */
    function executeAgent(
        uint256 agentId,
        bytes32 inputHash
    ) external payable nonReentrant whenNotPaused returns (bytes32) {
        require(msg.value >= executionFee, "Insufficient execution fee");
        require(agents[agentId].isActive, "Agent not active");
        
        uint256 gasStart = gasleft();
        
        // Simulate agent execution (in production, this would call the quantum oracle)
        bytes32 outputHash = keccak256(
            abi.encodePacked(inputHash, agentId, block.timestamp, msg.sender)
        );
        
        // Record execution
        uint256 gasUsed = gasStart - gasleft();
        executions.push(Execution({
            agentId: agentId,
            executor: msg.sender,
            timestamp: block.timestamp,
            inputHash: inputHash,
            outputHash: outputHash,
            gasUsed: gasUsed,
            success: true
        }));
        
        agents[agentId].executionCount++;
        
        // Transfer execution fee
        payable(feeCollector).transfer(msg.value);
        
        emit AgentExecuted(agentId, msg.sender, inputHash, outputHash, true);
        
        return outputHash;
    }
    
    /**
     * @dev Batch execute multiple agents in parallel
     */
    function executeAgentsBatch(
        uint256[] calldata agentIds,
        bytes32[] calldata inputHashes
    ) external payable nonReentrant whenNotPaused returns (bytes32[] memory) {
        require(agentIds.length == inputHashes.length, "Length mismatch");
        require(msg.value >= executionFee * agentIds.length, "Insufficient fee");
        
        bytes32[] memory outputs = new bytes32[](agentIds.length);
        
        for (uint256 i = 0; i < agentIds.length; i++) {
            require(agents[agentIds[i]].isActive, "Agent not active");
            
            outputs[i] = keccak256(
                abi.encodePacked(
                    inputHashes[i],
                    agentIds[i],
                    block.timestamp,
                    msg.sender,
                    i
                )
            );
            
            executions.push(Execution({
                agentId: agentIds[i],
                executor: msg.sender,
                timestamp: block.timestamp,
                inputHash: inputHashes[i],
                outputHash: outputs[i],
                gasUsed: 0,
                success: true
            }));
            
            agents[agentIds[i]].executionCount++;
            
            emit AgentExecuted(agentIds[i], msg.sender, inputHashes[i], outputs[i], true);
        }
        
        payable(feeCollector).transfer(msg.value);
        
        return outputs;
    }
    
    /**
     * @dev Get user's agents
     */
    function getUserAgents(address user) external view returns (uint256[] memory) {
        return userAgents[user];
    }
    
    /**
     * @dev Get agent details
     */
    function getAgent(uint256 agentId) external view returns (Agent memory) {
        return agents[agentId];
    }
    
    /**
     * @dev Get execution count
     */
    function getExecutionCount() external view returns (uint256) {
        return executions.length;
    }
    
    /**
     * @dev Update agent status (owner only)
     */
    function setAgentStatus(uint256 agentId, bool isActive) external {
        require(agents[agentId].owner == msg.sender, "Not agent owner");
        agents[agentId].isActive = isActive;
        emit AgentUpdated(agentId, isActive);
    }
    
    /**
     * @dev Set quantum oracle address (admin only)
     */
    function setQuantumOracle(address _oracle) external onlyOwner {
        quantumOracle = _oracle;
        emit QuantumOracleUpdated(_oracle);
    }
    
    /**
     * @dev Update fees (admin only)
     */
    function setAgentCreationFee(uint256 _fee) external onlyOwner {
        agentCreationFee = _fee;
    }
    
    function setExecutionFee(uint256 _fee) external onlyOwner {
        executionFee = _fee;
    }
    
    /**
     * @dev Pause/unpause (admin only)
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }
}
