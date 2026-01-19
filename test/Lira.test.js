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

    it("Should prevent minting beyond max supply", async function () {
      await liraToken.setMinter(user1.address, true);
      const maxSupply = await liraToken.MAX_SUPPLY();
      const totalSupply = await liraToken.totalSupply();
      const amountToMint = maxSupply - totalSupply + ethers.parseEther("1");
      
      await expect(
        liraToken.connect(user1).mint(user2.address, amountToMint)
      ).to.be.revertedWith("Exceeds max supply");
    });

    it("Should allow owner to remove minters", async function () {
      await liraToken.setMinter(user1.address, true);
      await liraToken.setMinter(user1.address, false);
      expect(await liraToken.minters(user1.address)).to.equal(false);
    });

    it("Should not allow non-owner to set minters", async function () {
      await expect(
        liraToken.connect(user1).setMinter(user2.address, true)
      ).to.be.revertedWithCustomError(liraToken, "OwnableUnauthorizedAccount");
    });

    it("Should transfer tokens correctly", async function () {
      const amount = ethers.parseEther("100");
      await liraToken.transfer(user1.address, amount);
      expect(await liraToken.balanceOf(user1.address)).to.equal(amount);
    });

    it("Should allow burning from approved allowance", async function () {
      const amount = ethers.parseEther("100");
      await liraToken.transfer(user1.address, amount);
      await liraToken.connect(user1).approve(owner.address, amount);
      await liraToken.burnFrom(user1.address, amount);
      expect(await liraToken.balanceOf(user1.address)).to.equal(0);
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

    it("Should set correct token owner after launch", async function () {
      const launchFee = await tokenFactory.launchFee();
      const tx = await tokenFactory.connect(user1).launchToken(
        "TestToken",
        "TEST",
        ethers.parseEther("1000000"),
        { value: launchFee }
      );
      const receipt = await tx.wait();
      
      const event = receipt.logs.find(log => {
        try {
          return tokenFactory.interface.parseLog(log).name === "TokenLaunched";
        } catch {
          return false;
        }
      });
      
      expect(event).to.not.be.undefined;
    });

    it("Should allow owner to update launch fee", async function () {
      const newFee = ethers.parseEther("0.5");
      await tokenFactory.setLaunchFee(newFee);
      expect(await tokenFactory.launchFee()).to.equal(newFee);
    });

    it("Should not allow non-owner to update launch fee", async function () {
      const newFee = ethers.parseEther("0.5");
      await expect(
        tokenFactory.connect(user1).setLaunchFee(newFee)
      ).to.be.revertedWithCustomError(tokenFactory, "OwnableUnauthorizedAccount");
    });

    it("Should allow owner to withdraw fees", async function () {
      const launchFee = await tokenFactory.launchFee();
      await tokenFactory.connect(user1).launchToken(
        "TestToken",
        "TEST",
        ethers.parseEther("1000000"),
        { value: launchFee }
      );

      const balanceBefore = await ethers.provider.getBalance(owner.address);
      const tx = await tokenFactory.withdrawFees();
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed * receipt.gasPrice;
      const balanceAfter = await ethers.provider.getBalance(owner.address);
      
      expect(balanceAfter + gasUsed - balanceBefore).to.equal(launchFee);
    });

    it("Should handle multiple token launches", async function () {
      const launchFee = await tokenFactory.launchFee();
      
      await tokenFactory.connect(user1).launchToken(
        "Token1",
        "TK1",
        ethers.parseEther("1000000"),
        { value: launchFee }
      );
      
      await tokenFactory.connect(user1).launchToken(
        "Token2",
        "TK2",
        ethers.parseEther("2000000"),
        { value: launchFee }
      );

      expect(await tokenFactory.getTotalLaunches()).to.equal(2);
      const launches = await tokenFactory.getCreatorLaunches(user1.address);
      expect(launches.length).to.equal(2);
    });

    it("Should reject empty token name", async function () {
      const launchFee = await tokenFactory.launchFee();
      await expect(
        tokenFactory.connect(user1).launchToken(
          "",
          "TEST",
          ethers.parseEther("1000000"),
          { value: launchFee }
        )
      ).to.be.revertedWith("Name cannot be empty");
    });

    it("Should reject empty token symbol", async function () {
      const launchFee = await tokenFactory.launchFee();
      await expect(
        tokenFactory.connect(user1).launchToken(
          "TestToken",
          "",
          ethers.parseEther("1000000"),
          { value: launchFee }
        )
      ).to.be.revertedWith("Symbol cannot be empty");
    });

    it("Should reject zero supply", async function () {
      const launchFee = await tokenFactory.launchFee();
      await expect(
        tokenFactory.connect(user1).launchToken(
          "TestToken",
          "TEST",
          0,
          { value: launchFee }
        )
      ).to.be.revertedWith("Supply must be greater than zero");
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
      ).to.be.revertedWithCustomError(agentExecutor, "EnforcedPause");
    });

    it("Should allow owner to unpause contract", async function () {
      await agentExecutor.pause();
      await agentExecutor.unpause();
      
      const agentFee = await agentExecutor.agentCreationFee();
      await agentExecutor.connect(user1).createAgent(
        "TestAgent",
        "GPT-4",
        ethers.keccak256(ethers.toUtf8Bytes("hash")),
        { value: agentFee }
      );

      const agent = await agentExecutor.getAgent(1);
      expect(agent.name).to.equal("TestAgent");
    });

    it("Should not allow non-owner to pause", async function () {
      await expect(
        agentExecutor.connect(user1).pause()
      ).to.be.revertedWithCustomError(agentExecutor, "OwnableUnauthorizedAccount");
    });

    it("Should reject agent creation with insufficient fee", async function () {
      await expect(
        agentExecutor.connect(user1).createAgent(
          "TestAgent",
          "GPT-4",
          ethers.keccak256(ethers.toUtf8Bytes("hash")),
          { value: 0 }
        )
      ).to.be.revertedWith("Insufficient creation fee");
    });

    it("Should reject agent execution with insufficient fee", async function () {
      const agentFee = await agentExecutor.agentCreationFee();
      await agentExecutor.connect(user1).createAgent(
        "TestAgent",
        "GPT-4",
        ethers.keccak256(ethers.toUtf8Bytes("hash")),
        { value: agentFee }
      );

      const inputHash = ethers.keccak256(ethers.toUtf8Bytes("test_input"));
      await expect(
        agentExecutor.connect(user2).executeAgent(1, inputHash, { value: 0 })
      ).to.be.revertedWith("Insufficient execution fee");
    });

    it("Should reject batch execution with mismatched arrays", async function () {
      const agentFee = await agentExecutor.agentCreationFee();
      await agentExecutor.connect(user1).createAgent(
        "Agent1",
        "GPT-4",
        ethers.keccak256(ethers.toUtf8Bytes("hash1")),
        { value: agentFee }
      );

      const execFee = await agentExecutor.executionFee();
      const inputHashes = [
        ethers.keccak256(ethers.toUtf8Bytes("input1")),
        ethers.keccak256(ethers.toUtf8Bytes("input2"))
      ];

      await expect(
        agentExecutor.connect(user2).executeAgentsBatch(
          [1],
          inputHashes,
          { value: execFee * BigInt(2) }
        )
      ).to.be.revertedWith("Array length mismatch");
    });

    it("Should allow owner to update fees", async function () {
      const newCreationFee = ethers.parseEther("0.5");
      const newExecutionFee = ethers.parseEther("0.05");
      
      await agentExecutor.setAgentCreationFee(newCreationFee);
      await agentExecutor.setExecutionFee(newExecutionFee);
      
      expect(await agentExecutor.agentCreationFee()).to.equal(newCreationFee);
      expect(await agentExecutor.executionFee()).to.equal(newExecutionFee);
    });

    it("Should allow owner to withdraw fees", async function () {
      const agentFee = await agentExecutor.agentCreationFee();
      await agentExecutor.connect(user1).createAgent(
        "TestAgent",
        "GPT-4",
        ethers.keccak256(ethers.toUtf8Bytes("hash")),
        { value: agentFee }
      );

      const balanceBefore = await ethers.provider.getBalance(owner.address);
      const tx = await agentExecutor.withdrawFees();
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed * receipt.gasPrice;
      const balanceAfter = await ethers.provider.getBalance(owner.address);
      
      expect(balanceAfter + gasUsed - balanceBefore).to.equal(agentFee);
    });

    it("Should track agent execution history", async function () {
      const agentFee = await agentExecutor.agentCreationFee();
      await agentExecutor.connect(user1).createAgent(
        "TestAgent",
        "GPT-4",
        ethers.keccak256(ethers.toUtf8Bytes("hash")),
        { value: agentFee }
      );

      const execFee = await agentExecutor.executionFee();
      const inputHash1 = ethers.keccak256(ethers.toUtf8Bytes("input1"));
      const inputHash2 = ethers.keccak256(ethers.toUtf8Bytes("input2"));
      
      await agentExecutor.connect(user2).executeAgent(1, inputHash1, { value: execFee });
      await agentExecutor.connect(user2).executeAgent(1, inputHash2, { value: execFee });

      const agent = await agentExecutor.getAgent(1);
      expect(agent.executionCount).to.equal(2);
    });

    it("Should reject execution of non-existent agent", async function () {
      const execFee = await agentExecutor.executionFee();
      const inputHash = ethers.keccak256(ethers.toUtf8Bytes("test_input"));
      
      await expect(
        agentExecutor.connect(user2).executeAgent(999, inputHash, { value: execFee })
      ).to.be.revertedWith("Agent does not exist");
    });
  });
});
