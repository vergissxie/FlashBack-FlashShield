import { Link } from "react-router-dom"
import { ArrowLeft, Link2, Zap } from "lucide-react"

import { ChainBadge } from "@/components/wallet/ChainBadge"
import { WalletConnectButton } from "@/components/wallet/WalletConnectButton"

type NavbarProps = {
  originChainLabel: string
  destChainLabel: string
}

export function Navbar({ originChainLabel, destChainLabel }: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-[#0A1F3F]/15 bg-[#FAF9F6]/90 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-[1400px] items-center justify-between gap-4 px-4">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            to="/"
            className="flex shrink-0 items-center gap-1 rounded-lg border border-[#0A1F3F]/15 bg-[#F2EEE8] px-2 py-1.5 text-[11px] text-[#0A1F3F] transition hover:border-[#0A1F3F]/30"
            title="返回落地页"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Landing</span>
          </Link>
          <Link
            to="/live"
            className="hidden shrink-0 rounded-lg border border-[#036652]/25 bg-[#036652]/8 px-2 py-1.5 text-[11px] font-medium text-[#036652] transition hover:border-[#036652]/40 sm:inline"
            title="FlashShield 链上实时（Sepolia + Base Sepolia）"
          >
            FlashShield 链上
          </Link>
          <div className="flex items-center gap-2">
            <div className="flex h-9 items-center gap-1.5 rounded-lg bg-gradient-to-r from-[#E9E8E4] to-[#E6D5B8] px-2.5 ring-1 ring-[#0A1F3F]/20">
              <Zap className="h-4 w-4 text-[#0A1F3F]" aria-hidden />
              <span className="font-mono text-sm font-bold tracking-tighter text-[#0A1F3F]">
                FLASH-BACK
              </span>
            </div>
            <div className="hidden items-center gap-1.5 rounded-full border border-[#0A1F3F]/15 bg-[#F2EEE8] px-2.5 py-1 text-[10px] text-[#0A1F3F]/75 sm:flex">
              <Link2 className="h-3 w-3 text-[#0A1F3F]" aria-hidden />
              <span className="font-mono">
                源链 {originChainLabel} · 目标 {destChainLabel}
              </span>
            </div>
            <div className="hidden sm:block">
              <ChainBadge />
            </div>
          </div>
        </div>

        <WalletConnectButton />
      </div>
    </header>
  )
}

