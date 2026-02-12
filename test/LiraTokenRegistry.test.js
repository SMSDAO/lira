const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("LiraTokenRegistry", function () {
  let registry;
  let owner;
  let user1;
  let user2;
  let tokenFactory;
  let mockToken1;
  let mockToken2;

  beforeEach(async function () {
    [owner, user1, user2, tokenFactory, mockToken1, mockToken2] = await ethers.getSigners();
    
    const LiraTokenRegistry = await ethers.getContractFactory("LiraTokenRegistry");
    registry = await LiraTokenRegistry.deploy();
    await registry.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await registry.owner()).to.equal(owner.address);
    });

    it("Should start with zero tokens", async function () {
      expect(await registry.getTotalTokens()).to.equal(0);
    });
  });

  describe("Registrar Authorization", function () {
    it("Should allow owner to authorize registrars", async function () {
      await registry.setAuthorizedRegistrar(tokenFactory.address, true);
      expect(await registry.authorizedRegistrars(tokenFactory.address)).to.be.true;
    });

    it("Should emit RegistrarAuthorized event", async function () {
      await expect(registry.setAuthorizedRegistrar(tokenFactory.address, true))
        .to.emit(registry, "RegistrarAuthorized")
        .withArgs(tokenFactory.address, true);
    });

    it("Should prevent non-owner from authorizing", async function () {
      await expect(
        registry.connect(user1).setAuthorizedRegistrar(tokenFactory.address, true)
      ).to.be.reverted;
    });

    it("Should prevent zero address authorization", async function () {
      await expect(
        registry.setAuthorizedRegistrar(ethers.ZeroAddress, true)
      ).to.be.revertedWith("LiraTokenRegistry: zero address");
    });
  });

  describe("Token Registration", function () {
    beforeEach(async function () {
      await registry.setAuthorizedRegistrar(tokenFactory.address, true);
    });

    it("Should register a PROJECT token", async function () {
      await expect(
        registry.connect(tokenFactory).registerToken(
          mockToken1.address,
          user1.address,
          0 // TokenType.PROJECT
        )
      ).to.emit(registry, "TokenRegistered")
        .withArgs(mockToken1.address, user1.address, 0, await ethers.provider.getBlockNumber() + 1);
    });

    it("Should register a USER token", async function () {
      await registry.connect(tokenFactory).registerToken(
        mockToken1.address,
        user1.address,
        1 // TokenType.USER
      );

      const info = await registry.getTokenInfo(mockToken1.address);
      expect(info.tokenType).to.equal(1);
    });

    it("Should register a SOCIAL token", async function () {
      await registry.connect(tokenFactory).registerToken(
        mockToken1.address,
        user1.address,
        2 // TokenType.SOCIAL
      );

      const info = await registry.getTokenInfo(mockToken1.address);
      expect(info.tokenType).to.equal(2);
    });

    it("Should track token count correctly", async function () {
      await registry.connect(tokenFactory).registerToken(
        mockToken1.address,
        user1.address,
        0
      );
      expect(await registry.getTotalTokens()).to.equal(1);

      await registry.connect(tokenFactory).registerToken(
        mockToken2.address,
        user1.address,
        0
      );
      expect(await registry.getTotalTokens()).to.equal(2);
    });

    it("Should prevent duplicate registration", async function () {
      await registry.connect(tokenFactory).registerToken(
        mockToken1.address,
        user1.address,
        0
      );

      await expect(
        registry.connect(tokenFactory).registerToken(
          mockToken1.address,
          user1.address,
          0
        )
      ).to.be.revertedWith("LiraTokenRegistry: already registered");
    });

    it("Should prevent unauthorized registration", async function () {
      await expect(
        registry.connect(user1).registerToken(
          mockToken1.address,
          user1.address,
          0
        )
      ).to.be.revertedWith("LiraTokenRegistry: unauthorized");
    });

    it("Should prevent zero address token registration", async function () {
      await expect(
        registry.connect(tokenFactory).registerToken(
          ethers.ZeroAddress,
          user1.address,
          0
        )
      ).to.be.revertedWith("LiraTokenRegistry: zero address");
    });

    it("Should prevent zero address owner registration", async function () {
      await expect(
        registry.connect(tokenFactory).registerToken(
          mockToken1.address,
          ethers.ZeroAddress,
          0
        )
      ).to.be.revertedWith("LiraTokenRegistry: zero owner");
    });
  });

  describe("Token Queries", function () {
    beforeEach(async function () {
      await registry.setAuthorizedRegistrar(tokenFactory.address, true);
      await registry.connect(tokenFactory).registerToken(
        mockToken1.address,
        user1.address,
        0
      );
      await registry.connect(tokenFactory).registerToken(
        mockToken2.address,
        user2.address,
        1
      );
    });

    it("Should check if token is LIRA subtoken", async function () {
      expect(await registry.isLiraSubtoken(mockToken1.address)).to.be.true;
      expect(await registry.isLiraSubtoken(user1.address)).to.be.false;
    });

    it("Should get tokens by owner", async function () {
      const user1Tokens = await registry.getSubtokensByOwner(user1.address);
      expect(user1Tokens.length).to.equal(1);
      expect(user1Tokens[0]).to.equal(mockToken1.address);
    });

    it("Should get tokens by type", async function () {
      const projectTokens = await registry.getTokensByType(0);
      expect(projectTokens.length).to.equal(1);
      expect(projectTokens[0]).to.equal(mockToken1.address);

      const userTokens = await registry.getTokensByType(1);
      expect(userTokens.length).to.equal(1);
      expect(userTokens[0]).to.equal(mockToken2.address);
    });

    it("Should get token info", async function () {
      const info = await registry.getTokenInfo(mockToken1.address);
      expect(info.tokenAddress).to.equal(mockToken1.address);
      expect(info.owner).to.equal(user1.address);
      expect(info.tokenType).to.equal(0);
      expect(info.isActive).to.be.true;
    });

    it("Should get token at index", async function () {
      expect(await registry.getTokenAt(0)).to.equal(mockToken1.address);
      expect(await registry.getTokenAt(1)).to.equal(mockToken2.address);
    });

    it("Should revert on invalid index", async function () {
      await expect(
        registry.getTokenAt(10)
      ).to.be.revertedWith("LiraTokenRegistry: index out of bounds");
    });
  });

  describe("Token Deregistration", function () {
    beforeEach(async function () {
      await registry.setAuthorizedRegistrar(tokenFactory.address, true);
      await registry.connect(tokenFactory).registerToken(
        mockToken1.address,
        user1.address,
        0
      );
    });

    it("Should deregister a token", async function () {
      await expect(registry.deregisterToken(mockToken1.address))
        .to.emit(registry, "TokenDeregistered")
        .withArgs(mockToken1.address, await ethers.provider.getBlockNumber() + 1);

      expect(await registry.isLiraSubtoken(mockToken1.address)).to.be.false;
    });

    it("Should prevent non-owner from deregistering", async function () {
      await expect(
        registry.connect(user1).deregisterToken(mockToken1.address)
      ).to.be.reverted;
    });

    it("Should prevent deregistering non-existent token", async function () {
      await expect(
        registry.deregisterToken(user1.address)
      ).to.be.revertedWith("LiraTokenRegistry: not registered");
    });
  });

  describe("Token Ownership Transfer", function () {
    beforeEach(async function () {
      await registry.setAuthorizedRegistrar(tokenFactory.address, true);
      await registry.connect(tokenFactory).registerToken(
        mockToken1.address,
        user1.address,
        0
      );
    });

    it("Should transfer token ownership", async function () {
      await expect(
        registry.connect(user1).transferTokenOwnership(
          mockToken1.address,
          user2.address
        )
      ).to.emit(registry, "TokenOwnershipTransferred")
        .withArgs(mockToken1.address, user1.address, user2.address);

      const info = await registry.getTokenInfo(mockToken1.address);
      expect(info.owner).to.equal(user2.address);
    });

    it("Should update owner mappings on transfer", async function () {
      await registry.connect(user1).transferTokenOwnership(
        mockToken1.address,
        user2.address
      );

      const user1Tokens = await registry.getSubtokensByOwner(user1.address);
      const user2Tokens = await registry.getSubtokensByOwner(user2.address);
      
      expect(user1Tokens.length).to.equal(0);
      expect(user2Tokens.length).to.equal(1);
      expect(user2Tokens[0]).to.equal(mockToken1.address);
    });

    it("Should prevent non-owner from transferring", async function () {
      await expect(
        registry.connect(user2).transferTokenOwnership(
          mockToken1.address,
          user2.address
        )
      ).to.be.revertedWith("LiraTokenRegistry: not token owner");
    });

    it("Should prevent transfer to zero address", async function () {
      await expect(
        registry.connect(user1).transferTokenOwnership(
          mockToken1.address,
          ethers.ZeroAddress
        )
      ).to.be.revertedWith("LiraTokenRegistry: zero address");
    });
  });
});
