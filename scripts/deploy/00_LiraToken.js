const { ethers } = require("hardhat");

/**
 * Deploy script for LIRA main governance token
 * This is the canonical root token for the entire ecosystem
 */
async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying LiraToken with account:", deployer.address);
  console.log("Account balance:", (await ethers.provider.getBalance(deployer.address)).toString());

  // Configuration
  const TREASURY_ADDRESS = process.env.TREASURY_ADDRESS || deployer.address;
  const FEE_COLLECTOR_ADDRESS = process.env.FEE_COLLECTOR_ADDRESS || deployer.address;

  console.log("\nDeployment Configuration:");
  console.log("Treasury:", TREASURY_ADDRESS);
  console.log("Fee Collector:", FEE_COLLECTOR_ADDRESS);

  // Deploy LiraToken
  const LiraToken = await ethers.getContractFactory("LiraToken");
  const liraToken = await LiraToken.deploy(
    TREASURY_ADDRESS,
    FEE_COLLECTOR_ADDRESS
  );

  await liraToken.waitForDeployment();
  const liraAddress = await liraToken.getAddress();

  console.log("\n✅ LiraToken deployed to:", liraAddress);
  console.log("Initial supply:", ethers.formatEther(await liraToken.totalSupply()), "LIRA");
  console.log("Max supply:", ethers.formatEther(await liraToken.MAX_SUPPLY()), "LIRA");

  // Save deployment info
  const deployment = {
    network: (await ethers.provider.getNetwork()).name,
    liraToken: liraAddress,
    treasury: TREASURY_ADDRESS,
    feeCollector: FEE_COLLECTOR_ADDRESS,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
  };

  console.log("\n📝 Deployment Info:", JSON.stringify(deployment, null, 2));

  return deployment;
}

// Execute deployment
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = main;
