const { ethers } = require("hardhat");

/**
 * Deploy script for LiraProfile and LiraSocialGraph
 * Social layer contracts for LIRA SOCIAL
 */
async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying LIRA Social contracts with account:", deployer.address);

  // Deploy LiraProfile
  console.log("\n1. Deploying LiraProfile...");
  const LiraProfile = await ethers.getContractFactory("LiraProfile");
  const profile = await LiraProfile.deploy();
  await profile.waitForDeployment();
  const profileAddress = await profile.getAddress();
  console.log("✅ LiraProfile deployed to:", profileAddress);

  // Deploy LiraSocialGraph
  console.log("\n2. Deploying LiraSocialGraph...");
  const LiraSocialGraph = await ethers.getContractFactory("LiraSocialGraph");
  const socialGraph = await LiraSocialGraph.deploy();
  await socialGraph.waitForDeployment();
  const socialGraphAddress = await socialGraph.getAddress();
  console.log("✅ LiraSocialGraph deployed to:", socialGraphAddress);

  // Save deployment info
  const deployment = {
    network: (await ethers.provider.getNetwork()).name,
    liraProfile: profileAddress,
    liraSocialGraph: socialGraphAddress,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
  };

  console.log("\n📝 Deployment Info:", JSON.stringify(deployment, null, 2));

  console.log("\n✨ Social layer contracts deployed successfully!");
  console.log("Users can now create profiles and build social graphs on-chain.");

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
