import { Link } from "react-router-dom"

import { WalletConnectButton } from "@/components/wallet/WalletConnectButton"
import { cn } from "@/lib/utils"

/** 锚点导航：与页面各区块 id 对应，配合 html { scroll-behavior: smooth } 平滑滚动 */
const NAV_ITEMS = [
  { href: "#home", label: "Home" },
  { href: "#protocol", label: "The Protocol" },
  { href: "#how-it-works", label: "How It Works" },
  { href: "#whitepaper", label: "Whitepaper" },
] as const

/** 内部仪表盘 SPA（同仓库 Vite 路由） */
const LAUNCH_APP_HREF = "/dashboard"
const LIVE_HREF = "/live"

type SiteNavProps = {
  matrixOn: boolean
  onMatrixToggle: () => void
}

/**
 * 固定顶栏 · 毛玻璃（backdrop-blur + 半透明底 + 细边框）
 * 不包裹页面主体，仅覆盖在 Matrix / 粒子背景之上（z-50）
 */
export function SiteNav({ matrixOn, onMatrixToggle }: SiteNavProps) {
  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 border-b border-white/10",
        "bg-[hsl(262_42%_6%/0.55)] shadow-[0_8px_32px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.06)]",
        "backdrop-blur-xl backdrop-saturate-150",
      )}
    >
      <div className="container flex h-[4rem] max-w-[1280px] items-center gap-3 px-4 sm:gap-4">
        <a
          href="#home"
          className="group flex shrink-0 items-center gap-2 rounded-lg outline-none ring-offset-2 ring-offset-[hsl(262_42%_6%)] focus-visible:ring-2 focus-visible:ring-cyan-400/60"
        >
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400 to-fuchsia-600 font-bold text-[hsl(262_42%_6%)] shadow-[0_0_24px_rgba(34,211,238,0.35)] ring-1 ring-white/20 transition group-hover:shadow-[0_0_32px_rgba(34,211,238,0.5)]">
            FB
          </span>
          <div className="hidden min-w-0 sm:block">
            <p className="truncate text-sm font-semibold tracking-tight text-foreground">
              Flash-Back Protocol
            </p>
            <p className="truncate text-[11px] text-hero-muted">全自动跨链反向对冲</p>
          </div>
        </a>

        <nav
          className="flex min-w-0 flex-1 items-center justify-center gap-0.5 overflow-x-auto px-1 py-1 [-ms-overflow-style:none] [scrollbar-width:none] sm:gap-1 md:gap-2 [&::-webkit-scrollbar]:hidden"
          aria-label="Primary"
        >
          {NAV_ITEMS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="shrink-0 rounded-md px-2 py-1.5 text-[11px] font-medium text-hero-sub transition hover:bg-white/5 hover:text-hero-heading sm:px-2.5 sm:text-xs md:text-sm"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <WalletConnectButton variant="landing" className="flex max-w-[min(42vw,11rem)] shrink-0 sm:max-w-none" />
          <Link
            to={LIVE_HREF}
            className="hidden rounded-lg border border-emerald-400/40 bg-emerald-500/10 px-2 py-1.5 text-[9px] font-semibold uppercase tracking-wide text-emerald-200 shadow-[0_0_14px_rgba(52,211,153,0.2)] transition hover:border-emerald-300/70 hover:bg-emerald-500/20 md:inline md:px-3 md:text-xs"
          >
            Live DApp
          </Link>
          <Link
            to={LAUNCH_APP_HREF}
            className="rounded-lg border border-cyan-400/40 bg-cyan-500/10 px-2 py-1.5 text-[9px] font-semibold uppercase tracking-wide text-cyan-200 shadow-[0_0_16px_rgba(34,211,238,0.2)] transition hover:border-cyan-300/70 hover:bg-cyan-500/20 hover:shadow-[0_0_24px_rgba(34,211,238,0.35)] sm:px-3 sm:text-xs"
          >
            Launch App
          </Link>
          <button
            type="button"
            onClick={onMatrixToggle}
            className="rounded border border-emerald-400/45 bg-black/50 px-2 py-1.5 font-mono text-[9px] leading-none tracking-wide text-emerald-300 shadow-[0_0_18px_rgba(52,211,153,0.28)] transition hover:border-emerald-300/80 hover:shadow-[0_0_26px_rgba(52,211,153,0.45)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/50 sm:px-2.5 sm:text-[10px]"
            aria-pressed={matrixOn}
            title={matrixOn ? "关闭数字雨背景" : "开启数字雨背景"}
          >
            [ MATRIX: {matrixOn ? "ON" : "OFF"} ]
          </button>
        </div>
      </div>
    </header>
  )
}
