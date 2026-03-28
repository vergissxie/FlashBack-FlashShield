import { readFileSync } from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import { ethers } from "ethers";

import { positionRiskSimulatorAbi, protectionExecutorAbi } from "@/lib/abis";
import { contractConfig } from "@/lib/contracts";

type EnvMap = Record<string, string>;

function loadRootEnv(): EnvMap {
  const envPath = path.resolve(process.cwd(), "..", ".env");
  const text = readFileSync(envPath, "utf8");
  const values: EnvMap = {};

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }

    const separator = line.indexOf("=");
    if (separator === -1) {
      continue;
    }

    const key = line.slice(0, separator).trim();
    const value = line.slice(separator + 1).trim();
    values[key] = value;
  }

  return values;
}

function decodeStrategyId(encoded: string) {
  try {
    return ethers.decodeBytes32String(encoded);
  } catch {
    return encoded;
  }
}

function summarizeTimeline(markPrice: bigint, liquidationThreshold: bigint, positionStatus: number) {
  const nearThreshold = (liquidationThreshold * 11_000n) / 10_000n;
  const ratio = Number((markPrice * 100n) / (nearThreshold === 0n ? 1n : nearThreshold));
  const riskScore = Math.max(8, Math.min(100, ratio));

  if (positionStatus === 2) {
    return {
      stage: "Triggered",
      note: "Ethereum Sepolia 上已经触发清算事件。",
      riskScore: 100,
    } as const;
  }

  if (positionStatus === 1) {
    return {
      stage: "NearLiquidation",
      note: "已经发出接近清算事件，并被 Reactive 成功匹配。",
      riskScore,
    } as const;
  }

  if (markPrice <= nearThreshold + 4n) {
    return {
      stage: "Watch",
      note: "仓位正在接近接近清算阈值。",
      riskScore,
    } as const;
  }

  return {
    stage: "Safe",
    note: "仓位当前仍在安全区间。",
    riskScore,
  } as const;
}

function isPositionNotFound(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  return error.message.includes("PositionNotFound") || error.message.includes("execution reverted");
}

export async function GET(request: Request) {
  try {
    const env = loadRootEnv();
    const url = new URL(request.url);
    const strategyIdText = url.searchParams.get("strategyId") || "FS-LIVE";

    const originProvider = new ethers.JsonRpcProvider(env.ETHEREUM_SEPOLIA_RPC_URL);
    const destinationProvider = new ethers.JsonRpcProvider(env.BASE_SEPOLIA_RPC_URL);

    const simulator = new ethers.Contract(
      contractConfig.positionRiskSimulatorAddress,
      positionRiskSimulatorAbi,
      originProvider
    );
    const executor = new ethers.Contract(
      contractConfig.protectionExecutorAddress,
      protectionExecutorAbi,
      destinationProvider
    );

    const strategyId = ethers.encodeBytes32String(strategyIdText);

    let positionPayload: null | {
      entryPrice: string;
      markPrice: string;
      liquidationThreshold: string;
      status: number;
      stage: "Safe" | "Watch" | "NearLiquidation" | "Triggered";
      note: string;
      riskScore: number;
    } = null;

    try {
      const [entryPrice, markPrice, liquidationThreshold, positionStatus] = (await simulator.getPosition(
        strategyId
      )) as [bigint, bigint, bigint, bigint];

      const timelineState = summarizeTimeline(markPrice, liquidationThreshold, Number(positionStatus));
      positionPayload = {
        entryPrice: entryPrice.toString(),
        markPrice: markPrice.toString(),
        liquidationThreshold: liquidationThreshold.toString(),
        status: Number(positionStatus),
        stage: timelineState.stage,
        note: timelineState.note,
        riskScore: timelineState.riskScore,
      };
    } catch (error) {
      if (!isPositionNotFound(error)) {
        throw error;
      }
    }

    const [riskBalance, stableBalance, amountProtected, currentStatus, lastStrategyId, triggerPrice, action] =
      (await executor.getProtectionState()) as [bigint, bigint, bigint, bigint, string, bigint, bigint];

    const decodedLastStrategyId = decodeStrategyId(lastStrategyId);
    const appliesToRequestedStrategy =
      decodedLastStrategyId === strategyIdText && Number(currentStatus) === 1;

    return NextResponse.json({
      ok: true,
      strategyId: strategyIdText,
      position: positionPayload,
      protection: {
        appliesToRequestedStrategy,
        riskBalance: riskBalance.toString(),
        stableBalance: stableBalance.toString(),
        amountProtected: amountProtected.toString(),
        currentStatus: Number(currentStatus),
        strategyId: decodedLastStrategyId,
        triggerPrice: triggerPrice.toString(),
        action: Number(action),
      },
      callback: {
        originChain: `Ethereum Sepolia (${contractConfig.originChainId})`,
        destinationChain: `Base Sepolia (${contractConfig.destinationChainId})`,
        callbackProxy: env.REACTIVE_CALLBACK_PROXY,
        rvmId: env.EXPECTED_RVM_ID,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      {
        ok: false,
        message,
      },
      { status: 500 }
    );
  }
}
