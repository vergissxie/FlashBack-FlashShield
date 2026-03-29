import { motion, useReducedMotion } from "framer-motion"
import { ArrowUpRight, Zap } from "lucide-react"

/**
 * Demo 视频占位：三栏动态插画 — Sepolia 暴跌 / Reactive 闪烁 / Polygon 盈利爬升 → 曲线交汇抵消
 */
export function DemoIllustration() {
  const reduce = useReducedMotion()

  return (
    <section className="container py-16 md:py-24" aria-labelledby="demo-title">
      <h2
        id="demo-title"
        className="text-center text-2xl font-semibold text-hero-heading md:text-3xl"
      >
        Demo 过程（动态示意）
      </h2>
      <div className="mt-10 grid gap-4 md:grid-cols-3 md:gap-6">
        <div className="rounded-2xl border border-red-500/25 bg-black/45 p-4 shadow-[0_0_24px_rgba(0,0,0,0.35)] ring-1 ring-red-500/15 backdrop-blur-lg">
          <p className="text-xs font-mono text-red-300/90">Sepolia</p>
          <div className="relative mt-3 h-28 overflow-hidden rounded-xl bg-gradient-to-b from-red-950/50 to-transparent">
            <motion.svg
              className="absolute inset-0 h-full w-full"
              viewBox="0 0 200 100"
              preserveAspectRatio="none"
            >
              <motion.path
                d="M0 10 L40 15 L80 35 L120 55 L160 78 L200 92"
                fill="none"
                stroke="#f87171"
                strokeWidth="2"
                initial={reduce ? undefined : { pathLength: 0 }}
                animate={reduce ? undefined : { pathLength: 1 }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 0.5 }}
              />
            </motion.svg>
            <motion.div
              className="absolute left-1/2 top-4 -translate-x-1/2 text-red-400"
              animate={reduce ? undefined : { opacity: [0.3, 1, 0.3], x: [0, 4, -4, 0] }}
              transition={{ duration: 0.6, repeat: Infinity }}
            >
              <Zap className="h-8 w-8" />
            </motion.div>
          </div>
          <p className="mt-2 text-xs text-hero-muted">价格急跌 · 清算风险抬升</p>
        </div>

        <div className="rounded-2xl border border-cyan-500/35 bg-black/45 p-4 shadow-[0_0_24px_rgba(0,0,0,0.35)] ring-1 ring-cyan-400/20 backdrop-blur-lg">
          <p className="text-xs font-mono text-cyan-300">Reactive Layer</p>
          <div className="relative mt-3 flex h-28 items-center justify-center overflow-hidden rounded-xl">
            <motion.div
              className="absolute inset-0 rounded-xl"
              style={{
                background:
                  "conic-gradient(from 0deg, rgba(34,211,238,0.35), transparent 40%, rgba(168,85,247,0.35), transparent 75%)",
              }}
              animate={reduce ? undefined : { rotate: [0, 360] }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            />
            <motion.div
              className="relative h-16 w-16 rounded-full border-2 border-cyan-400/60 shadow-[0_0_40px_rgba(34,211,238,0.45)]"
              animate={reduce ? undefined : { scale: [1, 1.12, 1], opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 0.45, repeat: Infinity }}
            />
            <span className="relative text-xs font-mono text-cyan-100">LISTEN</span>
          </div>
          <p className="mt-2 text-xs text-hero-muted">事件风暴 · 毫秒级闪烁响应</p>
        </div>

        <div className="rounded-2xl border border-emerald-500/30 bg-black/45 p-4 shadow-[0_0_24px_rgba(0,0,0,0.35)] ring-1 ring-emerald-500/15 backdrop-blur-lg">
          <p className="text-xs font-mono text-emerald-300">Polygon</p>
          <div className="relative mt-3 h-28 overflow-hidden rounded-xl bg-gradient-to-b from-emerald-950/40 to-transparent">
            <motion.div
              className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-1 font-mono text-2xl font-bold text-emerald-400"
              animate={reduce ? undefined : { y: [0, -4, 0] }}
              transition={{ duration: 1.2, repeat: Infinity }}
            >
              +$42,180
              <ArrowUpRight className="h-6 w-6" />
            </motion.div>
            <motion.svg
              className="absolute inset-0 h-full w-full"
              viewBox="0 0 200 100"
              preserveAspectRatio="none"
            >
              <motion.path
                d="M0 88 L40 78 L80 62 L120 42 L160 25 L200 12"
                fill="none"
                stroke="#34d399"
                strokeWidth="2"
                initial={reduce ? undefined : { pathLength: 0 }}
                animate={reduce ? undefined : { pathLength: 1 }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 0.5 }}
              />
            </motion.svg>
          </div>
          <p className="mt-2 text-xs text-hero-muted">对冲腿盈利 · 与 A 链损失相向而行</p>
        </div>
      </div>
      <div className="mx-auto mt-10 max-w-3xl rounded-xl border border-white/10 bg-white/[0.03] p-4 text-center text-xs text-hero-muted backdrop-blur-sm">
        终局：两链 PnL 曲线在交叉点<strong className="text-cyan-300"> 发光抵消 </strong>
        —— Flash-Back 将「不可逆爆仓」改写为「可编排的对冲剧本」（示意动画）。
      </div>
    </section>
  )
}
