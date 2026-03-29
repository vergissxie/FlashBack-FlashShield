import { useCallback, useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { useAccount } from "wagmi"

import { reactiveDemoConfig } from "@/config/reactiveDemo"

import { INITIAL_HISTORY } from "./constants"
import { ControlPanel } from "./ControlPanel"
import { DeploymentProofPanel } from "./DeploymentProofPanel"
import { FlowVisualization } from "./FlowVisualization"
import { HistoryTable } from "./HistoryTable"
import { KpiCards } from "./KpiCards"
import { Navbar } from "./Navbar"
import type { FlowPhase, HedgeHistoryRow, LastTx, SystemStatus } from "./types"
import { buildChartPoints, demoPlaceholderTxHash, formatUsd, shortenAddr } from "./utils"

const INITIAL_PRICE = 3250.8
const INITIAL_THRESHOLD = 3200
const INITIAL_HEDGE = 0

export function Dashboard() {
  const { isConnected } = useAccount()
  const prevConnectedRef = useRef(false)
  const [monitorArmed, setMonitorArmed] = useState(false)
  const [asset, setAsset] = useState("ETH")
  const [hedgeRatio, setHedgeRatio] = useState(120)
  const [heartbeatSecAgo, setHeartbeatSecAgo] = useState(5)
  const [pendingMessages, setPendingMessages] = useState(0)
  const [hedgeCount, setHedgeCount] = useState(0)
  const [ethPrice, setEthPrice] = useState(INITIAL_PRICE)
  const [threshold, setThreshold] = useState(INITIAL_THRESHOLD)
  const [hedgeValue, setHedgeValue] = useState(INITIAL_HEDGE)
  const [systemStatus, setSystemStatus] = useState<SystemStatus>("monitoring")
  const [flowPhase, setFlowPhase] = useState<FlowPhase>("idle")
  const [reactorMessages, setReactorMessages] = useState<string[]>([])
  const [lastTx, setLastTx] = useState<LastTx | null>(null)
  const [history, setHistory] = useState<HedgeHistoryRow[]>(() => [...INITIAL_HISTORY])
  const [chartData, setChartData] = useState(() => buildChartPoints(INITIAL_PRICE))
  const [isSimulating, setIsSimulating] = useState(false)
  const simulateLockRef = useRef(false)

  const timersRef = useRef<number[]>([])

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((id) => window.clearTimeout(id))
    timersRef.current = []
  }, [])

  useEffect(() => {
    return () => clearTimers()
  }, [clearTimers])

  useEffect(() => {
    const id = window.setInterval(() => {
      setHeartbeatSecAgo((s) => (s >= 59 ? 1 : s + 1))
    }, 1000)
    return () => window.clearInterval(id)
  }, [])

  useEffect(() => {
    setChartData(buildChartPoints(ethPrice))
  }, [ethPrice])

  useEffect(() => {
    if (prevConnectedRef.current && !isConnected) {
      setMonitorArmed(false)
      setSystemStatus("idle")
      setReactorMessages(["钱包已断开，请重新连接或使用顶部按钮再次连接。"])
      toast.message("钱包已断开")
    }
    if (!prevConnectedRef.current && isConnected) {
      setSystemStatus("idle")
      setReactorMessages(["钱包已连接，请点击「开始监控」或使用 /live 进行链上操作。"])
    }
    prevConnectedRef.current = isConnected
  }, [isConnected])

  const handleReset = useCallback(() => {
    clearTimers()
    simulateLockRef.current = false
    setIsSimulating(false)
    setEthPrice(INITIAL_PRICE)
    setThreshold(INITIAL_THRESHOLD)
    setHedgeValue(INITIAL_HEDGE)
    setHedgeCount(0)
    setSystemStatus("monitoring")
    setMonitorArmed(false)
    setFlowPhase("idle")
    setReactorMessages([])
    setPendingMessages(0)
    setLastTx(null)
    setHistory([...INITIAL_HISTORY].slice(0, 0))
  }, [clearTimers])

  const handleStartMonitoring = useCallback(() => {
    if (!isConnected) {
      setReactorMessages(["请先在右上角连接钱包（MetaMask 等注入钱包）"])
      setSystemStatus("idle")
      toast.error("请先连接钱包")
      return
    }
    setMonitorArmed(true)
    setSystemStatus("monitoring")
    setFlowPhase("idle")
    setReactorMessages([
      "系统已进入监听状态（演示：真实流程由源链 emit → 睿应 subscribe → 目标 Callback）",
      `监听目标：${asset}/USD，阈值 ${formatUsd(threshold)} · 源链 ${reactiveDemoConfig.originChainLabel}`,
    ])
    setPendingMessages(0)
  }, [asset, threshold, isConnected])

  const handleSimulateCrash = useCallback(() => {
    if (simulateLockRef.current || !isConnected || !monitorArmed) return
    simulateLockRef.current = true
    clearTimers()
    setIsSimulating(true)
    setLastTx(null)
    setSystemStatus("executing")
    /**
     * 演示：将价格打到 $3150（低于默认阈值 $3200）。
     * 链上对应：源合约 crashPrice → PriceDropped（EVM 日志）→ 睿应 react → 目标 openHedge。
     */
    const crashPrice = 3150
    setEthPrice(crashPrice)
    setFlowPhase("oracle")
    setReactorMessages(["源链：等待 / 模拟 PriceDropped 事件…"])
    setPendingMessages(1)

    const t1 = window.setTimeout(() => {
      // Stage 1: 风险捕获 (0.5s)
      setFlowPhase("oracle")
      setReactorMessages([
        `源链：捕获 EVM 事件 PriceDropped（演示价 ${formatUsd(crashPrice)}）`,
      ])
    }, 500)
    timersRef.current.push(t1)

    const t2 = window.setTimeout(() => {
      // Stage 2: 跨链传导 (3s)
      setFlowPhase("reactor")
      setReactorMessages([
        "源链：PriceDropped 已入块（indexed user + data 中 hedgeAmount）",
        "睿应式合约：解析 log.topic / log.data，emit Callback(chainId, exchange, gas, payload)",
        `参数演算：对冲规模 ${(1.0 * (hedgeRatio / 100)).toFixed(1)} ETH（演示）`,
        `目标链：${reactiveDemoConfig.destChainLabel} 等待 Callback 执行 openHedge`,
      ])
      setPendingMessages(1)
    }, 700)
    timersRef.current.push(t2)

    const t3 = window.setTimeout(() => {
      // Stage 3: 秩序修复 (1s)
      setFlowPhase("execute")
      const sizeEth = Number((1.0 * (hedgeRatio / 100)).toFixed(1))
      const estPnlUsd = Number((sizeEth * crashPrice).toFixed(2))
      const cfg = reactiveDemoConfig
      const destFull = cfg.txDestinationCallback
      const originFull = cfg.txOriginTrigger
      const reactFull = cfg.txReactiveExecution
      const fallbackDest = demoPlaceholderTxHash()
      const tx: LastTx = {
        asset,
        sizeEth,
        estPnlUsd,
        txHash: shortenAddr(destFull ?? fallbackDest),
        destTxHash: destFull,
        originTxHash: originFull,
        reactiveTxHash: reactFull,
      }
      setLastTx(tx)
      setHedgeValue((v) => v + estPnlUsd)
      setHedgeCount((c) => c + 1)
      setPendingMessages(0)
      const row: HedgeHistoryRow = {
        id: `h-${Date.now()}`,
        time: new Date().toLocaleString("zh-CN", { hour12: false }),
        triggerPrice: formatUsd(crashPrice),
        hedgeChain: reactiveDemoConfig.destChainLabel,
        size: `${sizeEth} ETH`,
        estPnl: `+${formatUsd(estPnlUsd)}`,
        status: "success",
        destTxHash: destFull ?? fallbackDest,
      }
      setHistory((h) => [row, ...h])
      setReactorMessages((old) => [
        ...old,
        `目标链：openHedge 已执行（Tx ${tx.txHash}）`,
      ])
    }, 3700)
    timersRef.current.push(t3)

    const t4 = window.setTimeout(() => {
      setFlowPhase("done")
      setReactorMessages((old) => [...old, "路由完成 / 资金敞口归零"])
    }, 4700)
    timersRef.current.push(t4)

    const t5 = window.setTimeout(() => {
      setFlowPhase("idle")
      setReactorMessages(["等待下一次价格事件..."])
      setSystemStatus("monitoring")
      setIsSimulating(false)
      simulateLockRef.current = false
    }, 5400)
    timersRef.current.push(t5)
  }, [asset, clearTimers, hedgeRatio, monitorArmed, isConnected])

  return (
    <div className="min-h-svh bg-[#F8F5F0] text-[#0A1F3F]">
      <Navbar
        originChainLabel={reactiveDemoConfig.originChainLabel}
        destChainLabel={reactiveDemoConfig.destChainLabel}
      />

      <div className="mx-auto max-w-[1400px] space-y-6 px-4 py-6">
        <KpiCards ethPrice={ethPrice} hedgeValue={hedgeValue} systemStatus={systemStatus} />

        <DeploymentProofPanel config={reactiveDemoConfig} />

        <div className="grid gap-6 lg:grid-cols-4 lg:items-start">
          <div className="space-y-6 lg:col-span-3">
            <FlowVisualization
              chartData={chartData}
              walletConnected={isConnected}
              asset={asset}
              ethPrice={ethPrice}
              threshold={threshold}
              hedgeRatio={hedgeRatio}
              heartbeatSecAgo={heartbeatSecAgo}
              pendingMessages={pendingMessages}
              hedgeCount={hedgeCount}
              hedgeValue={hedgeValue}
              flowPhase={flowPhase}
              reactorMessages={reactorMessages}
              lastTx={lastTx}
            />
          </div>
          <div className="lg:col-span-1">
            <ControlPanel
              walletConnected={isConnected}
              monitorArmed={monitorArmed}
              ethPrice={ethPrice}
              onPriceChange={setEthPrice}
              asset={asset}
              onAssetChange={setAsset}
              threshold={threshold}
              onThresholdChange={setThreshold}
              hedgeRatio={hedgeRatio}
              onHedgeRatioChange={setHedgeRatio}
              onSimulateCrash={handleSimulateCrash}
              onStartMonitoring={handleStartMonitoring}
              onReset={handleReset}
              disabled={isSimulating}
            />
          </div>
        </div>

        <HistoryTable rows={history} />
      </div>
    </div>
  )
}
