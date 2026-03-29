import {
  motion,
  useReducedMotion,
} from "framer-motion"
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { reactiveDemoConfig } from "@/config/reactiveDemo"

import type { FlowPhase, LastTx } from "./types"
import { formatUsd, shortenAddr } from "./utils"

type FlowVisualizationProps = {
  chartData: { t: string; value: number }[]
  walletConnected: boolean
  asset: string
  ethPrice: number
  threshold: number
  hedgeRatio: number
  heartbeatSecAgo: number
  pendingMessages: number
  hedgeCount: number
  hedgeValue: number
  flowPhase: FlowPhase
  reactorMessages: string[]
  lastTx: LastTx | null
}

function FlowConnector({ active }: { active: boolean }) {
  return (
    <div
      className={`relative h-1 flex-1 overflow-hidden rounded-full bg-[#d8d6cf] ${
        active ? "animate-flow-beam" : ""
      }`}
    >
      <div
        className={`absolute inset-y-0 left-0 w-full bg-gradient-to-r from-[#0A1F3F]/20 via-[#0A1F3F] to-[#0A1F3F]/20 ${
          active ? "opacity-100" : "opacity-30"
        }`}
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="h-1 w-1 rounded-full bg-[#0A1F3F]" />
      </div>
    </div>
  )
}

