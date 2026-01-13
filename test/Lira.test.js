const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Lira Protocol Smart Contracts", function () {
  let liraToken, tokenFactory, agentExecutor;
  let owner, user1, user2;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    // Deploy LiraToken
    const LiraToken = await ethers.getContractFactory("LiraToken");
    liraToken = await LiraToken.deploy(owner.address, owner.address);
    await liraToken.waitForDeployment();

    // Deploy TokenLaunchFactory
    const TokenLaunchFactory = await ethers.getContractFactory("TokenLaunchFactory");
    tokenFactory = await TokenLaunchFactory.deploy(
      await liraToken.getAddress(),
      owner.address
    );
    await tokenFactory.waitForDeployment();

    // Deploy AgentExecutor
    const AgentExecutor = await ethers.getContractFactory("AgentExecutor");
    agentExecutor = await AgentExecutor.deploy(owner.address);
    await agentExecutor.waitForDeployment();
  });

  describe("LiraToken", function () {
    it("Should have correct initial supply", async function () {
      const totalSupply = await liraToken.totalSupply();
      expect(totalSupply).to.equal(ethers.parseEther("100000000"));
    });

    it("Should have correct name and symbol", async function () {
      expect(await liraToken.name()).to.equal("Lira");
      expect(await liraToken.symbol()).to.equal("LIRA");
    });

    it("Should allow owner to add minters", async function () {
      await liraToken.setMinter(user1.address, true);
      expect(await liraToken.minters(user1.address)).to.equal(true);
    });

    it("Should not allow non-minters to mint", async function () {
      await expect(
        liraToken.connect(user1).mint(user1.address, ethers.parseEther("1000"))
      ).to.be.revertedWith("Not authorized to mint");
    });

    it("Should allow minters to mint within max supply", async function () {
      await liraToken.setMinter(user1.address, true);
      await liraToken.connect(user1).mint(user2.address, ethers.parseEther("1000"));
      expect(await liraToken.balanceOf(user2.address)).to.equal(ethers.parseEther("1000"));
    });

    it("Should allow burning tokens", async function () {
      const initialBalance = await liraToken.balanceOf(owner.address);
      await liraToken.burn(ethers.parseEther("1000"));
      expect(await liraToken.balanceOf(owner.address)).to.equal(
        initialBalance - ethers.parseEther("1000")
      );
    });
  });

  describe("TokenLaunchFactory", function () {
    it("Should launch a new token", async function () {
      const launchFee = await tokenFactory.launchFee();
      await tokenFactory.connect(user1).launchToken(
        "TestToken",
        "TEST",
        ethers.parseEther("1000000"),
        { value: launchFee }
      );

      expect(await tokenFactory.getTotalLaunches()).to.equal(1);
    });

    it("Should track creator launches", async function () {
      const launchFee = await tokenFactory.launchFee();
      await tokenFactory.connect(user1).launchToken(
        "TestToken",
        "TEST",
        ethers.parseEther("1000000"),
        { value: launchFee }
      );

      const launches = await tokenFactory.getCreatorLaunches(user1.address);
      expect(launches.length).to.equal(1);
    });

    it("Should revert if insufficient fee", async function () {
      await expect(
        tokenFactory.connect(user1).launchToken(
          "TestToken",
          "TEST",
          ethers.parseEther("1000000"),
          { value: 0 }
        )
      ).to.be.revertedWith("Insufficient launch fee");
    });
  });

  describe("AgentExecutor", function () {
    it("Should create a new agent", async function () {
      const agentFee = await agentExecutor.agentCreationFee();
      await agentExecutor.connect(user1).createAgent(
        "TestAgent",
        "GPT-4",
        ethers.keccak256(ethers.toUtf8Bytes("model_hash")),
        { value: agentFee }
      );

      const agent = await agentExecutor.getAgent(1);
      expect(agent.name).to.equal("TestAgent");
      expect(agent.owner).to.equal(user1.address);
    });

    it("Should execute an agent", async function () {
      const agentFee = await agentExecutor.agentCreationFee();
      await agentExecutor.connect(user1).createAgent(
        "TestAgent",
        "GPT-4",
        ethers.keccak256(ethers.toUtf8Bytes("model_hash")),
        { value: agentFee }
      );

      const execFee = await agentExecutor.executionFee();
      const inputHash = ethers.keccak256(ethers.toUtf8Bytes("test_input"));
      await agentExecutor.connect(user2).executeAgent(1, inputHash, { value: execFee });

      const agent = await agentExecutor.getAgent(1);
      expect(agent.executionCount).to.equal(1);
    });

    it("Should execute multiple agents in batch", async function () {
      const agentFee = await agentExecutor.agentCreationFee();
      
      // Create two agents
      await agentExecutor.connect(user1).createAgent(
        "Agent1",
        "GPT-4",
        ethers.keccak256(ethers.toUtf8Bytes("hash1")),
        { value: agentFee }
      );
      await agentExecutor.connect(user1).createAgent(
        "Agent2",
        "Claude-3",
        ethers.keccak256(ethers.toUtf8Bytes("hash2")),
        { value: agentFee }
      );

      const execFee = await agentExecutor.executionFee();
      const inputHashes = [
        ethers.keccak256(ethers.toUtf8Bytes("input1")),
        ethers.keccak256(ethers.toUtf8Bytes("input2"))
      ];

      await agentExecutor.connect(user2).executeAgentsBatch(
        [1, 2],
        inputHashes,
        { value: execFee * BigInt(2) }
      );

      const agent1 = await agentExecutor.getAgent(1);
      const agent2 = await agentExecutor.getAgent(2);
      expect(agent1.executionCount).to.equal(1);
      expect(agent2.executionCount).to.equal(1);
    });

    it("Should allow owner to pause contract", async function () {
      await agentExecutor.pause();
      
      const agentFee = await agentExecutor.agentCreationFee();
      await expect(
        agentExecutor.connect(user1).createAgent(
          "TestAgent",
          "GPT-4",
          ethers.keccak256(ethers.toUtf8Bytes("hash")),
          { value: agentFee }
        )
      ).to.be.revertedWith("Pausable: paused");
    });
  });
});
