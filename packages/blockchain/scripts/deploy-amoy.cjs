const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  if (!deployer) {
    throw new Error("No deployer wallet configured. Set WALLET_PRIVATE_KEY.");
  }

  const registry = await hre.ethers.deployContract("TraceabilityRegistry");
  await registry.waitForDeployment();

  const address = await registry.getAddress();

  console.log(`TraceabilityRegistry deployed by ${deployer.address}`);
  console.log(`CONTRACT_ADDRESS=${address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
