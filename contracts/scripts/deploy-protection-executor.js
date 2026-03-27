const path = require("path");
const hre = require("hardhat");
const { loadEnvFile, requireEnv, saveDeployment } = require("./utils");

async function main() {
  const projectRoot = path.resolve(__dirname, "../..");
  loadEnvFile(projectRoot);

  const callbackProxy = requireEnv("REACTIVE_CALLBACK_PROXY");
  const expectedRvmId = requireEnv("EXPECTED_RVM_ID");
  const initialRiskBalance = BigInt(process.env.INITIAL_RISK_BALANCE || "100");
  const initialStableBalance = BigInt(process.env.INITIAL_STABLE_BALANCE || "0");

  const factory = await hre.ethers.getContractFactory("ProtectionExecutor");
  const contract = await factory.deploy(
    callbackProxy,
    expectedRvmId,
    initialRiskBalance,
    initialStableBalance
  );
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  const txHash = contract.deploymentTransaction()?.hash || "";

  const outputPath = saveDeployment(projectRoot, {
    contractName: "ProtectionExecutor",
    network: hre.network.name,
    chainId: Number((await hre.ethers.provider.getNetwork()).chainId),
    address,
    deploymentTxHash: txHash,
    constructorArgs: [
      callbackProxy,
      expectedRvmId,
      initialRiskBalance.toString(),
      initialStableBalance.toString()
    ]
  });

  console.log("ProtectionExecutor deployed:", address);
  console.log("Deployment tx hash:", txHash);
  console.log("Saved deployment file:", outputPath);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
