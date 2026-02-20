const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("User Token Implementations", function () {
  let owner, user1, user2;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();
  });

  describe("LiraReputationToken", function () {
    let token;

    beforeEach(async function () {
      const LiraReputationToken = await ethers.getContractFactory("LiraReputationToken");
      token = await LiraReputationToken.deploy(
        "Reputation Token",
        "REP",
        owner.address,
        "ipfs://metadata"
      );
      await token.waitForDeployment();
    });

    it("Should deploy with correct parameters", async function () {
      expect(await token.name()).to.equal("Reputation Token");
      expect(await token.symbol()).to.equal("REP");
      expect(await token.creator()).to.equal(owner.address);
      expect(await token.metadataURI()).to.equal("ipfs://metadata");
    });

    it("Should allow owner to mint", async function () {
      await token.mint(user1.address, ethers.parseEther("100"));
      expect(await token.balanceOf(user1.address)).to.equal(ethers.parseEther("100"));
    });

    it("Should emit ReputationMinted event", async function () {
      await expect(token.mint(user1.address, ethers.parseEther("100")))
        .to.emit(token, "ReputationMinted")
        .withArgs(user1.address, ethers.parseEther("100"));
    });

    it("Should allow owner to burn", async function () {
      await token.mint(user1.address, ethers.parseEther("100"));
      await token.burn(user1.address, ethers.parseEther("50"));
      expect(await token.balanceOf(user1.address)).to.equal(ethers.parseEther("50"));
    });

    it("Should prevent non-owner from minting", async function () {
      await expect(
        token.connect(user1).mint(user2.address, ethers.parseEther("100"))
      ).to.be.reverted;
    });

    it("Should prevent transfers", async function () {
      await token.mint(user1.address, ethers.parseEther("100"));
      
      await expect(
        token.connect(user1).transfer(user2.address, ethers.parseEther("50"))
      ).to.be.revertedWith("LiraReputationToken: non-transferable");
    });

    it("Should prevent transferFrom", async function () {
      await token.mint(user1.address, ethers.parseEther("100"));
      
      await expect(
        token.connect(user1).transferFrom(user1.address, user2.address, ethers.parseEther("50"))
      ).to.be.revertedWith("LiraReputationToken: non-transferable");
    });

    it("Should prevent approve", async function () {
      await token.mint(user1.address, ethers.parseEther("100"));
      
      await expect(
        token.connect(user1).approve(user2.address, ethers.parseEther("50"))
      ).to.be.revertedWith("LiraReputationToken: non-transferable");
    });

    it("Should allow owner to update metadata", async function () {
      await token.setMetadataURI("ipfs://new-metadata");
      expect(await token.metadataURI()).to.equal("ipfs://new-metadata");
    });
  });

  describe("LiraSocialToken", function () {
    let token;

    beforeEach(async function () {
      const LiraSocialToken = await ethers.getContractFactory("LiraSocialToken");
      token = await LiraSocialToken.deploy(
        "Social Token",
        "SOCIAL",
        ethers.parseEther("1000000"),
        ethers.parseEther("10000000"),
        owner.address,
        "ipfs://metadata"
      );
      await token.waitForDeployment();
    });

    it("Should deploy with correct parameters", async function () {
      expect(await token.name()).to.equal("Social Token");
      expect(await token.symbol()).to.equal("SOCIAL");
      expect(await token.creator()).to.equal(owner.address);
      expect(await token.maxSupply()).to.equal(ethers.parseEther("10000000"));
      expect(await token.totalSupply()).to.equal(ethers.parseEther("1000000"));
    });

    it("Should mint initial supply to creator", async function () {
      expect(await token.balanceOf(owner.address)).to.equal(ethers.parseEther("1000000"));
    });

    it("Should allow transfers", async function () {
      await token.transfer(user1.address, ethers.parseEther("1000"));
      expect(await token.balanceOf(user1.address)).to.equal(ethers.parseEther("1000"));
    });

    it("Should allow owner to mint", async function () {
      await token.mint(user1.address, ethers.parseEther("1000"));
      expect(await token.balanceOf(user1.address)).to.equal(ethers.parseEther("1000"));
    });

    it("Should enforce max supply", async function () {
      const remaining = ethers.parseEther("10000000") - ethers.parseEther("1000000");
      
      // Minting remaining should work
      await token.mint(user1.address, remaining);
      
      // Minting more should fail
      await expect(
        token.mint(user1.address, 1)
      ).to.be.revertedWith("Max supply exceeded");
    });

    it("Should allow anyone to burn their tokens", async function () {
      await token.transfer(user1.address, ethers.parseEther("1000"));
      await token.connect(user1).burn(ethers.parseEther("500"));
      expect(await token.balanceOf(user1.address)).to.equal(ethers.parseEther("500"));
    });

    it("Should allow owner to update max supply", async function () {
      await token.setMaxSupply(ethers.parseEther("20000000"));
      expect(await token.maxSupply()).to.equal(ethers.parseEther("20000000"));
    });

    it("Should prevent decreasing max supply", async function () {
      await expect(
        token.setMaxSupply(ethers.parseEther("5000000"))
      ).to.be.revertedWith("Cannot decrease max supply");
    });
  });

  describe("LiraAccessToken", function () {
    let token;

    beforeEach(async function () {
      const LiraAccessToken = await ethers.getContractFactory("LiraAccessToken");
      token = await LiraAccessToken.deploy(
        "Access Token",
        "ACCESS",
        ethers.parseEther("1000"),
        ethers.parseEther("10000"),
        owner.address,
        "ipfs://metadata",
        false // transfers disabled
      );
      await token.waitForDeployment();
    });

    it("Should deploy with correct parameters", async function () {
      expect(await token.name()).to.equal("Access Token");
      expect(await token.symbol()).to.equal("ACCESS");
      expect(await token.creator()).to.equal(owner.address);
      expect(await token.transfersEnabled()).to.be.false;
    });

    it("Should automatically whitelist creator", async function () {
      expect(await token.whitelistedAddresses(owner.address)).to.be.true;
    });

    it("Should prevent transfers when disabled", async function () {
      await expect(
        token.transfer(user1.address, ethers.parseEther("100"))
      ).to.be.revertedWith("LiraAccessToken: transfers restricted");
    });

    it("Should allow transfers from whitelisted address", async function () {
      // Owner is whitelisted by default
      await token.transfer(user1.address, ethers.parseEther("100"));
      expect(await token.balanceOf(user1.address)).to.equal(ethers.parseEther("100"));
    });

    it("Should allow transfers to whitelisted address", async function () {
      // Whitelist user1
      await token.setWhitelisted(user1.address, true);
      
      // Transfer to owner (also whitelisted)
      await token.transfer(owner.address, 0); // Transfer to self
      
      // Now owner can transfer to user1
      await token.transfer(user1.address, ethers.parseEther("100"));
      expect(await token.balanceOf(user1.address)).to.equal(ethers.parseEther("100"));
    });

    it("Should allow transfers when enabled", async function () {
      await token.setTransfersEnabled(true);
      await token.transfer(user1.address, ethers.parseEther("100"));
      expect(await token.balanceOf(user1.address)).to.equal(ethers.parseEther("100"));
    });

    it("Should allow owner to whitelist addresses", async function () {
      await token.setWhitelisted(user1.address, true);
      expect(await token.whitelistedAddresses(user1.address)).to.be.true;
    });

    it("Should emit AddressWhitelisted event", async function () {
      await expect(token.setWhitelisted(user1.address, true))
        .to.emit(token, "AddressWhitelisted")
        .withArgs(user1.address, true);
    });

    it("Should allow batch whitelisting", async function () {
      await token.setWhitelistedBatch([user1.address, user2.address], true);
      expect(await token.whitelistedAddresses(user1.address)).to.be.true;
      expect(await token.whitelistedAddresses(user2.address)).to.be.true;
    });

    it("Should allow owner to mint", async function () {
      await token.mint(user1.address, ethers.parseEther("100"));
      expect(await token.balanceOf(user1.address)).to.equal(ethers.parseEther("100"));
    });

    it("Should allow owner to burn", async function () {
      await token.mint(user1.address, ethers.parseEther("100"));
      await token.burn(user1.address, ethers.parseEther("50"));
      expect(await token.balanceOf(user1.address)).to.equal(ethers.parseEther("50"));
    });

    it("Should prevent non-owner from minting", async function () {
      await expect(
        token.connect(user1).mint(user2.address, ethers.parseEther("100"))
      ).to.be.reverted;
    });
  });
});
