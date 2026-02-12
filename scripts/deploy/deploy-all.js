const { ethers } = require("hardhat");
const deployLiraToken = require("./00_LiraToken");
const deployRegistry = require("./01_LiraTokenRegistry");
const deploySocial = require("./02_LiraSocial");
const deployFactories = require("./03_Factories");

/**
 * Master deployment script
 * Deploys all LIRA ecosystem contracts in the correct order
 */
async function main() {
  console.log("=".repeat(60));
  console.log("LIRA PROTOCOL - COMPLETE DEPLOYMENT");
  console.log("=".repeat(60));

  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();

  console.log("\nNetwork:", network.name);
  console.log("Chain ID:", network.chainId);
  console.log("Deployer:", deployer.address);
  console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH");

  const deployments = {};

  try {
    // Step 1: Deploy LIRA Token
    console.log("\n" + "=".repeat(60));
    console.log("STEP 1: LIRA TOKEN (Root Governance)");
    console.log("=".repeat(60));
    const liraDeployment = await deployLiraToken();
    deployments.lira = liraDeployment;
    process.env.LIRA_TOKEN_ADDRESS = liraDeployment.liraToken;

    // Step 2: Deploy Registry (with temporary factory address)
    console.log("\n" + "=".repeat(60));
    console.log("STEP 2: LIRA TOKEN REGISTRY");
    console.log("=".repeat(60));
    const registryDeployment = await deployRegistry();
    deployments.registry = registryDeployment;
    process.env.REGISTRY_ADDRESS = registryDeployment.registry;

    // Step 3: Deploy Social Contracts
    console.log("\n" + "=".repeat(60));
    console.log("STEP 3: LIRA SOCIAL LAYER");
    console.log("=".repeat(60));
    const socialDeployment = await deploySocial();
    deployments.social = socialDeployment;

    // Step 4: Deploy Factories
    console.log("\n" + "=".repeat(60));
    console.log("STEP 4: TOKEN FACTORIES");
    console.log("=".repeat(60));
    const factoriesDeployment = await deployFactories();
    deployments.factories = factoriesDeployment;

    // Complete deployment summary
    console.log("\n" + "=".repeat(60));
    console.log("✨ DEPLOYMENT COMPLETE!");
    console.log("=".repeat(60));

    const summary = {
      network: network.name,
      chainId: network.chainId.toString(),
      deployer: deployer.address,
      contracts: {
        liraToken: liraDeployment.liraToken,
        liraTokenRegistry: registryDeployment.registry,
        liraProfile: socialDeployment.liraProfile,
        liraSocialGraph: socialDeployment.liraSocialGraph,
        tokenLaunchFactory: factoriesDeployment.tokenLaunchFactory,
        liraUserTokenFactory: factoriesDeployment.liraUserTokenFactory,
      },
      config: {
        treasury: liraDeployment.treasury,
        feeCollector: liraDeployment.feeCollector,
      },
      timestamp: new Date().toISOString(),
    };

    console.log("\n📋 DEPLOYMENT SUMMARY:");
    console.log(JSON.stringify(summary, null, 2));

    // Save to file
    const fs = require("fs");
    const deploymentFile = `deployments/${network.name}-${Date.now()}.json`;
    fs.mkdirSync("deployments", { recursive: true });
    fs.writeFileSync(deploymentFile, JSON.stringify(summary, null, 2));
    console.log("\n💾 Deployment saved to:", deploymentFile);

    console.log("\n" + "=".repeat(60));
    console.log("NEXT STEPS:");
    console.log("=".repeat(60));
    console.log("1. Verify contracts on block explorer");
    console.log("2. Set up DAO operators if needed");
    console.log("3. Transfer ownership to multisig if desired");
    console.log("4. Update frontend with contract addresses");
    console.log("5. Test all flows on testnet before mainnet");

    return summary;
  } catch (error) {
    console.error("\n❌ Deployment failed:", error);
    throw error;
  }
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
