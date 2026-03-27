const path = require("path");
const hre = require("hardhat");
const { loadEnvFile, requireEnv } = require("./utils");

async function main() {
  const projectRoot = path.resolve(__dirname, "../..");
  loadEnvFile(projectRoot);

  const executorAddress = requireEnv("PROTECTION_EXECUTOR_ADDRESS");
  const executor = await hre.ethers.getContractAt(
    "ProtectionExecutor",
    executorAddress
  );

  const state = await executor.getProtectionState();

  console.log(
    JSON.stringify(
      {
        network: hre.network.name,
        contract: executorAddress,
        riskBalance: state.riskBalance.toString(),
        stableBalance: state.stableBalance.toString(),
        amountProtected: state.amountProtected.toString(),
        currentStatus: state.currentStatus.toString(),
        strategyId: state.strategyId,
        triggerPrice: state.triggerPrice.toString(),
        action: state.action.toString(),
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
