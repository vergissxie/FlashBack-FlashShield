require("@nomicfoundation/hardhat-toolbox");
const path = require("path");
const { loadEnvFile } = require("./scripts/utils");

loadEnvFile(path.resolve(__dirname, ".."));

const deployerPrivateKey = process.env.DEPLOYER_PRIVATE_KEY
  ? [process.env.DEPLOYER_PRIVATE_KEY]
  : [];

module.exports = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  paths: {
    sources: "./src",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },
  networks: {
    ethereumSepolia: {
      url: process.env.ETHEREUM_SEPOLIA_RPC_URL || "",
      accounts: deployerPrivateKey
    },
    baseSepolia: {
      url: process.env.BASE_SEPOLIA_RPC_URL || "",
      accounts: deployerPrivateKey
    },
    reactiveLasna: {
      url: process.env.REACTIVE_RPC_URL || "",
      chainId: process.env.REACTIVE_CHAIN_ID
        ? Number(process.env.REACTIVE_CHAIN_ID)
        : undefined,
      accounts: deployerPrivateKey
    }
  }
};
