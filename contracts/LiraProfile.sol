// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title LiraProfile
 * @notice On-chain user profile management for LIRA SOCIAL
 * @dev Manages user handles, metadata URIs, and primary token links
 */
contract LiraProfile is Ownable {
    
    struct Profile {
        string handle;
        string metadataURI;  // IPFS or external link to profile data
        address primaryToken; // User's primary/social token
        uint256 createdAt;
        uint256 updatedAt;
        bool exists;
    }

    // Address to profile mapping
    mapping(address => Profile) public profiles;
    
    // Handle to address mapping (for lookups)
    mapping(string => address) public handleToAddress;
    
    // Handle availability
    mapping(string => bool) public handleTaken;

    // Events
    event ProfileCreated(
        address indexed userAddress,
        string handle,
        uint256 timestamp
    );
    
    event ProfileUpdated(
        address indexed userAddress,
        uint256 timestamp
    );
    
    event HandleChanged(
        address indexed userAddress,
        string oldHandle,
        string newHandle,
        uint256 timestamp
    );
    
    event MetadataUpdated(
        address indexed userAddress,
        string metadataURI,
        uint256 timestamp
    );
    
    event PrimaryTokenLinked(
        address indexed userAddress,
        address indexed tokenAddress,
        uint256 timestamp
    );

    constructor() Ownable(msg.sender) {}

    /**
     * @notice Create or update a profile
     * @param handle The unique handle (username)
     * @param metadataURI URI pointing to profile metadata
     */
    function setProfile(string calldata handle, string calldata metadataURI) external {
        require(bytes(handle).length > 0, "LiraProfile: empty handle");
        require(bytes(handle).length <= 32, "LiraProfile: handle too long");
        require(_isValidHandle(handle), "LiraProfile: invalid handle");
        
        Profile storage profile = profiles[msg.sender];
        bool isNew = !profile.exists;
        
        if (isNew) {
            // Creating new profile
            require(!handleTaken[handle], "LiraProfile: handle taken");
            
            profile.handle = handle;
            profile.metadataURI = metadataURI;
            profile.createdAt = block.timestamp;
            profile.updatedAt = block.timestamp;
            profile.exists = true;
            
            handleToAddress[handle] = msg.sender;
            handleTaken[handle] = true;
            
            emit ProfileCreated(msg.sender, handle, block.timestamp);
        } else {
            // Updating existing profile
            string memory oldHandle = profile.handle;
            
            // Handle change requested
            if (keccak256(bytes(oldHandle)) != keccak256(bytes(handle))) {
                require(!handleTaken[handle], "LiraProfile: handle taken");
                
                // Release old handle
                handleTaken[oldHandle] = false;
                delete handleToAddress[oldHandle];
                
                // Claim new handle
                profile.handle = handle;
                handleToAddress[handle] = msg.sender;
                handleTaken[handle] = true;
                
                emit HandleChanged(msg.sender, oldHandle, handle, block.timestamp);
            }
            
            profile.metadataURI = metadataURI;
            profile.updatedAt = block.timestamp;
            
            emit ProfileUpdated(msg.sender, block.timestamp);
        }
    }

    /**
     * @notice Update only the metadata URI
     * @param metadataURI New metadata URI
     */
    function setMetadataURI(string calldata metadataURI) external {
        Profile storage profile = profiles[msg.sender];
        require(profile.exists, "LiraProfile: profile does not exist");
        
        profile.metadataURI = metadataURI;
        profile.updatedAt = block.timestamp;
        
        emit MetadataUpdated(msg.sender, metadataURI, block.timestamp);
    }

    /**
     * @notice Link a primary token to the profile
     * @param tokenAddress The token address to link
     */
    function linkPrimaryToken(address tokenAddress) external {
        Profile storage profile = profiles[msg.sender];
        require(profile.exists, "LiraProfile: profile does not exist");
        require(tokenAddress != address(0), "LiraProfile: zero address");
        
        profile.primaryToken = tokenAddress;
        profile.updatedAt = block.timestamp;
        
        emit PrimaryTokenLinked(msg.sender, tokenAddress, block.timestamp);
    }

    /**
     * @notice Get profile by address
     * @param userAddress The user's address
     * @return Profile The user's profile
     */
    function getProfile(address userAddress) external view returns (Profile memory) {
        require(profiles[userAddress].exists, "LiraProfile: profile does not exist");
        return profiles[userAddress];
    }

    /**
     * @notice Get address by handle
     * @param handle The handle to lookup
     * @return address The address associated with the handle
     */
    function getAddressByHandle(string calldata handle) external view returns (address) {
        address addr = handleToAddress[handle];
        require(addr != address(0), "LiraProfile: handle not found");
        return addr;
    }

    /**
     * @notice Check if a profile exists
     * @param userAddress The address to check
     * @return bool True if profile exists
     */
    function profileExists(address userAddress) external view returns (bool) {
        return profiles[userAddress].exists;
    }

    /**
     * @notice Check if a handle is available
     * @param handle The handle to check
     * @return bool True if available
     */
    function isHandleAvailable(string calldata handle) external view returns (bool) {
        return !handleTaken[handle] && _isValidHandle(handle);
    }

    /**
     * @dev Validate handle format (alphanumeric + underscore only)
     * @param handle The handle to validate
     * @return bool True if valid
     */
    function _isValidHandle(string calldata handle) private pure returns (bool) {
        bytes memory b = bytes(handle);
        if (b.length == 0 || b.length > 32) return false;
        
        for (uint i = 0; i < b.length; i++) {
            bytes1 char = b[i];
            if (!(
                (char >= 0x30 && char <= 0x39) || // 0-9
                (char >= 0x41 && char <= 0x5A) || // A-Z
                (char >= 0x61 && char <= 0x7A) || // a-z
                (char == 0x5F)                     // _
            )) {
                return false;
            }
        }
        return true;
    }
}
