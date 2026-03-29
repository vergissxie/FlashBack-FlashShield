import type { ReactiveDemoConfig } from "@/config/reactiveDemo"
import { hasDeploymentProof } from "@/config/reactiveDemo"

import { shortenAddr } from "./utils"

function AddrRow({
  label,
  address,
}: {
  label: string
  address?: string
}) {
  return (
    <div className="rounded-lg border border-[#0A1F3F]/12 bg-[#F2EEE8]/80 px-3 py-2">
      <div className="text-[10px] font-medium uppercase tracking-wide text-[#0A1F3F]/55">{label}</div>
      <div
        className={`mt-0.5 break-all font-mono text-[11px] ${address ? "text-[#0A1F3F]" : "text-[#0A1F3F]/40"}`}
      >
        {address ?? "未配置 · 复制 .env.example 为 .env"}
      </div>
    </div>
  )
}

function HashRow({ label, hash }: { label: string; hash?: string }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-[#0A1F3F]/8 py-2 last:border-0">
      <span className="text-[10px] text-[#0A1F3F]/55">{label}</span>
      <span className="break-all font-mono text-[11px] text-[#0A1F3F]/85">
        {hash ? hash : "—"}
      </span>
    </div>
  )
}

type DeploymentProofPanelProps = {
  config: ReactiveDemoConfig
}

export function DeploymentProofPanel({ config }: DeploymentProofPanelProps) {
  const ready = hasDeploymentProof(config)

  return (
    <section className="rounded-2xl border border-[#0A1F3F]/15 bg-[#FAF9F6]/90 p-4 shadow-[0_8px_24px_rgba(10,31,63,0.06)] backdrop-blur-md md:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#0A1F3F]/10 pb-3">
        <div>
          <h3 className="text-sm font-semibold text-[#0A1F3F]">睿应层参赛材料 · 部署与验证</h3>
          <p className="mt-1 max-w-3xl text-[11px] leading-relaxed text-[#0A1F3F]/55">
            对照赛方要求：须包含源合约、睿应式合约、目标合约源码与部署脚本；并公开地址与全流程交易哈希（源链 / 睿应执行 /
            目标链）。下列数据来自环境变量，链上跑通后把真实值写入 <span className="font-mono">.env</span> 即可与演示大屏同步。
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-medium ${
            ready ? "bg-[#036652]/12 text-[#036652]" : "bg-[#B07C2D]/12 text-[#8a5f24]"
          }`}
        >
          {ready ? "已配置关键字段" : "待填入部署记录"}
        </span>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div>
          <h4 className="mb-2 text-xs font-semibold text-[#0A1F3F]">合约地址</h4>
          <div className="space-y-2">
            <AddrRow label="源合约 Origin（emit EVM 事件）" address={config.originAddress} />
            <AddrRow label="睿应式合约 Reactive（订阅事件 → Callback）" address={config.reactiveAddress} />
            <AddrRow label="目标合约 Destination（接收跨链回调）" address={config.destinationAddress} />
          </div>
        </div>
        <div>
          <h4 className="mb-2 text-xs font-semibold text-[#0A1F3F]">交易哈希（示例结构）</h4>
          <div className="rounded-lg border border-[#0A1F3F]/12 bg-[#F2EEE8]/50 px-3">
            <HashRow label="源合约部署" hash={config.txOriginDeploy} />
            <HashRow label="睿应合约部署" hash={config.txReactiveDeploy} />
            <HashRow label="目标合约部署" hash={config.txDestinationDeploy} />
            <HashRow label="源链触发（如 crashPrice / PriceDropped）" hash={config.txOriginTrigger} />
            <HashRow label="睿应层执行（按官方浏览器记录填写）" hash={config.txReactiveExecution} />
            <HashRow label="目标链 Callback / openHedge" hash={config.txDestinationCallback} />
          </div>
        </div>
      </div>

      <p className="mt-4 text-[10px] text-[#0A1F3F]/45">
        大屏内地址缩略显示：
        {config.originAddress ? ` 源 ${shortenAddr(config.originAddress)} ·` : ""}
        {config.reactiveAddress ? ` 睿应 ${shortenAddr(config.reactiveAddress)} ·` : ""}
        {config.destinationAddress ? ` 目标 ${shortenAddr(config.destinationAddress)}` : ""}
        {!config.originAddress && !config.reactiveAddress && !config.destinationAddress ? " 未配置" : ""}
      </p>
    </section>
  )
}
