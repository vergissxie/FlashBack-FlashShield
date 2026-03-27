const path = require("path");
const hre = require("hardhat");
const { loadEnvFile, requireEnv } = require("./utils");

const DEPOSIT_ABI = [
  "function depositTo(address target) external payable",
  "function reserves(address target) external view returns (uint256)",
  "function debts(address target) external view returns (uint256)",
];

async function main() {
  const projectRoot = path.resolve(__dirname, "../..");
  loadEnvFile(projectRoot);

  const proxyAddress = requireEnv("PROXY_ADDRESS");
  const targetAddress = requireEnv("TARGET_ADDRESS");
  const valueEther = process.env.DEPOSIT_VALUE_ETH || "0.01";

  const proxy = await hre.ethers.getContractAt(DEPOSIT_ABI, proxyAddress);
  const tx = await proxy.depositTo(targetAddress, {
    value: hre.ethers.parseEther(valueEther),
  });
  const receipt = await tx.wait();

  const reserves = await proxy.reserves(targetAddress);
  const debts = await proxy.debts(targetAddress);

  console.log(
    JSON.stringify(
      {
        network: hre.network.name,
        proxyAddress,
        targetAddress,
        depositValueEth: valueEther,
        txHash: receipt.hash,
        reserves: reserves.toString(),
        debts: debts.toString(),
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
