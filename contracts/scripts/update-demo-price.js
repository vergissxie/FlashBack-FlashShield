const path = require("path");
const hre = require("hardhat");
const { loadEnvFile, requireEnv } = require("./utils");

async function main() {
  const projectRoot = path.resolve(__dirname, "../..");
  loadEnvFile(projectRoot);

  const simulatorAddress = requireEnv("POSITION_RISK_SIMULATOR_ADDRESS");
  const strategyIdText = process.env.STRATEGY_ID || "FS-001";
  const markPrice = BigInt(requireEnv("MARK_PRICE"));

  const simulator = await hre.ethers.getContractAt(
    "PositionRiskSimulator",
    simulatorAddress
  );

  const strategyId = hre.ethers.encodeBytes32String(strategyIdText);
  const tx = await simulator.updateMarkPrice(strategyId, markPrice);
  const receipt = await tx.wait();

  console.log(
    JSON.stringify(
      {
        action: "updateMarkPrice",
        network: hre.network.name,
        contract: simulatorAddress,
        strategyIdText,
        strategyId,
        markPrice: markPrice.toString(),
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
