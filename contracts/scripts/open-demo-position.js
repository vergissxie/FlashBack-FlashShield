const path = require("path");
const hre = require("hardhat");
const { loadEnvFile, requireEnv } = require("./utils");

async function main() {
  const projectRoot = path.resolve(__dirname, "../..");
  loadEnvFile(projectRoot);

  const simulatorAddress = requireEnv("POSITION_RISK_SIMULATOR_ADDRESS");
  const strategyIdText = process.env.STRATEGY_ID || "FS-001";
  const entryPrice = BigInt(process.env.ENTRY_PRICE || "100");
  const liquidationThreshold = BigInt(
    process.env.LIQUIDATION_THRESHOLD || "85"
  );

  const simulator = await hre.ethers.getContractAt(
    "PositionRiskSimulator",
    simulatorAddress
  );

  const strategyId = hre.ethers.encodeBytes32String(strategyIdText);
  const tx = await simulator.openPosition(
    strategyId,
    entryPrice,
    liquidationThreshold
  );
  const receipt = await tx.wait();

  console.log(
    JSON.stringify(
      {
        action: "openPosition",
        network: hre.network.name,
        contract: simulatorAddress,
        strategyIdText,
        strategyId,
        entryPrice: entryPrice.toString(),
        liquidationThreshold: liquidationThreshold.toString(),
        txHash: receipt.hash,
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
