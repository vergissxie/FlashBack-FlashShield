import {
  createPublicClient,
  http,
  hexToString,
  parseAbiItem,
  type Address,
  type Hex,
} from "viem"
import { baseSepolia, sepolia } from "viem/chains"

import { encodeBytes32String } from "./bytes32"
import { positionRiskSimulatorAbi, protectionExecutorAbi } from "./contractAbi"
import { flashShieldConfig } from "./config"

export type PositionState = {
  entryPrice: string
  markPrice: string
  liquidationThreshold: string
  collateralValue: string
  targetPrice: string
  status: number
  stage: "Safe" | "Watch" | "NearLiquidation" | "Triggered"
  note: string
  riskScore: number
}

export type DemoState = {
  ok: boolean
  message?: string
  strategyId: string
  position: PositionState | null
  protection: {
    appliesToRequestedStrategy: boolean
    hedgeSize: string
    collateralValue: string
    triggerPrice: string
    targetPrice: string
    contractMultiplier: string
    currentStatus: number
    strategyId: string
    direction: number
    action: number
  }
  callback: {
    originChain: string
    destinationChain: string
    callbackProxy: string
    rvmId: string
    triggerTxHash: string
    protectionTxHash: string
  }
}

function decodeStrategyId(encoded: Hex) {
  try {
    return hexToString(encoded, { size: 32 }).replace(/\0+$/, "") || encoded
  } catch {
    return encoded
  }
}

const nearLiquidationEvent = parseAbiItem(
  "event NearLiquidation(bytes32 indexed strategyId, uint256 triggerPrice, uint256 collateralValue, uint256 targetPrice)",
)

const shortOpenedEvent = parseAbiItem(
  "event ShortPositionOpened(bytes32 indexed strategyId, uint256 triggerPrice, uint256 targetPrice, uint256 collateralValue, uint256 contractMultiplier, uint256 hedgeSize)",
)

type LogScanClient = {
  getBlockNumber: () => Promise<bigint>
  getLogs: (args: {
    address: Address
    event: typeof nearLiquidationEvent | typeof shortOpenedEvent
    args: { strategyId: Hex }
    fromBlock: bigint
    toBlock: bigint
  }) => Promise<ReadonlyArray<{ transactionHash: Hex }>>
}

async function findLatestStrategyEventTxHash(
  client: LogScanClient,
  contractAddress: Address,
  event: typeof nearLiquidationEvent | typeof shortOpenedEvent,
  strategyIdTopic: Hex,
) {
  const latestBlock = await client.getBlockNumber()
  const maxLookbackBlocks = 300n
  const maxRangeSize = 10n
  const earliestBlock = latestBlock > maxLookbackBlocks ? latestBlock - maxLookbackBlocks : 0n

  for (let toBlock = latestBlock; toBlock >= earliestBlock; toBlock -= maxRangeSize) {
    const candidateFrom = toBlock - (maxRangeSize - 1n)
    const fromBlock = candidateFrom > earliestBlock ? candidateFrom : earliestBlock
    try {
      const logs = await client.getLogs({
        address: contractAddress,
        event,
        args: { strategyId: strategyIdTopic },
        fromBlock,
        toBlock,
      })
      if (logs.length > 0) {
        return logs.at(-1)?.transactionHash ?? ""
      }
    } catch {
      return ""
    }
  }
  return ""
}

function summarizeTimeline(markPrice: bigint, liquidationThreshold: bigint, positionStatus: number) {
  const nearThreshold = (liquidationThreshold * 11_000n) / 10_000n
  const ratio = Number((markPrice * 100n) / (nearThreshold === 0n ? 1n : nearThreshold))
  const riskScore = Math.max(8, Math.min(100, ratio))

  if (positionStatus === 2) {
    return { stage: "Triggered" as const, note: "Ethereum Sepolia 上已经触发清算事件。", riskScore: 100 }
  }
  if (positionStatus === 1) {
    return { stage: "NearLiquidation" as const, note: "已经发出接近清算事件，并被 Reactive 成功匹配。", riskScore }
  }
  if (markPrice <= nearThreshold + 4n) {
    return { stage: "Watch" as const, note: "仓位正在接近接近清算阈值。", riskScore }
  }
  return { stage: "Safe" as const, note: "仓位当前仍在安全区间。", riskScore }
}

