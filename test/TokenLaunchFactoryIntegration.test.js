const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("TokenLaunchFactory - Registry Integration", function () {
  let factory;
  let registry;
  let liraToken;
  let owner;
  let user1;
  let feeCollector;

  beforeEach(async function () {
    [owner, user1, feeCollector] = await ethers.getSigners();
    
    // Deploy LIRA token
    const LiraToken = await ethers.getContractFactory("LiraToken");
    liraToken = await LiraToken.deploy(owner.address, feeCollector.address);
    await liraToken.waitForDeployment();
    
    // Deploy registry (we'll use owner as temporary factory)
    const LiraTokenRegistry = await ethers.getContractFactory("LiraTokenRegistry");
    registry = await LiraTokenRegistry.deploy(
      await liraToken.getAddress(),
      owner.address // Temporary, will update after factory deployment
    );
    await registry.waitForDeployment();
    
    // Deploy factory
    const TokenLaunchFactory = await ethers.getContractFactory("TokenLaunchFactory");
    factory = await TokenLaunchFactory.deploy(
      await liraToken.getAddress(),
      feeCollector.address,
      await registry.getAddress()
    );
    await factory.waitForDeployment();
    
    // Update registry to use actual factory
    await registry.setTokenFactory(await factory.getAddress());
  });

  describe("Factory Deployment", function () {
    it("Should set the registry address", async function () {
      expect(await factory.registry()).to.equal(await registry.getAddress());
    });

    it("Should be authorized in registry", async function () {
      expect(await registry.authorizedRegistrars(await factory.getAddress())).to.be.true;
    });
  });

  describe("Token Launch with Auto-Registration", function () {
    const LAUNCH_FEE = ethers.parseEther("0.01");
    
    it("Should launch token and auto-register in registry", async function () {
      const tx = await factory.connect(user1).launchToken(
        "Test Token",
        "TEST",
        ethers.parseEther("1000000"),
        { value: LAUNCH_FEE }
      );
      
      const receipt = await tx.wait();
      const event = receipt.logs.find(
        log => log.fragment && log.fragment.name === "TokenLaunched"
      );
      
      const tokenAddress = event.args[0];
      
      // Verify token is registered
      expect(await registry.isLiraSubtoken(tokenAddress)).to.be.true;
      
      // Verify token info
      const tokenInfo = await registry.getTokenInfo(tokenAddress);
      expect(tokenInfo.owner).to.equal(user1.address);
      expect(tokenInfo.tokenType).to.equal(0); // PROJECT
      expect(tokenInfo.isActive).to.be.true;
    });

    it("Should emit TokenRegistered event", async function () {
      await expect(
        factory.connect(user1).launchToken(
          "Test Token",
          "TEST",
          ethers.parseEther("1000000"),
          { value: LAUNCH_FEE }
        )
      ).to.emit(factory, "TokenRegistered");
    });

    it("Should track token in registry by owner", async function () {
      const tx = await factory.connect(user1).launchToken(
        "Test Token",
        "TEST",
        ethers.parseEther("1000000"),
        { value: LAUNCH_FEE }
      );
      
      const receipt = await tx.wait();
      const event = receipt.logs.find(
        log => log.fragment && log.fragment.name === "TokenLaunched"
      );
      const tokenAddress = event.args[0];
      
      const userTokens = await registry.getSubtokensByOwner(user1.address);
      expect(userTokens.length).to.equal(1);
      expect(userTokens[0]).to.equal(tokenAddress);
    });

    it("Should track token in registry by type (PROJECT)", async function () {
      const tx = await factory.connect(user1).launchToken(
        "Test Token",
        "TEST",
        ethers.parseEther("1000000"),
        { value: LAUNCH_FEE }
      );
      
      const receipt = await tx.wait();
      const event = receipt.logs.find(
        log => log.fragment && log.fragment.name === "TokenLaunched"
      );
      const tokenAddress = event.args[0];
      
      const projectTokens = await registry.getTokensByType(0); // PROJECT
      expect(projectTokens.length).to.equal(1);
      expect(projectTokens[0]).to.equal(tokenAddress);
    });

    it("Should register multiple tokens from same user", async function () {
      // Launch first token
      await factory.connect(user1).launchToken(
        "Token One",
        "TK1",
        ethers.parseEther("1000000"),
        { value: LAUNCH_FEE }
      );
      
      // Launch second token
      await factory.connect(user1).launchToken(
        "Token Two",
        "TK2",
        ethers.parseEther("1000000"),
        { value: LAUNCH_FEE }
      );
      
      const userTokens = await registry.getSubtokensByOwner(user1.address);
      expect(userTokens.length).to.equal(2);
    });

    it("Should increment total token count in registry", async function () {
      expect(await registry.getTotalTokens()).to.equal(0);
      
      await factory.connect(user1).launchToken(
        "Test Token",
        "TEST",
        ethers.parseEther("1000000"),
        { value: LAUNCH_FEE }
      );
      
      expect(await registry.getTotalTokens()).to.equal(1);
    });
  });

  describe("Registry Integration Security", function () {
    it("Should only allow factory to register PROJECT tokens", async function () {
      const mockTokenAddress = user1.address; // Using address as mock
      
      // Random user cannot register PROJECT tokens
      await expect(
        registry.connect(user1).registerToken(
          mockTokenAddress,
          user1.address,
          0 // PROJECT
        )
      ).to.be.revertedWith("LiraTokenRegistry: not factory or DAO");
    });

    it("Should allow DAO to register PROJECT tokens", async function () {
      const mockTokenAddress = user1.address;
      
      // Set user1 as DAO operator
      await registry.setDAOOperator(user1.address, true);
      
      // Now user1 can register
      await registry.connect(user1).registerToken(
        mockTokenAddress,
        user1.address,
        0 // PROJECT
      );
      
      expect(await registry.isLiraSubtoken(mockTokenAddress)).to.be.true;
    });
  });
});