export function FlowVisualization({
  chartData,
  walletConnected,
  asset,
  ethPrice,
  threshold,
  hedgeRatio,
  heartbeatSecAgo,
  pendingMessages,
  hedgeCount,
  hedgeValue,
  flowPhase,
  reactorMessages,
  lastTx,
}: FlowVisualizationProps) {
  const cfg = reactiveDemoConfig
  const reduce = useReducedMotion()
  const priceBelow = ethPrice < threshold
  const reactorHot = flowPhase === "reactor" || flowPhase === "execute" || flowPhase === "done"
  const contractLit = flowPhase === "execute" || flowPhase === "done"

  return (
    <section className="rounded-2xl border border-[#0A1F3F]/15 bg-[#FAF9F6]/90 p-4 shadow-[0_10px_28px_rgba(10,31,63,0.08)] backdrop-blur-md md:p-6">
      <h2 className="text-center text-lg font-semibold text-[#0A1F3F] md:text-xl">睿应层：源链事件 → 睿应订阅 → 目标链回调</h2>
      <p className="mt-1 text-center text-xs text-[#0A1F3F]/55">
        源合约（{cfg.originChainLabel}）→ 睿应式合约（Reactive）→ 目标合约（{cfg.destChainLabel}）· 大屏为编排演示；链上请以合约与
        tx 哈希为准
      </p>

      <div className="mt-8 flex flex-col items-stretch gap-6 lg:flex-row lg:items-stretch lg:gap-2">
        {/* 节点 1：预言机 */}
        <div
          className={`relative flex min-h-[280px] min-w-0 flex-1 flex-col rounded-xl border p-4 transition-shadow md:min-h-[300px] ${
            priceBelow
              ? "border-[#B7410E]/60 shadow-[0_0_20px_rgba(183,65,14,0.25)] animate-alert-flash"
              : "border-[#0A1F3F]/15 shadow-inner"
          }`}
        >
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-[#0A1F3F]">源合约 · {cfg.originChainLabel}</span>
            <span className="rounded bg-[#0A1F3F]/8 px-2 py-0.5 font-mono text-[10px] text-[#0A1F3F]/60">
              Origin
            </span>
          </div>
          <p className="text-sm font-medium text-[#0A1F3F]">{asset}/USD · 模拟喂价（链上为 Oracle / crashPrice）</p>
          <div className="mt-3 h-[180px] w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#0A1F3F33" opacity={0.5} />
                <XAxis dataKey="t" tick={{ fill: "#0A1F3F99", fontSize: 10 }} />
                <YAxis
                  domain={["dataMin - 40", "dataMax + 40"]}
                  tick={{ fill: "#0A1F3F99", fontSize: 10 }}
                  width={48}
                />
                <Tooltip
                  contentStyle={{
                    background: "#FAF9F6",
                    border: "1px solid rgba(10,31,63,0.15)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  formatter={(v) => {
                    const n = typeof v === "number" ? v : Number(v ?? 0)
                    return [formatUsd(n), "ETH/USD"]
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#0A1F3F"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: "#0A1F3F" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-2 font-mono text-xs text-[#0A1F3F]/70">当前价格: {formatUsd(ethPrice)}</p>
          <p className="mt-1 font-mono text-xs text-[#0A1F3F]/70">触发阈值: <span className="text-[#B7410E]">{formatUsd(threshold)}</span></p>
          <p className="mt-1 text-xs text-[#0A1F3F]/55">{walletConnected ? "🟢 监控中" : "⚪ 请先连接钱包"}</p>
        </div>

        <div className="hidden items-center px-1 lg:flex lg:flex-col lg:justify-center">
          <FlowConnector active={flowPhase !== "idle"} />
        </div>
        <div className="h-px w-full bg-gradient-to-r from-transparent via-[#0A1F3F]/30 to-transparent lg:hidden" />

        {/* 节点 2：反应堆 */}
        <div
          className={`relative flex min-h-[280px] min-w-0 flex-1 flex-col items-center justify-center rounded-xl border p-4 transition-shadow duration-300 md:min-h-[300px] ${
            reactorHot
              ? "border-[#0A1F3F]/45 bg-[#0A1F3F]/5 shadow-[0_0_28px_rgba(10,31,63,0.16)]"
              : "border-[#0A1F3F]/15"
          }`}
        >
          <span className="text-xs font-medium text-[#0A1F3F]">Reactive Layer</span>
          <p className="mt-1 text-sm font-semibold text-[#0A1F3F]">睿应式合约</p>
          <div className="relative mt-4 flex h-24 w-24 items-center justify-center rounded-lg border-2 border-[#0A1F3F]/35 bg-gradient-to-br from-[#E9E8E4] to-[#F2EEE8] shadow-[inset_0_0_20px_rgba(10,31,63,0.08)]">
            <svg viewBox="0 0 64 64" className="h-16 w-16 text-[#0A1F3F]" aria-hidden>
              <rect
                x="8"
                y="8"
                width="48"
                height="48"
                rx="6"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              />
              <path d="M20 32h24M32 20v24" stroke="currentColor" strokeWidth="1.5" />
              <circle cx="32" cy="32" r="4" fill="currentColor" />
            </svg>
            {reactorHot && (
              <div
                className="pointer-events-none absolute inset-0 rounded-lg ring-2 ring-[#0A1F3F]/30"
                aria-hidden
              />
            )}
            {reactorHot &&
              !reduce &&
              Array.from({ length: 8 }).map((_, i) => (
                <motion.span
                  key={i}
                  className="pointer-events-none absolute h-1 w-1 rounded-full bg-[#0A1F3F]"
                  initial={{ opacity: 0, x: 0, y: 0 }}
                  animate={{
                    opacity: [0, 1, 0],
                    x: [0, Math.cos((i / 8) * Math.PI * 2) * 24],
                    y: [0, Math.sin((i / 8) * Math.PI * 2) * 24],
                  }}
                  transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.08 }}
                />
              ))}
          </div>
          <div className="mt-3 grid w-full grid-cols-2 gap-3">
            <div className="relative rounded-lg border border-[#0A1F3F]/15 bg-[#F2EEE8] p-2">
              <div className="text-[10px] text-[#0A1F3F]/60">Clock Sync</div>
              <div className="relative mx-auto mt-1 h-10 w-10 rounded-full border border-[#0A1F3F]/40">
                <div className="absolute left-1/2 top-1/2 h-4 w-[1.5px] -translate-x-1/2 -translate-y-full">
                  <motion.div
                    className="h-full w-full origin-bottom bg-[#0A1F3F]"
                    animate={{ rotate: reactorHot ? [0, 180, 360] : 0 }}
                    transition={{
                      duration: 1.2,
                      repeat: reactorHot ? Infinity : 0,
                      ease: "linear",
                    }}
                  />
                </div>
              </div>
            </div>
            <div className="relative rounded-lg border border-[#0A1F3F]/15 bg-[#F2EEE8] p-2">
              <div className="text-[10px] text-[#0A1F3F]/60">Balance</div>
              <motion.div
                className="relative mx-auto mt-1 h-24 w-full max-w-[220px]"
                animate={{ rotate: flowPhase === "reactor" ? [-9, 7, -5, 3, 0] : flowPhase === "execute" ? [-4, -1, 0] : 0 }}
                transition={{ duration: 1.1, repeat: flowPhase === "reactor" ? Infinity : 0 }}
              >
                {/* London-style dual-gauge balance: navy risk pan + gold hedge pan */}
                <svg viewBox="0 0 260 170" className="h-full w-full" aria-hidden>
                  <defs>
                    <linearGradient id="beamNavy" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#1b325d" />
                      <stop offset="100%" stopColor="#0A1F3F" />
                    </linearGradient>
                    <linearGradient id="goldFill" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#f1e4ca" />
                      <stop offset="50%" stopColor="#E6D5B8" />
                      <stop offset="100%" stopColor="#c9aa72" />
                    </linearGradient>
                    <linearGradient id="navyFill" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#345084" />
                      <stop offset="100%" stopColor="#172e58" />
                    </linearGradient>
                  </defs>

                  <path d="M112 136 L148 136 L142 162 L118 162 Z" fill="url(#goldFill)" stroke="#b9965c" strokeWidth="1.7" />
                  <path d="M112 136 L130 78 L148 136 Z" fill="url(#goldFill)" stroke="#b9965c" strokeWidth="1.7" />
                  <circle cx="130" cy="78" r="6.5" fill="url(#goldFill)" stroke="#b9965c" strokeWidth="1.5" />
                  <g transform="rotate(-10 130 78)">
                    <rect x="38" y="76" width="184" height="12" rx="6" fill="url(#beamNavy)" />
                  </g>

                  <g transform="rotate(-10 130 78)">
                    <rect x="52" y="88" width="4" height="24" rx="2" fill="#0A1F3F" />
                    <rect x="204" y="88" width="4" height="24" rx="2" fill="#0A1F3F" />
                    <ellipse cx="54" cy="112" rx="26" ry="7" fill="url(#goldFill)" stroke="#b9965c" strokeWidth="1.3" />
                    <ellipse cx="206" cy="112" rx="26" ry="7" fill="url(#goldFill)" stroke="#b9965c" strokeWidth="1.3" />
                  </g>

                  <path d="M20 58 Q54 28 88 58 L88 100 L20 100 Z" fill="url(#navyFill)" stroke="#274475" strokeWidth="2.2" />
                  <path d="M172 40 Q206 12 240 40 L240 100 L172 100 Z" fill="url(#goldFill)" stroke="#b9965c" strokeWidth="2.2" />

                  <line x1="54" y1="62" x2="54" y2="98" stroke="#E6D5B8" strokeWidth="2.2" />
                  <line x1="206" y1="48" x2="206" y2="98" stroke="#b9965c" strokeWidth="2.2" />
                  <text x="54" y="20" textAnchor="middle" fontSize="10" fill="#0A1F3F">LEFT</text>
                  <text x="206" y="20" textAnchor="middle" fontSize="10" fill="#0A1F3F">RIGHT</text>
                </svg>
              </motion.div>
            </div>
            {reactorHot &&
              !reduce &&
              Array.from({ length: 10 }).map((_, i) => (
                <motion.span
                  key={`p-${i}`}
                  className="pointer-events-none absolute left-1/2 top-1/2 h-1 w-1 rounded-full bg-[#0A1F3F]/90"
                  initial={{ opacity: 0, x: 0, y: 0 }}
                  animate={{
                    opacity: [0, 1, 0],
                    x: [0, Math.cos((i / 10) * Math.PI * 2) * 38],
                    y: [0, Math.sin((i / 10) * Math.PI * 2) * 28],
                  }}
                  transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.06 }}
                />
              ))}
          </div>
          <p className="mt-2 text-[11px] text-[#0A1F3F]/65">
            连接状态：{walletConnected ? `演示钱包已连接（${cfg.originChainLabel} / ${cfg.destChainLabel}）` : "未连接"}
          </p>
          <p className="mt-1 text-[11px] text-[#0A1F3F]/65">最近心跳：{heartbeatSecAgo}秒前</p>
          <p className="mt-1 text-[11px] text-[#0A1F3F]/65">待处理消息：{pendingMessages}</p>
          <ul className="mt-3 min-h-[4.5rem] w-full space-y-1 rounded border border-[#0A1F3F]/15 bg-[#F2EEE8] p-2 text-left text-[11px] text-[#0A1F3F]/75">
            {reactorMessages.length ? (
              reactorMessages.map((m, idx) => <li key={`${m}-${idx}`}>[{idx + 1}] {m}</li>)
            ) : (
              <li>等待新事件...</li>
            )}
          </ul>
          {reactorHot && (
            <div className="mt-2 h-1 w-full max-w-[120px] overflow-hidden rounded-full bg-[#d8d6cf]">
              <div className="h-full w-2/5 animate-pulse rounded-full bg-[#0A1F3F]" />
            </div>
          )}
        </div>

        <div className="hidden items-center px-1 lg:flex lg:flex-col lg:justify-center">
          <FlowConnector active={flowPhase === "execute" || flowPhase === "done"} />
        </div>
        <div className="h-px w-full bg-gradient-to-r from-transparent via-[#0A1F3F]/30 to-transparent lg:hidden" />

        {/* 节点 3：B 链合约 */}
        <div
          className={`flex min-h-[280px] min-w-0 flex-1 flex-col rounded-xl border p-4 md:min-h-[300px] ${
            contractLit
              ? "border-[#036652]/50 bg-[#036652]/5 shadow-[0_0_20px_rgba(3,102,82,0.15)]"
              : "border-[#0A1F3F]/15"
          }`}
        >
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-medium text-[#036652]">目标合约 · {cfg.destChainLabel}</span>
            <span className="rounded bg-[#0A1F3F]/8 px-2 py-0.5 font-mono text-[10px] text-[#0A1F3F]/60">
              Destination
            </span>
          </div>
          <p className="text-sm font-medium text-[#0A1F3F]">
            FlashShieldExchange:{" "}
            {cfg.destinationAddress ? shortenAddr(cfg.destinationAddress) : "未配置（VITE_DESTINATION_CONTRACT_ADDRESS）"}
          </p>
          <p className="mt-1 text-xs text-[#0A1F3F]/65">已对冲总额: <span className="font-mono text-[#036652]">{formatUsd(hedgeValue)}</span></p>
          <p className="text-xs text-[#0A1F3F]/65">对冲笔数: <span className="font-mono text-[#0A1F3F]">{hedgeCount}</span></p>
          <div className="mt-3 flex-1 rounded-lg border border-dashed border-[#0A1F3F]/20 bg-[#F2EEE8] p-3">
            {lastTx ? (
              <ul className="space-y-2 text-xs text-[#0A1F3F]/80">
                <li className="text-[#0A1F3F]">[Callback] 目标合约收到跨链 payload</li>
                <li className="text-[#0A1F3F]">[openHedge] 演示规模：{lastTx.sizeEth} ETH</li>
                <li className="text-[#036652]">
                  [目标链 Tx]{" "}
                  {lastTx.destTxHash
                    ? shortenAddr(lastTx.destTxHash)
                    : (lastTx.txHash ?? "—")}
                </li>
                {lastTx.originTxHash ? (
                  <li className="font-mono text-[10px] text-[#0A1F3F]/65">
                    源链触发 Tx：{shortenAddr(lastTx.originTxHash)}
                  </li>
                ) : null}
                {lastTx.reactiveTxHash ? (
                  <li className="font-mono text-[10px] text-[#0A1F3F]/65">
                    睿应执行 Tx：{shortenAddr(lastTx.reactiveTxHash)}
                  </li>
                ) : null}
                <li>
                  标的: <span className="font-mono text-[#0A1F3F]">{lastTx.asset}</span>
                </li>
                <li>
                  规模:{" "}
                  <span className="font-mono text-[#0A1F3F]">{lastTx.sizeEth} ETH</span>
                </li>
                <li>
                  预估盈亏:{" "}
                  <span className="font-mono text-[#036652]">
                    +{formatUsd(lastTx.estPnlUsd)}
                  </span>
                </li>
              </ul>
            ) : (
              <p className="text-xs text-[#0A1F3F]/50">等待睿应式合约发出 Callback 并在目标链结算…</p>
            )}
          </div>
          <p className="mt-2 text-[11px] text-[#0A1F3F]/50">对冲比例：{hedgeRatio.toFixed(0)}%</p>
        </div>
      </div>
    </section>
  )
}
