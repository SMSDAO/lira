const { ethers } = require("hardhat");

/**
 * Deploy script for Token Factories
 * Includes TokenLaunchFactory and LiraUserTokenFactory
 */
async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying Token Factories with account:", deployer.address);

  // Configuration
  const LIRA_TOKEN_ADDRESS = process.env.LIRA_TOKEN_ADDRESS;
  const REGISTRY_ADDRESS = process.env.REGISTRY_ADDRESS;
  const FEE_COLLECTOR_ADDRESS = process.env.FEE_COLLECTOR_ADDRESS || deployer.address;

  if (!LIRA_TOKEN_ADDRESS) {
    throw new Error("LIRA_TOKEN_ADDRESS environment variable required");
  }
  if (!REGISTRY_ADDRESS) {
    throw new Error("REGISTRY_ADDRESS environment variable required");
  }

  console.log("\nDeployment Configuration:");
  console.log("LIRA Token:", LIRA_TOKEN_ADDRESS);
  console.log("Registry:", REGISTRY_ADDRESS);
  console.log("Fee Collector:", FEE_COLLECTOR_ADDRESS);

  // Deploy TokenLaunchFactory
  console.log("\n1. Deploying TokenLaunchFactory...");
  const TokenLaunchFactory = await ethers.getContractFactory("TokenLaunchFactory");
  const tokenFactory = await TokenLaunchFactory.deploy(
    LIRA_TOKEN_ADDRESS,
    FEE_COLLECTOR_ADDRESS,
    REGISTRY_ADDRESS
  );
  await tokenFactory.waitForDeployment();
  const tokenFactoryAddress = await tokenFactory.getAddress();
  console.log("✅ TokenLaunchFactory deployed to:", tokenFactoryAddress);
  console.log("Launch fee:", ethers.formatEther(await tokenFactory.launchFee()), "ETH");

  // Update registry to use this factory
  console.log("\n2. Updating registry with factory address...");
  const registry = await ethers.getContractAt("LiraTokenRegistry", REGISTRY_ADDRESS);
  const updateTx = await registry.setTokenFactory(tokenFactoryAddress);
  await updateTx.wait();
  console.log("✅ Registry updated with TokenLaunchFactory address");

  // Deploy LiraUserTokenFactory
  console.log("\n3. Deploying LiraUserTokenFactory...");
  const LiraUserTokenFactory = await ethers.getContractFactory("LiraUserTokenFactory");
  const userFactory = await LiraUserTokenFactory.deploy(
    LIRA_TOKEN_ADDRESS,
    REGISTRY_ADDRESS
  );
  await userFactory.waitForDeployment();
  const userFactoryAddress = await userFactory.getAddress();
  console.log("✅ LiraUserTokenFactory deployed to:", userFactoryAddress);
  console.log("Min LIRA required:", ethers.formatEther(await userFactory.minLiraRequired()), "LIRA");

  // Authorize user factory in registry
  console.log("\n4. Authorizing LiraUserTokenFactory in registry...");
  const authTx = await registry.setAuthorizedRegistrar(userFactoryAddress, true);
  await authTx.wait();
  console.log("✅ LiraUserTokenFactory authorized in registry");

  // Save deployment info
  const deployment = {
    network: (await ethers.provider.getNetwork()).name,
    tokenLaunchFactory: tokenFactoryAddress,
    liraUserTokenFactory: userFactoryAddress,
    liraToken: LIRA_TOKEN_ADDRESS,
    registry: REGISTRY_ADDRESS,
    feeCollector: FEE_COLLECTOR_ADDRESS,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
  };

  console.log("\n📝 Deployment Info:", JSON.stringify(deployment, null, 2));

  console.log("\n✨ All factories deployed and configured!");
  console.log("\nFactory Capabilities:");
  console.log("- TokenLaunchFactory: Launch PROJECT tokens with bonding curves");
  console.log("- LiraUserTokenFactory: Create USER/SOCIAL tokens (requires 1000 LIRA)");
  console.log("\nAll tokens auto-register in LiraTokenRegistry upon creation.");

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
