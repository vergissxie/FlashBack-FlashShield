const fs = require("fs");
const path = require("path");
const { ethers } = require("ethers");

function loadEnv(projectRoot) {
  const envPath = path.join(projectRoot, ".env");
  const text = fs.readFileSync(envPath, "utf8");
  const env = {};

  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const separator = trimmed.indexOf("=");
    if (separator === -1) continue;

    env[trimmed.slice(0, separator).trim()] = trimmed.slice(separator + 1).trim();
  }

  return env;
}

async function findLatest(provider, address, topic0, topic1, maxLookback = 500, step = 10) {
  const latest = await provider.getBlockNumber();
  const earliest = Math.max(0, latest - maxLookback);

  for (let toBlock = latest; toBlock >= earliest; toBlock -= step) {
    const fromBlock = Math.max(earliest, toBlock - (step - 1));
    const logs = await provider.getLogs({
      address,
      fromBlock,
      toBlock,
      topics: [topic0, topic1],
    });

    if (logs.length > 0) {
      return logs.at(-1);
    }
  }

  return null;
}

async function main() {
  const projectRoot = path.resolve(__dirname, "../..");
  const env = loadEnv(projectRoot);
  const strategy = process.env.STRATEGY_ID || "FS-HEDGE-03";
  const maxLookback = Number(process.env.MAX_LOOKBACK || "500");
  const strategyBytes32 = ethers.encodeBytes32String(strategy);

  const originDeployment = JSON.parse(
    fs.readFileSync(path.join(projectRoot, "contracts", "deployments", "ethereumSepolia-PositionRiskSimulator.json"), "utf8")
  );
  const destinationDeployment = JSON.parse(
    fs.readFileSync(path.join(projectRoot, "contracts", "deployments", "baseSepolia-ProtectionExecutor.json"), "utf8")
  );
  const reactiveDeployment = JSON.parse(
    fs.readFileSync(path.join(projectRoot, "contracts", "deployments", "reactiveLasna-ReactiveProtection.json"), "utf8")
  );

  const originProvider = new ethers.JsonRpcProvider(env.ETHEREUM_SEPOLIA_RPC_URL);
  const destinationProvider = new ethers.JsonRpcProvider(env.BASE_SEPOLIA_RPC_URL);
  const reactiveProvider = new ethers.JsonRpcProvider(env.REACTIVE_RPC_URL);

  const nearSig = ethers.id("NearLiquidation(bytes32,uint256,uint256,uint256)");
  const shortSig = ethers.id("ShortPositionOpened(bytes32,uint256,uint256,uint256,uint256,uint256)");
  const callbackSig = ethers.id("Callback(uint256,address,uint64,bytes)");

  const originNear = await findLatest(
    originProvider,
    originDeployment.address,
    nearSig,
    strategyBytes32,
    maxLookback
  );
  const destinationShort = await findLatest(
    destinationProvider,
    destinationDeployment.address,
    shortSig,
    strategyBytes32,
    maxLookback
  );

  const callbackIface = new ethers.Interface([
    "event Callback(uint256 indexed chain_id, address indexed _contract, uint64 indexed gas_limit, bytes payload)",
  ]);
  const targetIface = new ethers.Interface([
    "function onReactiveCallback(address rvmId, bytes32 strategyId, uint256 triggerPrice, uint256 collateralValue, uint256 targetPrice, uint8 action)",
  ]);

  const latestReactiveBlock = await reactiveProvider.getBlockNumber();
  const earliestReactiveBlock = Math.max(0, latestReactiveBlock - maxLookback);
  let reactiveCallback = null;

  for (let toBlock = latestReactiveBlock; toBlock >= earliestReactiveBlock; toBlock -= 10) {
    const fromBlock = Math.max(earliestReactiveBlock, toBlock - 9);
    const logs = await reactiveProvider.getLogs({
      address: reactiveDeployment.address,
      fromBlock,
      toBlock,
      topics: [callbackSig],
    });

    for (let index = logs.length - 1; index >= 0; index -= 1) {
      const log = logs[index];
      const parsed = callbackIface.parseLog(log);

      try {
        const decoded = targetIface.decodeFunctionData("onReactiveCallback", parsed.args.payload);
        if (decoded.strategyId === strategyBytes32) {
          reactiveCallback = log;
          break;
        }
      } catch {
        continue;
      }
    }

    if (reactiveCallback) {
      break;
    }
  }

  console.log(
    JSON.stringify(
      {
        strategy,
        originNearLiquidation: originNear
          ? { txHash: originNear.transactionHash, blockNumber: originNear.blockNumber }
          : null,
        reactiveCallback: reactiveCallback
          ? { txHash: reactiveCallback.transactionHash, blockNumber: reactiveCallback.blockNumber }
          : null,
        destinationShortOpened: destinationShort
          ? { txHash: destinationShort.transactionHash, blockNumber: destinationShort.blockNumber }
          : null,
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
