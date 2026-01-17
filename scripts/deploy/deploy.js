const hre = require("hardhat");

async function main() {
  console.log("Deploying Lira Protocol contracts...");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  // Deploy LiraToken
  console.log("\n1. Deploying LiraToken...");
  const LiraToken = await hre.ethers.getContractFactory("LiraToken");
  const liraToken = await LiraToken.deploy(
    deployer.address, // treasury
    deployer.address  // feeCollector
  );
  await liraToken.waitForDeployment();
  const liraTokenAddress = await liraToken.getAddress();
  console.log("LiraToken deployed to:", liraTokenAddress);

  // Deploy TokenLaunchFactory
  console.log("\n2. Deploying TokenLaunchFactory...");
  const TokenLaunchFactory = await hre.ethers.getContractFactory("TokenLaunchFactory");
  const launchFactory = await TokenLaunchFactory.deploy(
    liraTokenAddress,
    deployer.address // feeCollector
  );
  await launchFactory.waitForDeployment();
  const launchFactoryAddress = await launchFactory.getAddress();
  console.log("TokenLaunchFactory deployed to:", launchFactoryAddress);

  // Deploy AgentExecutor
  console.log("\n3. Deploying AgentExecutor...");
  const AgentExecutor = await hre.ethers.getContractFactory("AgentExecutor");
  const agentExecutor = await AgentExecutor.deploy(
    deployer.address // feeCollector
  );
  await agentExecutor.waitForDeployment();
  const agentExecutorAddress = await agentExecutor.getAddress();
  console.log("AgentExecutor deployed to:", agentExecutorAddress);

  // Set up permissions
  console.log("\n4. Setting up permissions...");
  await liraToken.setMinter(launchFactoryAddress, true);
  console.log("LaunchFactory added as minter");
  
  await liraToken.setMinter(agentExecutorAddress, true);
  console.log("AgentExecutor added as minter");

  console.log("\n=== Deployment Summary ===");
  console.log("LiraToken:", liraTokenAddress);
  console.log("TokenLaunchFactory:", launchFactoryAddress);
  console.log("AgentExecutor:", agentExecutorAddress);
  console.log("\nDeployment complete!");

  // Save addresses to file
  const fs = require("fs");
  const addresses = {
    network: hre.network.name,
    liraToken: liraTokenAddress,
    tokenLaunchFactory: launchFactoryAddress,
    agentExecutor: agentExecutorAddress,
    deployer: deployer.address,
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
