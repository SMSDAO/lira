const { ethers } = require("hardhat");

/**
 * Deploy script for LiraTokenRegistry
 * Central registry for all tokens in the LIRA ecosystem
 */
async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying LiraTokenRegistry with account:", deployer.address);

  // Configuration - these should be set from previous deployments
  const LIRA_TOKEN_ADDRESS = process.env.LIRA_TOKEN_ADDRESS;
  const TOKEN_FACTORY_ADDRESS = process.env.TOKEN_FACTORY_ADDRESS || deployer.address; // Temporary

  if (!LIRA_TOKEN_ADDRESS) {
    throw new Error("LIRA_TOKEN_ADDRESS environment variable required");
  }

  console.log("\nDeployment Configuration:");
  console.log("LIRA Token:", LIRA_TOKEN_ADDRESS);
  console.log("Token Factory (temp):", TOKEN_FACTORY_ADDRESS);

  // Deploy LiraTokenRegistry
  const LiraTokenRegistry = await ethers.getContractFactory("LiraTokenRegistry");
  const registry = await LiraTokenRegistry.deploy(
    LIRA_TOKEN_ADDRESS,
    TOKEN_FACTORY_ADDRESS
  );

  await registry.waitForDeployment();
  const registryAddress = await registry.getAddress();

  console.log("\n✅ LiraTokenRegistry deployed to:", registryAddress);
  console.log("LIRA Token set to:", await registry.liraToken());
  console.log("Token Factory set to:", await registry.tokenFactory());

  // Verify factory is authorized
  console.log("Factory authorized:", await registry.authorizedRegistrars(TOKEN_FACTORY_ADDRESS));

  // Save deployment info
  const deployment = {
    network: (await ethers.provider.getNetwork()).name,
    registry: registryAddress,
    liraToken: LIRA_TOKEN_ADDRESS,
    tokenFactory: TOKEN_FACTORY_ADDRESS,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
  };

  console.log("\n📝 Deployment Info:", JSON.stringify(deployment, null, 2));

  console.log("\n⚠️  Note: Update TOKEN_FACTORY_ADDRESS after deploying the actual factory");
  console.log("   Run: await registry.setTokenFactory(actualFactoryAddress)");

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
