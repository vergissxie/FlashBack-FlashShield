const path = require("path");
const hre = require("hardhat");
const { loadEnvFile, requireEnv, saveDeployment } = require("./utils");

async function main() {
  const projectRoot = path.resolve(__dirname, "../..");
  loadEnvFile(projectRoot);

  const originChainId = BigInt(requireEnv("ORIGIN_CHAIN_ID"));
  const destinationChainId = BigInt(requireEnv("DESTINATION_CHAIN_ID"));
  const originContract = requireEnv("POSITION_RISK_SIMULATOR_ADDRESS");
  const destinationExecutor = requireEnv("PROTECTION_EXECUTOR_ADDRESS");
  const nearLiquidationTopic = hre.ethers.id("NearLiquidation(bytes32,uint256,uint256,uint256)");
  const deployValueEth = process.env.REACTIVE_PROTECTION_DEPLOY_VALUE_ETH || "0.1";

  const factory = await hre.ethers.getContractFactory("ReactiveProtection");
  const contract = await factory.deploy(
    originChainId,
    destinationChainId,
    originContract,
    nearLiquidationTopic,
    destinationExecutor,
    {
      value: hre.ethers.parseEther(deployValueEth),
    }
  );
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  const txHash = contract.deploymentTransaction()?.hash || "";

  const outputPath = saveDeployment(projectRoot, {
    contractName: "ReactiveProtection",
    network: hre.network.name,
    chainId: Number((await hre.ethers.provider.getNetwork()).chainId),
    address,
    deploymentTxHash: txHash,
    constructorArgs: [
      originChainId.toString(),
      destinationChainId.toString(),
      originContract,
      nearLiquidationTopic,
      destinationExecutor,
      deployValueEth
    ]
  });

  console.log("ReactiveProtection deployed:", address);
  console.log("Deployment tx hash:", txHash);
  console.log("Deployment value (ETH):", deployValueEth);
  console.log("Saved deployment file:", outputPath);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
