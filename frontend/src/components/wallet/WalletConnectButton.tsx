import { Loader2, LogOut, Wallet } from "lucide-react"
import { useAccount, useBalance, useConnect, useDisconnect } from "wagmi"
import { formatEther } from "viem"

import { shortenAddr } from "@/dashboard/utils"

type Variant = "dashboard" | "landing"

type WalletConnectButtonProps = {
  variant?: Variant
  className?: string
}

/**
 * 标准 DApp 钱包入口：注入钱包（MetaMask 等）、链上余额、断开。
 */
export function WalletConnectButton({ variant = "dashboard", className = "" }: WalletConnectButtonProps) {
  const { address, isConnected, status } = useAccount()
  const { disconnect } = useDisconnect()
  const { connect, connectors, isPending: isConnectPending, error: connectError } = useConnect()
  const { data: balance, isLoading: balLoading } = useBalance({
    address,
    query: { enabled: Boolean(address) },
  })

  const injected = connectors.find((c) => c.type === "injected") ?? connectors[0]

  const isDashboard = variant === "dashboard"

  if (!injected) {
    return (
      <span className={`text-xs text-amber-700 ${className}`}>未检测到钱包连接器</span>
    )
  }

  if (!isConnected || !address) {
    return (
      <button
        type="button"
        disabled={isConnectPending || status === "connecting"}
        onClick={() => connect({ connector: injected })}
        className={
          isDashboard
            ? `group flex shrink-0 items-center gap-2 rounded-xl border border-[#0A1F3F]/20 bg-gradient-to-b from-[#FAF9F6] to-[#E9E8E4] px-3 py-2 text-left shadow-[0_8px_20px_rgba(10,31,63,0.08)] transition hover:border-[#0A1F3F]/35 disabled:opacity-60 ${className}`
            : `flex shrink-0 items-center gap-2 rounded-lg border border-cyan-400/50 bg-cyan-500/15 px-3 py-2 text-xs font-semibold text-cyan-100 shadow-[0_0_18px_rgba(34,211,238,0.2)] transition hover:border-cyan-300 hover:bg-cyan-500/25 disabled:opacity-60 ${className}`
        }
      >
        {isConnectPending || status === "connecting" ? (
          <Loader2 className="h-5 w-5 animate-spin text-[#0A1F3F]" />
        ) : (
          <Wallet className={`h-5 w-5 ${isDashboard ? "text-[#0A1F3F]" : "text-cyan-200"}`} />
        )}
        <span className={isDashboard ? "text-sm font-semibold text-[#0A1F3F]" : ""}>
          {isConnectPending || status === "connecting" ? "连接中…" : "连接钱包"}
        </span>
        {connectError ? (
          <span className="sr-only">{connectError.message}</span>
        ) : null}
      </button>
    )
  }

  const balLabel =
    balLoading || balance === undefined ? "…" : `${Number(formatEther(balance.value)).toFixed(4)} ${balance.symbol}`

  return (
    <div
      className={
        isDashboard
          ? `flex shrink-0 items-center gap-2 rounded-xl border border-[#0A1F3F]/20 bg-gradient-to-b from-[#FAF9F6] to-[#E9E8E4] px-3 py-2 shadow-[0_8px_20px_rgba(10,31,63,0.08)] ${className}`
          : `flex shrink-0 items-center gap-2 rounded-lg border border-white/15 bg-black/40 px-2.5 py-2 backdrop-blur-sm ${className}`
      }
    >
      <span
        className={`h-7 w-7 shrink-0 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 ring-2 ring-white/20 ${isDashboard ? "" : "ring-white/10"}`}
      />
      <div className="min-w-0 flex-1 leading-tight">
        <span
          className={`text-[10px] uppercase ${isDashboard ? "text-[#0A1F3F]/60" : "text-cyan-200/70"}`}
        >
          已连接
        </span>
        <p className={`truncate font-mono text-xs ${isDashboard ? "text-[#0A1F3F]" : "text-white"}`}>
          {shortenAddr(address)}
        </p>
        <p
          className={`font-mono text-[10px] ${isDashboard ? "text-[#0A1F3F]/60" : "text-hero-muted"}`}
        >
          {balLabel}
        </p>
      </div>
      <button
        type="button"
        onClick={() => disconnect()}
        className={
          isDashboard
            ? "rounded-lg border border-[#0A1F3F]/15 p-1.5 text-[#0A1F3F]/70 transition hover:bg-[#0A1F3F]/10"
            : "rounded-md border border-white/10 p-1.5 text-cyan-200/80 transition hover:bg-white/10"
        }
        title="断开连接"
      >
        <LogOut className="h-4 w-4" />
      </button>
    </div>
  )
}
