import { Activity, Globe2, Layers, Shield } from "lucide-react"

import type { SystemStatus } from "./types"
import { formatUsd } from "./utils"

type KpiCardsProps = {
  ethPrice: number
  hedgeValue: number
  systemStatus: SystemStatus
}

function StatusBadge({ status }: { status: SystemStatus }) {
  const map = {
    monitoring: { icon: "🟢", label: "监控中", className: "text-[#036652] border-[#036652]/35 bg-[#036652]/10" },
    idle: { icon: "🟡", label: "等待触发", className: "text-[#B07C2D] border-[#B07C2D]/35 bg-[#B07C2D]/10" },
    executing: { icon: "🔴", label: "对冲执行中", className: "text-[#B7410E] border-[#B7410E]/35 bg-[#B7410E]/10" },
  }
  const m = map[status]
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${m.className}`}
    >
      <span aria-hidden>{m.icon}</span>
      {m.label}
    </span>
  )
}

export function KpiCards({ ethPrice, hedgeValue, systemStatus }: KpiCardsProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <div className="rounded-xl border border-[#0A1F3F]/15 bg-[#FAF9F6]/90 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] backdrop-blur-md">
        <div className="flex items-center gap-2 text-[#0A1F3F]/65">
          <Activity className="h-4 w-4 text-[#0A1F3F]" />
          <span className="text-xs">监控资产</span>
        </div>
        <p className="mt-2 text-lg font-semibold text-[#0A1F3F]">ETH / USD</p>
        <p className="text-[11px] text-[#0A1F3F]/50">预言机喂价 · 演示</p>
      </div>

      <div className="rounded-xl border border-[#0A1F3F]/15 bg-[#FAF9F6]/90 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] backdrop-blur-md">
        <div className="flex items-center gap-2 text-[#0A1F3F]/65">
          <Globe2 className="h-4 w-4 text-[#B7410E]" />
          <span className="text-xs">风险链 (A)</span>
        </div>
        <p className="mt-2 text-sm text-[#0A1F3F]/75">Ethereum Sepolia</p>
        <p className="mt-1 font-mono text-lg font-semibold text-[#0A1F3F]">
          当前价格: {formatUsd(ethPrice)}
        </p>
      </div>

      <div className="rounded-xl border border-[#0A1F3F]/15 bg-[#FAF9F6]/90 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] backdrop-blur-md">
        <div className="flex items-center gap-2 text-[#0A1F3F]/65">
          <Layers className="h-4 w-4 text-[#036652]" />
          <span className="text-xs">对冲链 (B)</span>
        </div>
        <p className="mt-2 text-sm text-[#0A1F3F]/75">Polygon Mumbai</p>
        <p className="mt-1 font-mono text-lg font-semibold text-[#036652]">
          已对冲价值: {formatUsd(hedgeValue)}
        </p>
      </div>

      <div className="rounded-xl border border-[#0A1F3F]/15 bg-[#FAF9F6]/90 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] backdrop-blur-md">
        <div className="flex items-center gap-2 text-[#0A1F3F]/65">
          <Shield className="h-4 w-4 text-[#0A1F3F]" />
          <span className="text-xs">系统状态</span>
        </div>
        <p className="mt-3">
          <StatusBadge status={systemStatus} />
        </p>
      </div>
    </div>
  )
}
