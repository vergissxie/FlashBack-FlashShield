import { useMemo, useRef, useState } from "react"

export type HedgeStage = "idle" | "risk-capture" | "transmission" | "settlement" | "restored"
export type LogState = "clock" | "pulse" | "check"

export type ChronicleItem = {
  id: string
  title: string
  detail: string
  txHash: string
  state: LogState
}

const BASE_PRICE = 3520
const THRESHOLD_PRICE = 3200

const T_RISK = 500
const T_TRANSMISSION = 3000
const T_SETTLEMENT = 1000

function makeTx(seed: number) {
  return `0x${(seed * 2654435761).toString(16).slice(0, 6)}...${(seed * 1597334677).toString(16).slice(0, 4)}`
}

export function useHedgeSequence() {
  const [stage, setStage] = useState<HedgeStage>("idle")
  const [isRunning, setIsRunning] = useState(false)
  const [sliderPrice, setSliderPrice] = useState(BASE_PRICE)
  const [riskGaugeValue, setRiskGaugeValue] = useState(0.76)
  const [hedgeGaugeValue, setHedgeGaugeValue] = useState(0.32)
  const [tilt, setTilt] = useState(0)
  const [pulseActive, setPulseActive] = useState(false)
  const [logs, setLogs] = useState<ChronicleItem[]>([])
  const runIdRef = useRef(0)

  const appendLog = (title: string, detail: string, state: LogState) => {
    setLogs((prev) => [
      ...prev,
      {
        id: `${Date.now()}-${Math.random()}`,
        title,
        detail,
        state,
        txHash: makeTx(prev.length + 7),
      },
    ])
  }

  const updateLastLogState = (state: LogState) => {
    setLogs((prev) => {
      if (!prev.length) return prev
      const next = [...prev]
      next[next.length - 1] = { ...next[next.length - 1], state }
      return next
    })
  }

  const reset = () => {
    runIdRef.current += 1
    setIsRunning(false)
    setStage("idle")
    setRiskGaugeValue(Math.min(1, Math.max(0, (sliderPrice - 2800) / 900)))
    setHedgeGaugeValue(0.32)
    setTilt(0)
    setPulseActive(false)
    setLogs([])
  }

  const runSequence = () => {
    if (isRunning) return
    const runId = runIdRef.current + 1
    runIdRef.current = runId
    setIsRunning(true)
    setLogs([])
    setStage("risk-capture")
    setPulseActive(false)
    setRiskGaugeValue(0.14)
    setTilt(-18)
    appendLog("风险事件捕获", "源链 EVM 事件（如 PriceDropped）跌破阈值，进入睿应流程。", "clock")

    // Stage 1: 风险捕获 500ms
    window.setTimeout(() => {
      if (runIdRef.current !== runId) return
      updateLastLogState("check")
      setStage("transmission")
      setPulseActive(true)
      setTilt(-15)
      appendLog(
        "睿应编排",
        "睿应式合约解析日志并签发 Callback，模拟跨链异步延迟。",
        "pulse",
      )
    }, T_RISK)

    // Stage 2: 模拟跨链消息在 Reactive Layer 网络中的异步传输延迟 (约2.5秒)
    window.setTimeout(() => {
      if (runIdRef.current !== runId) return
      updateLastLogState("check")
      setStage("settlement")
      setPulseActive(false)
      setHedgeGaugeValue(0.9)
      setTilt(0)
      appendLog(
        "目标链结算",
        "目标合约执行 openHedge，净敞口收敛（演示动画）。",
        "clock",
      )
    }, T_RISK + T_TRANSMISSION)

    // Stage 3: 秩序修复 1500ms
    window.setTimeout(() => {
      if (runIdRef.current !== runId) return
      updateLastLogState("check")
      setStage("restored")
      appendLog("秩序修复完成", "Order Restored：系统回归平衡状态。", "check")
      setIsRunning(false)
    }, T_RISK + T_TRANSMISSION + T_SETTLEMENT)
  }

  const onSliderPriceChange = (nextPrice: number) => {
    setSliderPrice(nextPrice)
    const mapped = Math.min(1, Math.max(0, (nextPrice - 2800) / 900))
    if (!isRunning) {
      setRiskGaugeValue(mapped)
      if (nextPrice < THRESHOLD_PRICE && stage === "idle") runSequence()
    }
  }

  const ui = useMemo(
    () => ({
      basePrice: BASE_PRICE,
      thresholdPrice: THRESHOLD_PRICE,
      statusText:
        stage === "risk-capture"
          ? "Risk Capture"
          : stage === "transmission"
            ? "Asynchronous Transmission"
            : stage === "settlement"
              ? "Settlement In Progress"
              : stage === "restored"
                ? "Order Restored"
                : "System Nominal",
      isTransmission: stage === "transmission",
      isRiskStage: stage === "risk-capture",
    }),
    [stage],
  )

  return {
    stage,
    isRunning,
    sliderPrice,
    riskGaugeValue,
    hedgeGaugeValue,
    tilt,
    pulseActive,
    logs,
    ui,
    setSliderPrice: onSliderPriceChange,
    runSequence,
    reset,
  }
}

