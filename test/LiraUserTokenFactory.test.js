const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("LiraUserTokenFactory", function () {
  let factory;
  let registry;
  let liraToken;
  let owner;
  let user1;
  let user2;
  let daoOperator;

  beforeEach(async function () {
    [owner, user1, user2, daoOperator] = await ethers.getSigners();
    
    // Deploy LIRA token
    const LiraToken = await ethers.getContractFactory("LiraToken");
    liraToken = await LiraToken.deploy(owner.address, owner.address);
    await liraToken.waitForDeployment();
    
    // Deploy registry
    const LiraTokenRegistry = await ethers.getContractFactory("LiraTokenRegistry");
    registry = await LiraTokenRegistry.deploy(
      await liraToken.getAddress(),
      owner.address // Temporary factory
    );
    await registry.waitForDeployment();
    
    // Deploy user token factory
    const LiraUserTokenFactory = await ethers.getContractFactory("LiraUserTokenFactory");
    factory = await LiraUserTokenFactory.deploy(
      await liraToken.getAddress(),
      await registry.getAddress()
    );
    await factory.waitForDeployment();
    
    // Authorize factory in registry
    await registry.setAuthorizedRegistrar(await factory.getAddress(), true);
    
    // Transfer LIRA to user1 (more than minimum)
    await liraToken.transfer(user1.address, ethers.parseEther("2000"));
  });

  describe("Deployment", function () {
    it("Should set the LIRA token address", async function () {
      expect(await factory.liraToken()).to.equal(await liraToken.getAddress());
    });

    it("Should set the registry address", async function () {
      expect(await factory.registry()).to.equal(await registry.getAddress());
    });

    it("Should set default minimum LIRA requirement", async function () {
      expect(await factory.minLiraRequired()).to.equal(ethers.parseEther("1000"));
    });
  });

  describe("DAO Operator Management", function () {
    it("Should allow owner to set DAO operator", async function () {
      await factory.setDAOOperator(daoOperator.address, true);
      expect(await factory.daoOperators(daoOperator.address)).to.be.true;
    });

    it("Should emit DAOOperatorUpdated event", async function () {
      await expect(factory.setDAOOperator(daoOperator.address, true))
        .to.emit(factory, "DAOOperatorUpdated")
        .withArgs(daoOperator.address, true);
    });

    it("Should allow removing DAO operator", async function () {
      await factory.setDAOOperator(daoOperator.address, true);
      await factory.setDAOOperator(daoOperator.address, false);
      expect(await factory.daoOperators(daoOperator.address)).to.be.false;
    });

    it("Should prevent non-owner from setting DAO operator", async function () {
      await expect(
        factory.connect(user1).setDAOOperator(daoOperator.address, true)
      ).to.be.reverted;
    });
  });

  describe("Minimum LIRA Requirement", function () {
    it("Should allow owner to update minimum LIRA required", async function () {
      const newMin = ethers.parseEther("500");
      await factory.setMinLiraRequired(newMin);
      expect(await factory.minLiraRequired()).to.equal(newMin);
    });

    it("Should emit MinLiraRequiredUpdated event", async function () {
      const newMin = ethers.parseEther("500");
      await expect(factory.setMinLiraRequired(newMin))
        .to.emit(factory, "MinLiraRequiredUpdated")
        .withArgs(newMin);
    });

    it("Should prevent non-owner from updating minimum", async function () {
      await expect(
        factory.connect(user1).setMinLiraRequired(ethers.parseEther("500"))
      ).to.be.reverted;
    });
  });

  describe("Reputation Token Creation", function () {
    it("Should allow LIRA holder to create reputation token", async function () {
      const tx = await factory.connect(user1).createReputationToken(
        "User Reputation",
        "REP",
        "ipfs://metadata"
      );
      
      await expect(tx).to.emit(factory, "ReputationTokenCreated");
      
      const tokens = await factory.getCreatorTokens(user1.address);
      expect(tokens.length).to.equal(1);
    });

    it("Should register token in registry as USER type", async function () {
      const tx = await factory.connect(user1).createReputationToken(
        "User Reputation",
        "REP",
        "ipfs://metadata"
      );
      
      const receipt = await tx.wait();
      const event = receipt.logs.find(
        log => log.fragment && log.fragment.name === "ReputationTokenCreated"
      );
      const tokenAddress = event.args[0];
      
      const tokenInfo = await registry.getTokenInfo(tokenAddress);
      expect(tokenInfo.tokenType).to.equal(1); // USER
      expect(tokenInfo.owner).to.equal(user1.address);
    });

    it("Should prevent non-LIRA holder from creating", async function () {
      await expect(
        factory.connect(user2).createReputationToken(
          "User Reputation",
          "REP",
          "ipfs://metadata"
        )
      ).to.be.revertedWith("LiraUserTokenFactory: insufficient LIRA or not authorized");
    });

    it("Should allow DAO operator to create without LIRA", async function () {
      await factory.setDAOOperator(user2.address, true);
      
      await expect(
        factory.connect(user2).createReputationToken(
          "DAO Reputation",
          "DAOREP",
          "ipfs://metadata"
        )
      ).to.emit(factory, "ReputationTokenCreated");
    });

    it("Should allow owner to create without LIRA requirement", async function () {
      await expect(
        factory.createReputationToken(
          "Owner Reputation",
          "OREP",
          "ipfs://metadata"
        )
      ).to.emit(factory, "ReputationTokenCreated");
    });
  });

  describe("Social Token Creation", function () {
    it("Should allow LIRA holder to create social token", async function () {
      const tx = await factory.connect(user1).createSocialToken(
        "Social Token",
        "SOCIAL",
        ethers.parseEther("1000000"),
        ethers.parseEther("10000000"),
        "ipfs://metadata"
      );
      
      await expect(tx).to.emit(factory, "SocialTokenCreated");
    });

    it("Should register token in registry as SOCIAL type", async function () {
      const tx = await factory.connect(user1).createSocialToken(
        "Social Token",
        "SOCIAL",
        ethers.parseEther("1000000"),
        0, // unlimited
        "ipfs://metadata"
      );
      
      const receipt = await tx.wait();
      const event = receipt.logs.find(
        log => log.fragment && log.fragment.name === "SocialTokenCreated"
      );
      const tokenAddress = event.args[0];
      
      const tokenInfo = await registry.getTokenInfo(tokenAddress);
      expect(tokenInfo.tokenType).to.equal(2); // SOCIAL
    });

    it("Should prevent non-LIRA holder from creating", async function () {
      await expect(
        factory.connect(user2).createSocialToken(
          "Social Token",
          "SOCIAL",
          ethers.parseEther("1000000"),
          0,
          "ipfs://metadata"
        )
      ).to.be.revertedWith("LiraUserTokenFactory: insufficient LIRA or not authorized");
    });
  });

  describe("Access Token Creation", function () {
    it("Should allow LIRA holder to create access token", async function () {
      const tx = await factory.connect(user1).createAccessToken(
        "Access Token",
        "ACCESS",
        ethers.parseEther("1000"),
        ethers.parseEther("10000"),
        "ipfs://metadata",
        false // transfers disabled initially
      );
      
      await expect(tx).to.emit(factory, "AccessTokenCreated");
    });

    it("Should register token in registry as USER type", async function () {
      const tx = await factory.connect(user1).createAccessToken(
        "Access Token",
        "ACCESS",
        ethers.parseEther("1000"),
        0,
        "ipfs://metadata",
        true
      );
      
      const receipt = await tx.wait();
      const event = receipt.logs.find(
        log => log.fragment && log.fragment.name === "AccessTokenCreated"
      );
      const tokenAddress = event.args[0];
      
      const tokenInfo = await registry.getTokenInfo(tokenAddress);
      expect(tokenInfo.tokenType).to.equal(1); // USER
    });

    it("Should prevent non-LIRA holder from creating", async function () {
      await expect(
        factory.connect(user2).createAccessToken(
          "Access Token",
          "ACCESS",
          ethers.parseEther("1000"),
          0,
          "ipfs://metadata",
          false
        )
      ).to.be.revertedWith("LiraUserTokenFactory: insufficient LIRA or not authorized");
    });
  });

  describe("Token Tracking", function () {
    it("Should track all tokens by creator", async function () {
      await factory.connect(user1).createReputationToken("REP", "REP", "ipfs://1");
      await factory.connect(user1).createSocialToken("SOC", "SOC", 1000, 0, "ipfs://2");
      await factory.connect(user1).createAccessToken("ACC", "ACC", 100, 0, "ipfs://3", false);
      
      const tokens = await factory.getCreatorTokens(user1.address);
      expect(tokens.length).to.equal(3);
    });

    it("Should track total deployed tokens", async function () {
      await factory.connect(user1).createReputationToken("REP", "REP", "ipfs://1");
      await factory.connect(user1).createSocialToken("SOC", "SOC", 1000, 0, "ipfs://2");
      
      expect(await factory.getTotalDeployedTokens()).to.equal(2);
    });

    it("Should get deployed token at index", async function () {
      const tx = await factory.connect(user1).createReputationToken("REP", "REP", "ipfs://1");
      const receipt = await tx.wait();
      const event = receipt.logs.find(
        log => log.fragment && log.fragment.name === "ReputationTokenCreated"
      );
      const tokenAddress = event.args[0];
      
      expect(await factory.getDeployedTokenAt(0)).to.equal(tokenAddress);
    });

    it("Should revert on invalid index", async function () {
      await expect(
        factory.getDeployedTokenAt(0)
      ).to.be.revertedWith("Index out of bounds");
    });
  });
});
