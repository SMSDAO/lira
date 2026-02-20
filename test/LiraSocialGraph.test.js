const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("LiraSocialGraph", function () {
  let socialGraph;
  let user1, user2, user3;

  beforeEach(async function () {
    [user1, user2, user3] = await ethers.getSigners();
    const LiraSocialGraph = await ethers.getContractFactory("LiraSocialGraph");
    socialGraph = await LiraSocialGraph.deploy();
    await socialGraph.waitForDeployment();
  });

  describe("Follow/Unfollow", function () {
    it("Should follow a user", async function () {
      await expect(socialGraph.connect(user1).follow(user2.address))
        .to.emit(socialGraph, "Followed")
        .withArgs(user1.address, user2.address, await ethers.provider.getBlockNumber() + 1);

      expect(await socialGraph.isFollowing(user1.address, user2.address)).to.be.true;
      expect(await socialGraph.getFollowingCount(user1.address)).to.equal(1);
      expect(await socialGraph.getFollowerCount(user2.address)).to.equal(1);
    });

    it("Should unfollow a user", async function () {
      await socialGraph.connect(user1).follow(user2.address);
      
      await expect(socialGraph.connect(user1).unfollow(user2.address))
        .to.emit(socialGraph, "Unfollowed");

      expect(await socialGraph.isFollowing(user1.address, user2.address)).to.be.false;
    });

    it("Should prevent following self", async function () {
      await expect(
        socialGraph.connect(user1).follow(user1.address)
      ).to.be.revertedWith("LiraSocialGraph: cannot follow self");
    });

    it("Should prevent duplicate follows", async function () {
      await socialGraph.connect(user1).follow(user2.address);
      await expect(
        socialGraph.connect(user1).follow(user2.address)
      ).to.be.revertedWith("LiraSocialGraph: already following");
    });

    it("Should get following and followers lists", async function () {
      await socialGraph.connect(user1).follow(user2.address);
      await socialGraph.connect(user1).follow(user3.address);
      await socialGraph.connect(user3).follow(user1.address);

      const following = await socialGraph.getFollowing(user1.address);
      expect(following.length).to.equal(2);
      expect(following).to.include(user2.address);
      expect(following).to.include(user3.address);

      const followers = await socialGraph.getFollowers(user1.address);
      expect(followers.length).to.equal(1);
      expect(followers[0]).to.equal(user3.address);
    });
  });

  describe("Block/Unblock", function () {
    it("Should block a user", async function () {
      await expect(socialGraph.connect(user1).block(user2.address))
        .to.emit(socialGraph, "Blocked");

      expect(await socialGraph.isBlocked(user1.address, user2.address)).to.be.true;
    });

    it("Should auto-unfollow when blocking", async function () {
      await socialGraph.connect(user1).follow(user2.address);
      await socialGraph.connect(user2).follow(user1.address);

      await socialGraph.connect(user1).block(user2.address);

      expect(await socialGraph.isFollowing(user1.address, user2.address)).to.be.false;
      expect(await socialGraph.isFollowing(user2.address, user1.address)).to.be.false;
    });

    it("Should prevent following when blocked", async function () {
      await socialGraph.connect(user2).block(user1.address);
      
      await expect(
        socialGraph.connect(user1).follow(user2.address)
      ).to.be.revertedWith("LiraSocialGraph: you are blocked");
    });

    it("Should unblock a user", async function () {
      await socialGraph.connect(user1).block(user2.address);
      await socialGraph.connect(user1).unblock(user2.address);

      expect(await socialGraph.isBlocked(user1.address, user2.address)).to.be.false;
    });
  });

  describe("Mute/Unmute", function () {
    it("Should mute a user", async function () {
      await expect(socialGraph.connect(user1).mute(user2.address))
        .to.emit(socialGraph, "Muted");

      expect(await socialGraph.isMuted(user1.address, user2.address)).to.be.true;
    });

    it("Should unmute a user", async function () {
      await socialGraph.connect(user1).mute(user2.address);
      await socialGraph.connect(user1).unmute(user2.address);

      expect(await socialGraph.isMuted(user1.address, user2.address)).to.be.false;
    });

    it("Should get muted list", async function () {
      await socialGraph.connect(user1).mute(user2.address);
      await socialGraph.connect(user1).mute(user3.address);

      const muted = await socialGraph.getMuted(user1.address);
      expect(muted.length).to.equal(2);
    });
  });
});
