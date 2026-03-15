const hre = require("hardhat");

async function main() {
  console.log("Deploying Lira Protocol contracts...");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  const TREASURY_ADDRESS = process.env.TREASURY_ADDRESS || deployer.address;
  const FEE_COLLECTOR_ADDRESS = process.env.FEE_COLLECTOR_ADDRESS || deployer.address;
  console.log("Treasury:", TREASURY_ADDRESS);
  console.log("Fee Collector:", FEE_COLLECTOR_ADDRESS);

  // Deploy LiraToken
  console.log("\n1. Deploying LiraToken...");
  const LiraToken = await hre.ethers.getContractFactory("LiraToken");
  const liraToken = await LiraToken.deploy(
    TREASURY_ADDRESS,
    FEE_COLLECTOR_ADDRESS
  );
  await liraToken.waitForDeployment();
  const liraTokenAddress = await liraToken.getAddress();
  console.log("LiraToken deployed to:", liraTokenAddress);

  // Deploy LiraTokenRegistry (with deployer as temporary factory address)
  console.log("\n2. Deploying LiraTokenRegistry...");
  const LiraTokenRegistry = await hre.ethers.getContractFactory("LiraTokenRegistry");
  const registry = await LiraTokenRegistry.deploy(
    liraTokenAddress,
    deployer.address // temporary factory – updated after TokenLaunchFactory is deployed
  );
  await registry.waitForDeployment();
  const registryAddress = await registry.getAddress();
  console.log("LiraTokenRegistry deployed to:", registryAddress);

  // Deploy TokenLaunchFactory (requires registry address)
  console.log("\n3. Deploying TokenLaunchFactory...");
  const TokenLaunchFactory = await hre.ethers.getContractFactory("TokenLaunchFactory");
  const launchFactory = await TokenLaunchFactory.deploy(
    liraTokenAddress,
    FEE_COLLECTOR_ADDRESS,
    registryAddress
  );
  await launchFactory.waitForDeployment();
  const launchFactoryAddress = await launchFactory.getAddress();
  console.log("TokenLaunchFactory deployed to:", launchFactoryAddress);

  // Update registry to point to the real factory
  console.log("\n4. Updating registry with factory address...");
  const updateTx = await registry.setTokenFactory(launchFactoryAddress);
  await updateTx.wait();
  console.log("Registry factory updated to:", launchFactoryAddress);

  // Deploy AgentExecutor
  console.log("\n5. Deploying AgentExecutor...");
  const AgentExecutor = await hre.ethers.getContractFactory("AgentExecutor");
  const agentExecutor = await AgentExecutor.deploy(
    FEE_COLLECTOR_ADDRESS
  );
  await agentExecutor.waitForDeployment();
  const agentExecutorAddress = await agentExecutor.getAddress();
  console.log("AgentExecutor deployed to:", agentExecutorAddress);

  // Set up permissions
  console.log("\n6. Setting up permissions...");
  await liraToken.setMinter(launchFactoryAddress, true);
  console.log("LaunchFactory added as minter");

  await liraToken.setMinter(agentExecutorAddress, true);
  console.log("AgentExecutor added as minter");

  console.log("\n=== Deployment Summary ===");
  console.log("LiraToken:", liraTokenAddress);
  console.log("LiraTokenRegistry:", registryAddress);
  console.log("TokenLaunchFactory:", launchFactoryAddress);
  console.log("AgentExecutor:", agentExecutorAddress);
  console.log("\nDeployment complete!");

  // Save addresses to file
  const fs = require("fs");
  const addresses = {
    network: hre.network.name,
    liraToken: liraTokenAddress,
    liraTokenRegistry: registryAddress,
    tokenLaunchFactory: launchFactoryAddress,
    agentExecutor: agentExecutorAddress,
    deployer: deployer.address,
    treasury: TREASURY_ADDRESS,
    feeCollector: FEE_COLLECTOR_ADDRESS,
    timestamp: new Date().toISOString(),
  };

  const addressesPath = `./deployments/${hre.network.name}-addresses.json`;
  fs.mkdirSync("./deployments", { recursive: true });
  fs.writeFileSync(addressesPath, JSON.stringify(addresses, null, 2));
  console.log(`\nAddresses saved to ${addressesPath}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

