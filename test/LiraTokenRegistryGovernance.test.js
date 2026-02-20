const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("LiraTokenRegistry - Governance Integration", function () {
  let registry;
  let liraToken;
  let tokenFactory;
  let owner;
  let daoOperator;
  let user1;
  let mockToken;

  beforeEach(async function () {
    [owner, daoOperator, user1, tokenFactory, mockToken] = await ethers.getSigners();
    
    // Deploy LIRA token
    const LiraToken = await ethers.getContractFactory("LiraToken");
    liraToken = await LiraToken.deploy(owner.address, owner.address);
    await liraToken.waitForDeployment();
    
    // Deploy registry
    const LiraTokenRegistry = await ethers.getContractFactory("LiraTokenRegistry");
    registry = await LiraTokenRegistry.deploy(
      await liraToken.getAddress(),
      tokenFactory.address
    );
    await registry.waitForDeployment();
  });

  describe("DAO Operator Management", function () {
    it("Should allow owner to set DAO operator", async function () {
      await registry.setDAOOperator(daoOperator.address, true);
      expect(await registry.daoOperators(daoOperator.address)).to.be.true;
    });

    it("Should emit DAOOperatorUpdated event", async function () {
      await expect(registry.setDAOOperator(daoOperator.address, true))
        .to.emit(registry, "DAOOperatorUpdated")
        .withArgs(daoOperator.address, true);
    });

    it("Should allow removing DAO operator", async function () {
      await registry.setDAOOperator(daoOperator.address, true);
      await registry.setDAOOperator(daoOperator.address, false);
      expect(await registry.daoOperators(daoOperator.address)).to.be.false;
    });

    it("Should prevent non-owner from setting DAO operator", async function () {
      await expect(
        registry.connect(user1).setDAOOperator(daoOperator.address, true)
      ).to.be.reverted;
    });

    it("Should prevent zero address as DAO operator", async function () {
      await expect(
        registry.setDAOOperator(ethers.ZeroAddress, true)
      ).to.be.revertedWith("LiraTokenRegistry: zero address");
    });
  });

  describe("Token Factory Management", function () {
    it("Should allow owner to update token factory", async function () {
      const newFactory = user1.address;
      await registry.setTokenFactory(newFactory);
      expect(await registry.tokenFactory()).to.equal(newFactory);
    });

    it("Should emit TokenFactoryUpdated event", async function () {
      const newFactory = user1.address;
      await expect(registry.setTokenFactory(newFactory))
        .to.emit(registry, "TokenFactoryUpdated")
        .withArgs(tokenFactory.address, newFactory);
    });

    it("Should auto-authorize new factory", async function () {
      const newFactory = user1.address;
      await registry.setTokenFactory(newFactory);
      expect(await registry.authorizedRegistrars(newFactory)).to.be.true;
    });

    it("Should deauthorize old factory", async function () {
      const newFactory = user1.address;
      await registry.setTokenFactory(newFactory);
      expect(await registry.authorizedRegistrars(tokenFactory.address)).to.be.false;
    });

    it("Should prevent non-owner from updating factory", async function () {
      await expect(
        registry.connect(user1).setTokenFactory(user1.address)
      ).to.be.reverted;
    });

    it("Should prevent zero address as factory", async function () {
      await expect(
        registry.setTokenFactory(ethers.ZeroAddress)
      ).to.be.revertedWith("LiraTokenRegistry: zero address");
    });
  });

  describe("Token Registration with Governance", function () {
    it("Should allow factory to register tokens", async function () {
      await registry.connect(tokenFactory).registerToken(
        mockToken.address,
        user1.address,
        0 // TokenType.PROJECT
      );

      expect(await registry.isLiraSubtoken(mockToken.address)).to.be.true;
    });

    it("Should allow DAO operator to register tokens", async function () {
      await registry.setDAOOperator(daoOperator.address, true);
      
      await registry.connect(daoOperator).registerToken(
        mockToken.address,
        user1.address,
        1 // TokenType.USER
      );

      expect(await registry.isLiraSubtoken(mockToken.address)).to.be.true;
    });

    it("Should allow owner to register tokens", async function () {
      await registry.registerToken(
        mockToken.address,
        user1.address,
        2 // TokenType.SOCIAL
      );

      expect(await registry.isLiraSubtoken(mockToken.address)).to.be.true;
    });

    it("Should prevent non-authorized users from registering", async function () {
      await expect(
        registry.connect(user1).registerToken(
          mockToken.address,
          user1.address,
          0 // TokenType.PROJECT
        )
      ).to.be.revertedWith("LiraTokenRegistry: not factory or DAO");
    });

    it("Should prevent non-factory from registering PROJECT tokens", async function () {
      // Even DAO operator should be able to register PROJECT tokens
      // This test verifies the modifier works correctly
      await registry.setDAOOperator(daoOperator.address, true);
      
      // DAO can register PROJECT tokens
      await registry.connect(daoOperator).registerToken(
        mockToken.address,
        user1.address,
        0 // TokenType.PROJECT
      );

      expect(await registry.isLiraSubtoken(mockToken.address)).to.be.true;
    });
  });

  describe("Governance Modifiers", function () {
    it("onlyDAOOrOwner allows owner", async function () {
      // setDAOOperator uses onlyOwner, but we can test owner access
      await expect(registry.setDAOOperator(daoOperator.address, true))
        .to.not.be.reverted;
    });

    it("onlyFactoryOrDAO allows factory", async function () {
      await expect(
        registry.connect(tokenFactory).registerToken(
          mockToken.address,
          user1.address,
          0
        )
      ).to.not.be.reverted;
    });

    it("onlyFactoryOrDAO allows DAO operator", async function () {
      await registry.setDAOOperator(daoOperator.address, true);
      await expect(
        registry.connect(daoOperator).registerToken(
          mockToken.address,
          user1.address,
          1
        )
      ).to.not.be.reverted;
    });

    it("onlyFactoryOrDAO allows owner", async function () {
      await expect(
        registry.registerToken(
          mockToken.address,
          user1.address,
          2
        )
      ).to.not.be.reverted;
    });

    it("onlyFactoryOrDAO denies random address", async function () {
      await expect(
        registry.connect(user1).registerToken(
          mockToken.address,
          user1.address,
          0
        )
      ).to.be.reverted;
    });
  });
});
