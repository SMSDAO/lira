const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("LiraProfile", function () {
  let profile;
  let owner;
  let user1;
  let user2;
  let mockToken;

  beforeEach(async function () {
    [owner, user1, user2, mockToken] = await ethers.getSigners();
    
    const LiraProfile = await ethers.getContractFactory("LiraProfile");
    profile = await LiraProfile.deploy();
    await profile.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await profile.owner()).to.equal(owner.address);
    });
  });

  describe("Profile Creation", function () {
    it("Should create a new profile", async function () {
      await expect(
        profile.connect(user1).setProfile("alice", "ipfs://metadata")
      ).to.emit(profile, "ProfileCreated")
        .withArgs(user1.address, "alice", await ethers.provider.getBlockNumber() + 1);

      const userProfile = await profile.getProfile(user1.address);
      expect(userProfile.handle).to.equal("alice");
      expect(userProfile.metadataURI).to.equal("ipfs://metadata");
      expect(userProfile.exists).to.be.true;
    });

    it("Should prevent duplicate handles", async function () {
      await profile.connect(user1).setProfile("alice", "ipfs://metadata1");
      
      await expect(
        profile.connect(user2).setProfile("alice", "ipfs://metadata2")
      ).to.be.revertedWith("LiraProfile: handle taken");
    });

    it("Should prevent empty handles", async function () {
      await expect(
        profile.connect(user1).setProfile("", "ipfs://metadata")
      ).to.be.revertedWith("LiraProfile: empty handle");
    });

    it("Should prevent too long handles", async function () {
      const longHandle = "a".repeat(33);
      await expect(
        profile.connect(user1).setProfile(longHandle, "ipfs://metadata")
      ).to.be.revertedWith("LiraProfile: handle too long");
    });

    it("Should validate handle format", async function () {
      // Valid handles
      await profile.connect(user1).setProfile("alice_123", "ipfs://metadata");
      await profile.connect(user2).setProfile("Bob_456", "ipfs://metadata");

      // Invalid handles with special characters
      await expect(
        profile.connect(owner).setProfile("alice-bob", "ipfs://metadata")
      ).to.be.revertedWith("LiraProfile: invalid handle");

      await expect(
        profile.connect(owner).setProfile("alice.bob", "ipfs://metadata")
      ).to.be.revertedWith("LiraProfile: invalid handle");

      await expect(
        profile.connect(owner).setProfile("alice@bob", "ipfs://metadata")
      ).to.be.revertedWith("LiraProfile: invalid handle");
    });

    it("Should check if handle is available", async function () {
      expect(await profile.isHandleAvailable("alice")).to.be.true;
      
      await profile.connect(user1).setProfile("alice", "ipfs://metadata");
      
      expect(await profile.isHandleAvailable("alice")).to.be.false;
      expect(await profile.isHandleAvailable("bob")).to.be.true;
    });

    it("Should map handle to address", async function () {
      await profile.connect(user1).setProfile("alice", "ipfs://metadata");
      
      expect(await profile.getAddressByHandle("alice")).to.equal(user1.address);
    });

    it("Should check if profile exists", async function () {
      expect(await profile.profileExists(user1.address)).to.be.false;
      
      await profile.connect(user1).setProfile("alice", "ipfs://metadata");
      
      expect(await profile.profileExists(user1.address)).to.be.true;
    });
  });

  describe("Profile Updates", function () {
    beforeEach(async function () {
      await profile.connect(user1).setProfile("alice", "ipfs://metadata1");
    });

    it("Should update metadata", async function () {
      await expect(
        profile.connect(user1).setProfile("alice", "ipfs://metadata2")
      ).to.emit(profile, "ProfileUpdated");

      const userProfile = await profile.getProfile(user1.address);
      expect(userProfile.metadataURI).to.equal("ipfs://metadata2");
    });

    it("Should change handle", async function () {
      await expect(
        profile.connect(user1).setProfile("alice2", "ipfs://metadata1")
      ).to.emit(profile, "HandleChanged")
        .withArgs(user1.address, "alice", "alice2", await ethers.provider.getBlockNumber() + 1);

      const userProfile = await profile.getProfile(user1.address);
      expect(userProfile.handle).to.equal("alice2");
      
      // Old handle should be available
      expect(await profile.isHandleAvailable("alice")).to.be.true;
      // New handle should be taken
      expect(await profile.isHandleAvailable("alice2")).to.be.false;
    });

    it("Should update metadata URI separately", async function () {
      await expect(
        profile.connect(user1).setMetadataURI("ipfs://new-metadata")
      ).to.emit(profile, "MetadataUpdated")
        .withArgs(user1.address, "ipfs://new-metadata", await ethers.provider.getBlockNumber() + 1);

      const userProfile = await profile.getProfile(user1.address);
      expect(userProfile.metadataURI).to.equal("ipfs://new-metadata");
      expect(userProfile.handle).to.equal("alice"); // Handle unchanged
    });

    it("Should prevent metadata update without profile", async function () {
      await expect(
        profile.connect(user2).setMetadataURI("ipfs://metadata")
      ).to.be.revertedWith("LiraProfile: profile does not exist");
    });
  });

  describe("Primary Token Linking", function () {
    beforeEach(async function () {
      await profile.connect(user1).setProfile("alice", "ipfs://metadata");
    });

    it("Should link primary token", async function () {
      await expect(
        profile.connect(user1).linkPrimaryToken(mockToken.address)
      ).to.emit(profile, "PrimaryTokenLinked")
        .withArgs(user1.address, mockToken.address, await ethers.provider.getBlockNumber() + 1);

      const userProfile = await profile.getProfile(user1.address);
      expect(userProfile.primaryToken).to.equal(mockToken.address);
    });

    it("Should prevent linking without profile", async function () {
      await expect(
        profile.connect(user2).linkPrimaryToken(mockToken.address)
      ).to.be.revertedWith("LiraProfile: profile does not exist");
    });

    it("Should prevent linking zero address", async function () {
      await expect(
        profile.connect(user1).linkPrimaryToken(ethers.ZeroAddress)
      ).to.be.revertedWith("LiraProfile: zero address");
    });

    it("Should allow changing primary token", async function () {
      await profile.connect(user1).linkPrimaryToken(mockToken.address);
      await profile.connect(user1).linkPrimaryToken(user2.address);

      const userProfile = await profile.getProfile(user1.address);
      expect(userProfile.primaryToken).to.equal(user2.address);
    });
  });

  describe("Profile Queries", function () {
    beforeEach(async function () {
      await profile.connect(user1).setProfile("alice", "ipfs://alice-metadata");
      await profile.connect(user2).setProfile("bob", "ipfs://bob-metadata");
    });

    it("Should get profile by address", async function () {
      const aliceProfile = await profile.getProfile(user1.address);
      expect(aliceProfile.handle).to.equal("alice");
      expect(aliceProfile.metadataURI).to.equal("ipfs://alice-metadata");
    });

    it("Should get address by handle", async function () {
      expect(await profile.getAddressByHandle("alice")).to.equal(user1.address);
      expect(await profile.getAddressByHandle("bob")).to.equal(user2.address);
    });

    it("Should revert when getting non-existent profile", async function () {
      await expect(
        profile.getProfile(owner.address)
      ).to.be.revertedWith("LiraProfile: profile does not exist");
    });

    it("Should revert when getting address for non-existent handle", async function () {
      await expect(
        profile.getAddressByHandle("charlie")
      ).to.be.revertedWith("LiraProfile: handle not found");
    });
  });

  describe("Timestamp Tracking", function () {
    it("Should track creation timestamp", async function () {
      const tx = await profile.connect(user1).setProfile("alice", "ipfs://metadata");
      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt.blockNumber);

      const userProfile = await profile.getProfile(user1.address);
      expect(userProfile.createdAt).to.equal(block.timestamp);
      expect(userProfile.updatedAt).to.equal(block.timestamp);
    });

    it("Should update timestamp on profile update", async function () {
      await profile.connect(user1).setProfile("alice", "ipfs://metadata1");
      const profile1 = await profile.getProfile(user1.address);
      
      // Wait a bit and update
      await ethers.provider.send("evm_increaseTime", [60]);
      await ethers.provider.send("evm_mine");
      
      await profile.connect(user1).setProfile("alice", "ipfs://metadata2");
      const profile2 = await profile.getProfile(user1.address);
      
      expect(profile2.updatedAt).to.be.gt(profile1.updatedAt);
      expect(profile2.createdAt).to.equal(profile1.createdAt);
    });
  });
});