function isPositionNotFound(error: unknown) {
  if (!(error instanceof Error)) return false
  return error.message.includes("PositionNotFound") || error.message.includes("execution reverted")
}

export async function fetchFlashShieldDemoState(strategyIdText: string): Promise<DemoState> {
  const cfg = flashShieldConfig

  const originClient = createPublicClient({
    chain: sepolia,
    transport: http(cfg.ethereumSepoliaRpc),
  })
  const destClient = createPublicClient({
    chain: baseSepolia,
    transport: http(cfg.baseSepoliaRpc),
  })

  const simAddr = cfg.positionRiskSimulatorAddress as Address
  const execAddr = cfg.protectionExecutorAddress as Address
  const strategyId = encodeBytes32String(strategyIdText)

  let positionPayload: DemoState["position"] = null

  try {
    const result = await originClient.readContract({
      address: simAddr,
      abi: positionRiskSimulatorAbi,
      functionName: "getPosition",
      args: [strategyId],
    })
    const [entryPrice, markPrice, liquidationThreshold, collateralValue, targetPrice, positionStatus] = result
    const timelineState = summarizeTimeline(markPrice, liquidationThreshold, Number(positionStatus))
    positionPayload = {
      entryPrice: entryPrice.toString(),
      markPrice: markPrice.toString(),
      liquidationThreshold: liquidationThreshold.toString(),
      collateralValue: collateralValue.toString(),
      targetPrice: targetPrice.toString(),
      status: Number(positionStatus),
      stage: timelineState.stage,
      note: timelineState.note,
      riskScore: timelineState.riskScore,
    }
  } catch (error) {
    if (!isPositionNotFound(error)) {
      throw error
    }
  }

  const prot = await destClient.readContract({
    address: execAddr,
    abi: protectionExecutorAbi,
    functionName: "getProtectionState",
  })
  const [
    hedgeSize,
    collateralValue,
    triggerPrice,
    targetPrice,
    contractMultiplier,
    currentStatus,
    lastStrategyId,
    direction,
    action,
  ] = prot

  const decodedLastStrategyId = decodeStrategyId(lastStrategyId)
  const appliesToRequestedStrategy = decodedLastStrategyId === strategyIdText && Number(currentStatus) === 1

  const triggerTxHash = await findLatestStrategyEventTxHash(
    originClient,
    simAddr,
    nearLiquidationEvent,
    strategyId,
  )

  const protectionTxHash = appliesToRequestedStrategy
    ? await findLatestStrategyEventTxHash(destClient, execAddr, shortOpenedEvent, strategyId)
    : ""

  return {
    ok: true,
    strategyId: strategyIdText,
    position: positionPayload,
    protection: {
      appliesToRequestedStrategy,
      hedgeSize: hedgeSize.toString(),
      collateralValue: collateralValue.toString(),
      triggerPrice: triggerPrice.toString(),
      targetPrice: targetPrice.toString(),
      contractMultiplier: contractMultiplier.toString(),
      currentStatus: Number(currentStatus),
      strategyId: decodedLastStrategyId,
      direction: Number(direction),
      action: Number(action),
    },
    callback: {
      originChain: `Ethereum Sepolia (${cfg.originChainId})`,
      destinationChain: `Base Sepolia (${cfg.destinationChainId})`,
      callbackProxy: cfg.reactiveCallbackProxy,
      rvmId: cfg.expectedRvmId,
      triggerTxHash,
      protectionTxHash,
    },
  }
}
