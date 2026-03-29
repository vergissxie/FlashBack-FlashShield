import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Link } from "react-router-dom"
import { toast } from "sonner"
import type { Address } from "viem"
import { sepolia } from "viem/chains"
import { getPublicClient, waitForTransactionReceipt } from "@wagmi/core"
import { useAccount, useChainId, useSwitchChain, useWriteContract } from "wagmi"

import { AsyncCrossChainRitual, type RitualMode } from "@/components/ritual/AsyncCrossChainRitual"
import { TxWaitStrip } from "@/components/ritual/TxWaitStrip"
import { Button } from "@/components/ui/button"
import { ChainBadge } from "@/components/wallet/ChainBadge"
import { WalletConnectButton } from "@/components/wallet/WalletConnectButton"

import { encodeBytes32String } from "./bytes32"
import { positionRiskSimulatorAbi } from "./contractAbi"
import { flashShieldConfig } from "./config"
import { fetchFlashShieldDemoState, type DemoState } from "./demoState"
import { wagmiConfig } from "@/lib/wagmi-config"

/**
 * 部分 RPC / 网络对单笔交易 gas 有上限（常见 16777216）。钱包在估算失败时可能默认 ~21M 导致被拒。
 * `openPosition` / `updateMarkPrice` 为简单状态写入，固定上限即可稳定通过。
 */
const GAS_OPEN_POSITION = 450_000n
const GAS_UPDATE_MARK_PRICE = 350_000n

type LocalTxState = {
  openTxHash: string
  triggerTxHash: string
}

function shortHash(value: string) {
  if (!value) return "暂无"
  return `${value.slice(0, 10)}...${value.slice(-8)}`
}

function txExplorerUrl(chainId: number, hash: string) {
  if (!hash) return ""
  if (chainId === 11155111) return `https://sepolia.etherscan.io/tx/${hash}`
  if (chainId === 84532) return `https://sepolia.basescan.org/tx/${hash}`
  return ""
}

function protectionStatusLabel(state: DemoState | null) {
  if (!state?.protection) return "未读取"
  if (!state.protection.appliesToRequestedStrategy) return "未触发"
  if (state.protection.currentStatus === 1) return "已对冲"
  if (state.protection.currentStatus === 2) return "等待恢复"
  if (state.protection.currentStatus === 3) return "已恢复"
  return "空闲"
}

function hedgeDirectionLabel(direction: number) {
  return direction === 1 ? "SHORT" : "未建立"
}

function parseNumberInput(value: string) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : NaN
}

async function readWalletChainId(): Promise<number | undefined> {
  const eth = (window as unknown as { ethereum?: { request?: (a: { method: string }) => Promise<string> } })
    .ethereum
  if (!eth?.request) return undefined
  try {
    const hex = await eth.request({ method: "eth_chainId" })
    return Number.parseInt(hex, 16)
  } catch {
    return undefined
  }
}

function friendlyErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : String(error)
  if (message.includes("gas limit too high") || message.includes("cap: 16777216")) {
    return "Gas 上限超限：当前网络单笔 gas 有上限（约 1677 万），钱包若给到 2100 万会被拒绝。已在前端为开仓/调价固定合理 gas；请刷新页面后重试，或在 MetaMask「高级」里调低 gas limit。"
  }
  if (message.includes("does not match the target chain") || message.includes("ChainMismatch")) {
    return "链不对：开仓/触发必须在 Ethereum Sepolia（链 ID 11155111）。你当前钱包在其它网络（例如 Base Sepolia 是 84532）。请在 MetaMask 顶部网络里切换到「Sepolia」，再重试。"
  }
  if (message.includes("InvalidThreshold")) {
    return "开仓失败：清算阈值必须小于开仓价格，targetPrice 还必须低于清算阈值。"
  }
  if (message.includes("PositionAlreadyExists")) {
    return "开仓失败：这个策略 ID 已经存在，请换一个新的策略 ID。"
  }
  if (message.includes("PositionNotFound")) {
    return "操作失败：当前策略还没有开仓。"
  }
  if (message.includes("user rejected") || message.includes("User rejected")) {
    return "你取消了钱包签名。"
  }
  if (message.includes("execution reverted") || message.includes("Execution reverted")) {
    if (message.includes("PositionAlreadyExists")) {
      return "该策略 ID 在链上已有仓位（公共演示合约上很常见）。请点击「生成唯一策略 ID」或换一个未使用过的 ID，刷新状态后再开仓。"
    }
    return "合约执行回退。若参数无误，多半是策略 ID 已被占用：请生成新的唯一 ID 或换名后重试；也可先点「刷新状态」确认该 ID 是否已有仓位。"
  }
  return message
}

