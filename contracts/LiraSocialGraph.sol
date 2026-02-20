// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

/**
 * @title LiraSocialGraph
 * @notice Manages the social graph for LIRA SOCIAL - follows, blocks, mutes
 * @dev Uses EnumerableSet for efficient storage and retrieval
 */
contract LiraSocialGraph {
    using EnumerableSet for EnumerableSet.AddressSet;

    // User following mapping (follower => following)
    mapping(address => EnumerableSet.AddressSet) private following;
    
    // User followers mapping (user => followers)
    mapping(address => EnumerableSet.AddressSet) private followers;
    
    // Blocked users mapping (blocker => blocked)
    mapping(address => EnumerableSet.AddressSet) private blocked;
    
    // Muted users mapping (muter => muted)
    mapping(address => EnumerableSet.AddressSet) private muted;

    // Events
    event Followed(
        address indexed follower,
        address indexed following,
        uint256 timestamp
    );
    
    event Unfollowed(
        address indexed follower,
        address indexed unfollowed,
        uint256 timestamp
    );
    
    event Blocked(
        address indexed blocker,
        address indexed blocked,
        uint256 timestamp
    );
    
    event Unblocked(
        address indexed blocker,
        address indexed unblocked,
        uint256 timestamp
    );
    
    event Muted(
        address indexed muter,
        address indexed muted,
        uint256 timestamp
    );
    
    event Unmuted(
        address indexed muter,
        address indexed unmuted,
        uint256 timestamp
    );

    /**
     * @notice Follow a user
     * @param user The address to follow
     */
    function follow(address user) external {
        require(user != address(0), "LiraSocialGraph: zero address");
        require(user != msg.sender, "LiraSocialGraph: cannot follow self");
        require(!blocked[user].contains(msg.sender), "LiraSocialGraph: you are blocked");
        require(!following[msg.sender].contains(user), "LiraSocialGraph: already following");
        
        following[msg.sender].add(user);
        followers[user].add(msg.sender);
        
        emit Followed(msg.sender, user, block.timestamp);
    }

    /**
     * @notice Unfollow a user
     * @param user The address to unfollow
     */
    function unfollow(address user) external {
        require(following[msg.sender].contains(user), "LiraSocialGraph: not following");
        
        following[msg.sender].remove(user);
        followers[user].remove(msg.sender);
        
        emit Unfollowed(msg.sender, user, block.timestamp);
    }

    /**
     * @notice Block a user
     * @param user The address to block
     */
    function block(address user) external {
        require(user != address(0), "LiraSocialGraph: zero address");
        require(user != msg.sender, "LiraSocialGraph: cannot block self");
        require(!blocked[msg.sender].contains(user), "LiraSocialGraph: already blocked");
        
        blocked[msg.sender].add(user);
        
        // Auto-unfollow both ways
        if (following[msg.sender].contains(user)) {
            following[msg.sender].remove(user);
            followers[user].remove(msg.sender);
        }
        if (following[user].contains(msg.sender)) {
            following[user].remove(msg.sender);
            followers[msg.sender].remove(user);
        }
        
        emit Blocked(msg.sender, user, block.timestamp);
    }

    /**
     * @notice Unblock a user
     * @param user The address to unblock
     */
    function unblock(address user) external {
        require(blocked[msg.sender].contains(user), "LiraSocialGraph: not blocked");
        
        blocked[msg.sender].remove(user);
        
        emit Unblocked(msg.sender, user, block.timestamp);
    }

    /**
     * @notice Mute a user
     * @param user The address to mute
     */
    function mute(address user) external {
        require(user != address(0), "LiraSocialGraph: zero address");
        require(user != msg.sender, "LiraSocialGraph: cannot mute self");
        require(!muted[msg.sender].contains(user), "LiraSocialGraph: already muted");
        
        muted[msg.sender].add(user);
        
        emit Muted(msg.sender, user, block.timestamp);
    }

    /**
     * @notice Unmute a user
     * @param user The address to unmute
     */
    function unmute(address user) external {
        require(muted[msg.sender].contains(user), "LiraSocialGraph: not muted");
        
        muted[msg.sender].remove(user);
        
        emit Unmuted(msg.sender, user, block.timestamp);
    }

    /**
     * @notice Get all addresses a user is following
     * @param user The user address
     * @return address[] Array of addresses being followed
     */
    function getFollowing(address user) external view returns (address[] memory) {
        uint256 length = following[user].length();
        address[] memory result = new address[](length);
        for (uint256 i = 0; i < length; i++) {
            result[i] = following[user].at(i);
        }
        return result;
    }

    /**
     * @notice Get all followers of a user
     * @param user The user address
     * @return address[] Array of follower addresses
     */
    function getFollowers(address user) external view returns (address[] memory) {
        uint256 length = followers[user].length();
        address[] memory result = new address[](length);
        for (uint256 i = 0; i < length; i++) {
            result[i] = followers[user].at(i);
        }
        return result;
    }

    /**
     * @notice Get following count
     * @param user The user address
     * @return uint256 Number of users being followed
     */
    function getFollowingCount(address user) external view returns (uint256) {
        return following[user].length();
    }

    /**
     * @notice Get follower count
     * @param user The user address
     * @return uint256 Number of followers
     */
    function getFollowerCount(address user) external view returns (uint256) {
        return followers[user].length();
    }

    /**
     * @notice Check if user A is following user B
     * @param follower The potential follower
     * @param user The user being followed
     * @return bool True if following
     */
    function isFollowing(address follower, address user) external view returns (bool) {
        return following[follower].contains(user);
    }

    /**
     * @notice Check if user A has blocked user B
     * @param blocker The potential blocker
     * @param user The potentially blocked user
     * @return bool True if blocked
     */
    function isBlocked(address blocker, address user) external view returns (bool) {
        return blocked[blocker].contains(user);
    }

    /**
     * @notice Check if user A has muted user B
     * @param muter The potential muter
     * @param user The potentially muted user
     * @return bool True if muted
     */
    function isMuted(address muter, address user) external view returns (bool) {
        return muted[muter].contains(user);
    }

    /**
     * @notice Get all blocked addresses for a user
     * @param user The user address
     * @return address[] Array of blocked addresses
     */
    function getBlocked(address user) external view returns (address[] memory) {
        uint256 length = blocked[user].length();
        address[] memory result = new address[](length);
        for (uint256 i = 0; i < length; i++) {
            result[i] = blocked[user].at(i);
        }
        return result;
    }

    /**
     * @notice Get all muted addresses for a user
     * @param user The user address
     * @return address[] Array of muted addresses
     */
    function getMuted(address user) external view returns (address[] memory) {
        uint256 length = muted[user].length();
        address[] memory result = new address[](length);
        for (uint256 i = 0; i < length; i++) {
            result[i] = muted[user].at(i);
        }
        return result;
    }
}
