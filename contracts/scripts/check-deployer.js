const hre = require("hardhat");

async function main() {
  const [signer] = await hre.ethers.getSigners();
  const balance = await hre.ethers.provider.getBalance(signer.address);

  console.log(
    JSON.stringify(
      {
        network: hre.network.name,
        chainId: Number((await hre.ethers.provider.getNetwork()).chainId),
        address: signer.address,
        balanceWei: balance.toString(),
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