function defaultStrategyId() {
  return `FS-${Date.now()}`
}

export function FlashShieldLive() {
  const { isConnected, address } = useAccount()
  const chainId = useChainId()
  const { switchChainAsync } = useSwitchChain()
  const { writeContractAsync, isPending: isWritePending } = useWriteContract()

  const [strategyId, setStrategyId] = useState(defaultStrategyId)
  const [entryPrice, setEntryPrice] = useState("100")
  const [liquidationThreshold, setLiquidationThreshold] = useState("85")
  const [markPrice, setMarkPrice] = useState("88")
  const [collateralValue, setCollateralValue] = useState("1000")
  const [targetPrice, setTargetPrice] = useState("80")
  const [displayMarkPrice, setDisplayMarkPrice] = useState("100")
  const [demoState, setDemoState] = useState<DemoState | null>(null)
  const [feedback, setFeedback] = useState("先连接钱包，然后点击「1. 开启演示仓位」。")
  const [busyAction, setBusyAction] = useState<"open" | "trigger" | "refresh" | null>(null)
  const [isAnimatingPrice, setIsAnimatingPrice] = useState(false)
  const [localTxs, setLocalTxs] = useState<LocalTxState>({ openTxHash: "", triggerTxHash: "" })
  const [ritualKey, setRitualKey] = useState(0)
  const [ritualMode, setRitualMode] = useState<RitualMode>("liquidate")
  const animationFrameRef = useRef<number | null>(null)

  const strategyIdBytes = useMemo(() => encodeBytes32String(strategyId), [strategyId])
  const entryPriceValue = parseNumberInput(entryPrice)
  const liquidationThresholdValue = parseNumberInput(liquidationThreshold)
  const markPriceValue = parseNumberInput(markPrice)
  const collateralValueInput = parseNumberInput(collateralValue)
  const targetPriceValue = parseNumberInput(targetPrice)
  const openInputInvalid =
    !strategyId.trim() ||
    !Number.isFinite(entryPriceValue) ||
    !Number.isFinite(liquidationThresholdValue) ||
    !Number.isFinite(collateralValueInput) ||
    !Number.isFinite(targetPriceValue) ||
    entryPriceValue <= 0 ||
    liquidationThresholdValue <= 0 ||
    collateralValueInput <= 0 ||
    targetPriceValue <= 0 ||
    liquidationThresholdValue >= entryPriceValue ||
    targetPriceValue >= liquidationThresholdValue
  const triggerInputInvalid =
    !demoState?.position ||
    !Number.isFinite(markPriceValue) ||
    markPriceValue <= 0 ||
    (Number.isFinite(targetPriceValue) && markPriceValue <= targetPriceValue)

  const cfg = flashShieldConfig
  const simAddr = cfg.positionRiskSimulatorAddress as Address

  const ensureSepolia = useCallback(async () => {
    const walletId = await readWalletChainId()
    if (walletId === sepolia.id) return

    if (!switchChainAsync) {
      throw new Error("当前钱包不支持自动切链，请在 MetaMask 中手动切换到 Ethereum Sepolia（11155111）。")
    }
    await switchChainAsync({ chainId: sepolia.id })
    for (let i = 0; i < 40; i += 1) {
      const id = await readWalletChainId()
      if (id === sepolia.id) return
      await new Promise((r) => window.setTimeout(r, 150))
    }
    const last = await readWalletChainId()
    throw new Error(
      `仍未切换到 Sepolia。钱包当前链 ID：${last ?? "未知"}，需要 11155111（Ethereum Sepolia）。请在 MetaMask 网络列表中选择 Sepolia 后再点开仓。`,
    )
  }, [switchChainAsync])

  useEffect(() => {
    return () => {
      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (!isAnimatingPrice && demoState?.position) {
      setDisplayMarkPrice(demoState.position.markPrice)
    }
  }, [demoState, isAnimatingPrice])

  const refreshState = useCallback(async (targetStrategyId: string) => {
    if (!targetStrategyId.trim()) {
      setFeedback("请先填写策略 ID。")
      return null
    }
    setBusyAction((c) => c ?? "refresh")
    try {
      const nextState = await fetchFlashShieldDemoState(targetStrategyId)
      setDemoState(nextState)
      if (nextState.ok) {
        if (nextState.position) {
          setFeedback(`已加载 ${targetStrategyId} 的链上实时状态。`)
        } else {
          setFeedback(`策略 ${targetStrategyId} 还没有开仓，当前只显示空状态。`)
        }
      } else {
        setFeedback(nextState.message || "读取链上实时状态失败。")
      }
      return nextState
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error"
      setFeedback(`刷新失败：${message}`)
      toast.error("读取链上状态失败", { description: message })
      return null
    } finally {
      setBusyAction((c) => (c === "refresh" ? null : c))
    }
  }, [])

  const pollForProtection = useCallback(async (targetStrategyId: string) => {
    for (let attempt = 0; attempt < 8; attempt += 1) {
      const nextState = await fetchFlashShieldDemoState(targetStrategyId)
      setDemoState(nextState)
      if (nextState.ok && nextState.protection?.appliesToRequestedStrategy) {
        setFeedback(`Reactive 回调已完成，${targetStrategyId} 已在 B 链建立 mock short。`)
        toast.success("B 链已检测到对冲执行")
        return
      }
      setFeedback(`等待 Reactive 回调… 第 ${attempt + 1}/8 次查询`)
      await new Promise((r) => window.setTimeout(r, 4000))
    }
    setFeedback("A 链已触发，B 链结果延迟。可稍后点「刷新状态」。")
    toast.message("B 链尚未匹配", { description: "可稍后手动刷新" })
  }, [])

  async function animatePriceDrop(targetPriceNum: number, durationMs: number) {
    const startPrice = Number(displayMarkPrice || demoState?.position?.markPrice || entryPrice || 100)
    const safeTargetPrice = Number.isFinite(targetPriceNum) ? targetPriceNum : startPrice
    setIsAnimatingPrice(true)
    setFeedback("交易已发出，正在播放价格滑落动画...")
    await new Promise<void>((resolve) => {
      const startTime = performance.now()
      const step = (now: number) => {
        const progress = Math.min(1, (now - startTime) / durationMs)
        const eased = 1 - (1 - progress) * (1 - progress)
        const nextValue = startPrice + (safeTargetPrice - startPrice) * eased
        setDisplayMarkPrice(nextValue.toFixed(2))
        if (progress < 1) {
          animationFrameRef.current = window.requestAnimationFrame(step)
          return
        }
        resolve()
      }
      animationFrameRef.current = window.requestAnimationFrame(step)
    })
    setIsAnimatingPrice(false)
  }

  async function openDemoPosition() {
    if (!isConnected) {
      toast.error("请先连接钱包")
      return
    }
    if (!address) {
      toast.error("无法获取钱包地址")
      return
    }
    if (openInputInvalid) {
      setFeedback("请检查参数：清算阈值 < 开仓价，targetPrice < 清算阈值。")
      toast.error("参数不合法")
      return
    }
    setBusyAction("open")
    try {
      await ensureSepolia()
      const publicClient = getPublicClient(wagmiConfig, { chainId: sepolia.id })
      await publicClient.simulateContract({
        address: simAddr,
        abi: positionRiskSimulatorAbi,
        functionName: "openPosition",
        args: [
          strategyIdBytes,
          BigInt(entryPrice),
          BigInt(liquidationThreshold),
          BigInt(collateralValue),
          BigInt(targetPrice),
        ],
        account: address,
        gas: GAS_OPEN_POSITION,
      })
      const hash = await writeContractAsync({
        address: simAddr,
        abi: positionRiskSimulatorAbi,
        functionName: "openPosition",
        args: [
          strategyIdBytes,
          BigInt(entryPrice),
          BigInt(liquidationThreshold),
          BigInt(collateralValue),
          BigInt(targetPrice),
        ],
        chainId: sepolia.id,
        gas: GAS_OPEN_POSITION,
      })
      await waitForTransactionReceipt(wagmiConfig, { hash })
      setLocalTxs((c) => ({ ...c, openTxHash: hash }))
      setDisplayMarkPrice(entryPrice)
      setFeedback(`开仓成功：${hash}`)
      toast.success("开仓已确认", { description: shortHash(hash) })
      queueMicrotask(() => {
        setRitualMode("open")
        setRitualKey((k) => k + 1)
      })
      await refreshState(strategyId)
    } catch (error) {
      const msg = friendlyErrorMessage(error)
      setFeedback(msg)
      toast.error("开仓失败", { description: msg })
    } finally {
      setBusyAction(null)
    }
  }

  async function triggerNearLiquidation() {
    if (!isConnected) {
      toast.error("请先连接钱包")
      return
    }
    if (!address) {
      toast.error("无法获取钱包地址")
      return
    }
    if (triggerInputInvalid) {
      setFeedback("请先开仓，并填写高于对冲目标价的触发价。")
      toast.error("无法触发")
      return
    }
    setBusyAction("trigger")
    try {
      await ensureSepolia()
      const publicClient = getPublicClient(wagmiConfig, { chainId: sepolia.id })
      await publicClient.simulateContract({
        address: simAddr,
        abi: positionRiskSimulatorAbi,
        functionName: "updateMarkPrice",
        args: [strategyIdBytes, BigInt(markPrice)],
        account: address,
        gas: GAS_UPDATE_MARK_PRICE,
      })
      const hash = await writeContractAsync({
        address: simAddr,
        abi: positionRiskSimulatorAbi,
        functionName: "updateMarkPrice",
        args: [strategyIdBytes, BigInt(markPrice)],
        chainId: sepolia.id,
        gas: GAS_UPDATE_MARK_PRICE,
      })
      await Promise.all([waitForTransactionReceipt(wagmiConfig, { hash }), animatePriceDrop(Number(markPrice), 2200)])
      setLocalTxs((c) => ({ ...c, triggerTxHash: hash }))
      setFeedback(`A 链风险事件已提交：${hash}`)
      toast.success("已触发接近清算", { description: shortHash(hash) })
      queueMicrotask(() => {
        setRitualMode("liquidate")
        setRitualKey((k) => k + 1)
      })
      await refreshState(strategyId)
      await pollForProtection(strategyId)
    } catch (error) {
      const msg = friendlyErrorMessage(error)
      setFeedback(msg)
      toast.error("触发失败", { description: msg })
      if (demoState?.position) {
        setDisplayMarkPrice(demoState.position.markPrice)
      }
      setIsAnimatingPrice(false)
    } finally {
      setBusyAction(null)
    }
  }

  const protection = demoState?.protection
  const callback = demoState?.callback
  const appliesToCurrentStrategy = protection?.appliesToRequestedStrategy ?? false
  const hedgeSizeDisplay = appliesToCurrentStrategy ? protection?.hedgeSize : "未触发"
  const triggerTxHash = callback?.triggerTxHash || localTxs.triggerTxHash
  const protectionTxHash = callback?.protectionTxHash || ""

  const txBusy = isWritePending
  const anyBusy = busyAction !== null || txBusy

  const waitStripTitle = useMemo(() => {
    if (isWritePending) return "请在钱包中确认"
    if (busyAction === "open") return "开仓请求处理中"
    if (busyAction === "trigger") return "触发与跨链同步中"
    if (busyAction === "refresh") return "同步链上状态"
    return ""
  }, [isWritePending, busyAction])

  return (
    <div className="min-h-svh bg-[#F8F5F0] text-[#0A1F3F]">
      <header className="sticky top-0 z-40 border-b border-[#0A1F3F]/15 bg-[#FAF9F6]/95 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-[1100px] items-center justify-between gap-4 px-4">
          <div className="flex min-w-0 items-center gap-3">
            <Button variant="outline" size="sm" asChild>
              <Link to="/dashboard">← 返回大屏</Link>
            </Button>
            <span className="hidden text-sm font-semibold sm:inline">FlashShield · 链上实时</span>
            <ChainBadge />
          </div>
          <div className="flex items-center gap-2">
            <WalletConnectButton />
            <a
              href="https://github.com/SeeMoon357/FlashShield"
              target="_blank"
              rel="noreferrer"
              className="hidden text-[11px] text-[#0A1F3F]/55 underline-offset-2 hover:text-[#0A1F3F] hover:underline sm:inline"
            >
              GitHub
            </a>
          </div>
        </div>
      </header>

      <div className="sticky top-14 z-30">
        <TxWaitStrip active={anyBusy} title={waitStripTitle} detail={anyBusy ? feedback : undefined} />
      </div>

      <main className="mx-auto max-w-[1100px] space-y-6 px-4 py-8">
        {isConnected && chainId !== sepolia.id ? (
          <div className="flex flex-col gap-3 rounded-xl border border-amber-400/50 bg-amber-50 px-4 py-3 text-sm text-amber-900 sm:flex-row sm:items-center sm:justify-between">
            <p>
              当前钱包网络 ID 为 <span className="font-mono font-semibold">{chainId}</span>，而
              <strong className="font-semibold"> 开仓 / 触发 </strong>必须在{" "}
              <strong className="font-semibold">Ethereum Sepolia（11155111）</strong>。Base Sepolia 是{" "}
              <span className="font-mono">84532</span>，不能用于 A 链合约。
            </p>
            <Button
              type="button"
              className="shrink-0 bg-amber-800 text-white hover:bg-amber-900"
              disabled={!switchChainAsync}
              onClick={() =>
                switchChainAsync?.({ chainId: sepolia.id }).catch((e) =>
                  toast.error("切链失败", { description: e instanceof Error ? e.message : String(e) }),
                )
              }
            >
              切换到 Ethereum Sepolia
            </Button>
          </div>
        ) : null}

        <section className="rounded-2xl border border-[#0A1F3F]/15 bg-[#FAF9F6]/90 p-5 shadow-sm backdrop-blur-md">
          <p className="text-[11px] font-medium uppercase tracking-wide text-[#036652]">DApp · 多链</p>
          <h1 className="mt-1 text-xl font-semibold text-[#0A1F3F]">A 链风险事件 → Reactive → B 链保护</h1>
          <p className="mt-2 text-sm leading-relaxed text-[#0A1F3F]/65">
            使用 Wagmi + Viem：钱包连接、切链、合约写入与回执等待；只读状态通过公共 RPC 拉取 Sepolia 与 Base Sepolia。
          </p>
          <dl className="mt-4 grid gap-2 text-[11px] font-mono text-[#0A1F3F]/75 sm:grid-cols-2">
            <div>
              <dt className="text-[#0A1F3F]/50">PositionRiskSimulator</dt>
              <dd className="break-all">{cfg.positionRiskSimulatorAddress}</dd>
            </div>
            <div>
              <dt className="text-[#0A1F3F]/50">ProtectionExecutor</dt>
              <dd className="break-all">{cfg.protectionExecutorAddress}</dd>
            </div>
            <div>
              <dt className="text-[#0A1F3F]/50">ReactiveProtection</dt>
              <dd className="break-all">{cfg.reactiveProtectionAddress}</dd>
            </div>
          </dl>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-[#0A1F3F]/15 bg-[#FAF9F6]/90 p-5">
            <h2 className="text-sm font-semibold text-[#0A1F3F]">控制台</h2>
            <p className="mt-1 text-xs text-[#0A1F3F]/55">{feedback}</p>
            <div className="mt-4 flex justify-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={anyBusy || !strategyId.trim()}
                onClick={() => void refreshState(strategyId)}
              >
                {busyAction === "refresh" ? "刷新中…" : "刷新状态"}
              </Button>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="block text-xs sm:col-span-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[#0A1F3F]/60">策略 ID（公共合约上须唯一）</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 text-[10px]"
                    disabled={anyBusy}
                    onClick={() => setStrategyId(defaultStrategyId())}
                  >
                    生成唯一策略 ID
                  </Button>
                </div>
                <input
                  className="mt-1 w-full rounded-lg border border-[#0A1F3F]/20 bg-[#F2EEE8] px-2 py-1.5 font-mono text-xs"
                  value={strategyId}
                  onChange={(e) => setStrategyId(e.target.value)}
                  placeholder="例如 FS-1730…"
                />
                <p className="mt-1 text-[10px] leading-relaxed text-[#0A1F3F]/45">
                  共享 Sepolia 部署地址时，「FS-LIVE」等短名很容易被占用；若出现 Execution reverted / unknown reason，请换 ID 或点上方按钮。
                </p>
              </label>
              <label className="block text-xs">
                <span className="text-[#0A1F3F]/60">开仓价格</span>
                <input
                  className="mt-1 w-full rounded-lg border border-[#0A1F3F]/20 bg-[#F2EEE8] px-2 py-1.5 font-mono text-xs"
                  value={entryPrice}
                  onChange={(e) => setEntryPrice(e.target.value)}
                />
              </label>
              <label className="block text-xs">
                <span className="text-[#0A1F3F]/60">清算阈值</span>
                <input
                  className="mt-1 w-full rounded-lg border border-[#0A1F3F]/20 bg-[#F2EEE8] px-2 py-1.5 font-mono text-xs"
                  value={liquidationThreshold}
                  onChange={(e) => setLiquidationThreshold(e.target.value)}
                />
              </label>
              <label className="block text-xs">
                <span className="text-[#0A1F3F]/60">触发标价</span>
                <input
                  className="mt-1 w-full rounded-lg border border-[#0A1F3F]/20 bg-[#F2EEE8] px-2 py-1.5 font-mono text-xs"
                  value={markPrice}
                  onChange={(e) => setMarkPrice(e.target.value)}
                />
              </label>
              <label className="block text-xs">
                <span className="text-[#0A1F3F]/60">抵押价值</span>
                <input
                  className="mt-1 w-full rounded-lg border border-[#0A1F3F]/20 bg-[#F2EEE8] px-2 py-1.5 font-mono text-xs"
                  value={collateralValue}
                  onChange={(e) => setCollateralValue(e.target.value)}
                />
              </label>
              <label className="block text-xs">
                <span className="text-[#0A1F3F]/60">对冲目标价</span>
                <input
                  className="mt-1 w-full rounded-lg border border-[#0A1F3F]/20 bg-[#F2EEE8] px-2 py-1.5 font-mono text-xs"
                  value={targetPrice}
                  onChange={(e) => setTargetPrice(e.target.value)}
                />
              </label>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                type="button"
                className="bg-[#0A1F3F] text-white hover:bg-[#102f5e]"
                disabled={!isConnected || anyBusy || openInputInvalid}
                onClick={() => void openDemoPosition()}
              >
                {busyAction === "open" ? "开仓中…" : "1. 开启演示仓位"}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={!isConnected || anyBusy || triggerInputInvalid}
                onClick={() => void triggerNearLiquidation()}
              >
                {busyAction === "trigger" ? "触发中…" : "2. 触发接近清算"}
              </Button>
            </div>
          </div>

          <div className="rounded-2xl border border-[#0A1F3F]/15 bg-[#FAF9F6]/90 p-5">
            <h2 className="text-sm font-semibold text-[#0A1F3F]">执行器状态</h2>
            <p className="mt-2 text-xs text-[#0A1F3F]/60">{protectionStatusLabel(demoState)}</p>
            {demoState?.position ? (
              <div className="mt-4 space-y-3 text-xs">
                {localTxs.openTxHash ? (
                  <p className="font-mono text-[10px] text-[#0A1F3F]/60">
                    开仓 Tx：{" "}
                    <a
                      className="text-[#0A1F3F] underline"
                      href={txExplorerUrl(cfg.originChainId, localTxs.openTxHash)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {shortHash(localTxs.openTxHash)}
                    </a>
                  </p>
                ) : null}
                <p className="text-[#0A1F3F]/65">
                  {isAnimatingPrice ? "动画价展示中…" : demoState.position.note}
                </p>
                <div className="grid grid-cols-2 gap-2 font-mono">
                  <div>
                    <span className="text-[#0A1F3F]/50">开仓</span> ${demoState.position.entryPrice}
                  </div>
                  <div>
                    <span className="text-[#0A1F3F]/50">当前</span> ${displayMarkPrice}
                  </div>
                  <div>
                    <span className="text-[#0A1F3F]/50">清算阈值</span> ${demoState.position.liquidationThreshold}
                  </div>
                  <div>
                    <span className="text-[#0A1F3F]/50">阶段</span> {demoState.position.stage}
                  </div>
                </div>
              </div>
            ) : (
              <p className="mt-4 text-xs text-[#0A1F3F]/50">暂无仓位数据。</p>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-[#036652]/20 bg-[#036652]/5 p-5">
          <h2 className="text-sm font-semibold text-[#036652]">B 链（Base Sepolia · 只读）</h2>
          {demoState ? (
            <dl className="mt-4 grid gap-2 text-xs sm:grid-cols-2">
              <div className="flex justify-between gap-2 sm:col-span-2">
                <dt className="text-[#0A1F3F]/55">对冲规模</dt>
                <dd className="font-mono">{hedgeSizeDisplay}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-[#0A1F3F]/55">方向</dt>
                <dd>{appliesToCurrentStrategy ? hedgeDirectionLabel(protection?.direction ?? 0) : "—"}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-[#0A1F3F]/55">A 链触发 Tx</dt>
                <dd className="font-mono text-[10px]">
                  {triggerTxHash ? (
                    <a
                      className="text-[#0A1F3F] underline"
                      href={txExplorerUrl(cfg.originChainId, triggerTxHash)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {shortHash(triggerTxHash)}
                    </a>
                  ) : (
                    "—"
                  )}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-[#0A1F3F]/55">B 链执行 Tx</dt>
                <dd className="font-mono text-[10px]">
                  {protectionTxHash ? (
                    <a
                      className="text-[#036652] underline"
                      href={txExplorerUrl(cfg.destinationChainId, protectionTxHash)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {shortHash(protectionTxHash)}
                    </a>
                  ) : (
                    "—"
                  )}
                </dd>
              </div>
            </dl>
          ) : (
            <p className="mt-4 text-xs text-[#0A1F3F]/50">点击「刷新状态」加载。</p>
          )}
        </section>
      </main>
      <AsyncCrossChainRitual runKey={ritualKey} mode={ritualMode} />
    </div>
  )
}
