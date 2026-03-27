const path = require("path");
const hre = require("hardhat");
const { loadEnvFile, saveDeployment } = require("./utils");

async function main() {
  const projectRoot = path.resolve(__dirname, "../..");
  loadEnvFile(projectRoot);

  const factory = await hre.ethers.getContractFactory("PositionRiskSimulator");
  const contract = await factory.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  const txHash = contract.deploymentTransaction()?.hash || "";

  const outputPath = saveDeployment(projectRoot, {
    contractName: "PositionRiskSimulator",
    network: hre.network.name,
    chainId: Number((await hre.ethers.provider.getNetwork()).chainId),
    address,
    deploymentTxHash: txHash,
    constructorArgs: []
  });

  console.log("PositionRiskSimulator deployed:", address);
  console.log("Deployment tx hash:", txHash);
  console.log("Saved deployment file:", outputPath);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
