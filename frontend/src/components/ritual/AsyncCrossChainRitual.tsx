import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { useEffect, useRef, useState } from "react"

import { playMechanicalChime, playSettlementChime } from "./mechanicalChime"

export type RitualMode = "open" | "liquidate"

const T_DETECTION_MS = 500
const T_TRANSMISSION_MS = 2800
const T_SETTLEMENT_MS = 1000

function sleep(ms: number) {
  return new Promise((r) => window.setTimeout(r, ms))
}

const COPY: Record<
  RitualMode,
  { detection: string; transmission: string; settlement: string; title: string }
> = {
  open: {
    title: "Flash-Back · 异步编排",
    detection: "链上确认 · 仓位建立",
    transmission: "Reactive 栅格同步 · 指令封装",
    settlement: "保护管线对齐 · 秩序就绪",
  },
  liquidate: {
    title: "Flash-Back · 跨链风险中性化",
    detection: "风险捕获 · Sepolia 信号入块",
    transmission: "跨链传导 · Reactive Layer 脉冲",
    settlement: "秩序修复 · 目标链结算回响",
  },
}

type Phase = "idle" | "detection" | "transmission" | "settlement" | "exiting"

type AsyncCrossChainRitualProps = {
  /** 每次 +1 触发一整段仪式（与链上快慢解耦，固定节奏） */
  runKey: number
  mode: RitualMode
}

/**
 * 三段式「机械表咬合感」：检测 → 传导（金脉冲 + 天平颤）→ 阻尼回正。
 * 诚实展示异步：不伪装瞬时，用固定时长队列表达跨链时延的美学。
 */
export function AsyncCrossChainRitual({ runKey, mode }: AsyncCrossChainRitualProps) {
  const reduce = useReducedMotion()
  const [phase, setPhase] = useState<Phase>("idle")
  const [visible, setVisible] = useState(false)
  const prevKey = useRef(0)

  const dDet = reduce ? 120 : T_DETECTION_MS
  const dTx = reduce ? 400 : T_TRANSMISSION_MS
  const dSet = reduce ? 150 : T_SETTLEMENT_MS
  const text = COPY[mode]

  useEffect(() => {
    if (runKey <= 0 || runKey === prevKey.current) return
    prevKey.current = runKey

    let cancelled = false
    const run = async () => {
      setVisible(true)
      setPhase("detection")
      playMechanicalChime(1020, 0.06, 0.045)
      await sleep(dDet)
      if (cancelled) return
      setPhase("transmission")
      await sleep(dTx)
      if (cancelled) return
      setPhase("settlement")
      playSettlementChime()
      await sleep(dSet)
      if (cancelled) return
      setPhase("exiting")
      await sleep(reduce ? 200 : 450)
      if (cancelled) return
      setVisible(false)
      setPhase("idle")
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [runKey, dDet, dTx, dSet, reduce])

  const phaseLabel =
    phase === "detection"
      ? text.detection
      : phase === "transmission"
        ? text.transmission
        : phase === "settlement" || phase === "exiting"
          ? text.settlement
          : ""

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          key="ritual-root"
          className="pointer-events-none fixed inset-0 z-[100] flex items-end justify-center p-4 pb-8 sm:items-center sm:pb-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
          aria-live="polite"
          aria-label="跨链异步编排动画"
        >
          <div className="absolute inset-0 bg-[#0A1F3F]/35 backdrop-blur-[2px]" />
          <motion.div
            layout
            className="relative w-full max-w-[640px] overflow-hidden rounded-2xl border border-[#0A1F3F]/20 bg-[#FAF9F6]/95 shadow-[0_24px_80px_rgba(10,31,63,0.2)] ring-1 ring-[#C5A059]/25"
            initial={{ y: 28, scale: 0.96 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ y: 16, opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
          >
            <div className="border-b border-[#0A1F3F]/10 bg-gradient-to-r from-[#0A1F3F]/[0.06] via-[#C5A059]/10 to-[#036652]/10 px-4 py-2">
              <p className="text-center font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-[#0A1F3F]/70">
                {text.title}
              </p>
              <p className="mt-0.5 text-center text-xs font-medium text-[#0A1F3F]">{phaseLabel}</p>
            </div>

            <div className="relative grid grid-cols-3 gap-2 px-3 py-5 sm:gap-4 sm:px-6 sm:py-7">
              {/* 左：Sepolia 蓝针 */}
              <div className="flex flex-col items-center">
                <span className="mb-2 text-[9px] font-medium uppercase tracking-wide text-[#0A1F3F]/50">
                  Sepolia
                </span>
                <div className="relative flex h-28 w-full max-w-[100px] items-end justify-center sm:h-32">
                  <div className="absolute bottom-0 h-20 w-px bg-[#0A1F3F]/25" />
                  <motion.div
                    className="origin-bottom"
                    style={{ width: 3, height: 72, background: "linear-gradient(180deg,#3d6ea8,#0A1F3F)", borderRadius: 2 }}
                    initial={{ rotate: -12 }}
                    animate={{
                      rotate:
                        phase === "detection"
                          ? [ -12, 22, 8 ]
                          : phase === "transmission" || phase === "settlement" || phase === "exiting"
                            ? 8
                            : -12,
                    }}
                    transition={{
                      duration: phase === "detection" ? 0.45 : 0.5,
                      times: phase === "detection" ? [0, 0.55, 1] : undefined,
                      ease: phase === "detection" ? "easeOut" : "easeInOut",
                    }}
                  />
                  <div className="absolute bottom-0 h-2 w-2 rounded-full bg-[#0A1F3F]" />
                </div>
              </div>

              {/* 中：Reactive + 金脉冲 + 天平颤 */}
              <div className="flex flex-col items-center justify-between">
                <span className="mb-1 text-[9px] font-medium uppercase tracking-wide text-[#0A1F3F]/50">
                  Reactive
                </span>
                <motion.div
                  className="relative mb-3 w-full rounded-xl border-2 border-[#0A1F3F]/20 bg-[#F2EEE8] px-1 py-3"
                  animate={{
                    boxShadow:
                      phase === "transmission" || phase === "settlement" || phase === "exiting"
                        ? "0 0 28px rgba(197,160,89,0.45), inset 0 0 20px rgba(10,31,63,0.06)"
                        : phase === "detection"
                          ? "0 0 14px rgba(61,110,168,0.35)"
                          : "0 0 0 rgba(0,0,0,0)",
                    borderColor:
                      phase === "transmission" || phase === "settlement" || phase === "exiting"
                        ? "rgba(197,160,89,0.65)"
                        : "rgba(10,31,63,0.2)",
                  }}
                  transition={{ duration: 0.4 }}
                >
                  <div className="relative h-2 overflow-hidden rounded-full bg-[#0A1F3F]/10">
                    <motion.div
                      key={`pulse-${runKey}`}
                      className="absolute top-0 h-full w-8 rounded-full bg-gradient-to-r from-[#E6D5B8] via-[#C5A059] to-[#E6D5B8] shadow-[0_0_12px_rgba(197,160,89,0.9)]"
                      initial={{ left: "4%", opacity: 0.25 }}
                      animate={{
                        left:
                          phase === "transmission"
                            ? "88%"
                            : phase === "settlement" || phase === "exiting"
                              ? "88%"
                              : "4%",
                        opacity: phase === "detection" ? 0.4 : 1,
                      }}
                      transition={{
                        left: { duration: reduce ? 0.35 : dTx / 1000, ease: "linear" },
                        opacity: { duration: 0.25 },
                      }}
                    />
                  </div>
                </motion.div>

                <motion.div
                  className="relative mt-1 flex w-full justify-center"
                  animate={
                    phase === "transmission"
                      ? { rotate: [0, -2.2, 2.2, -1.4, 1.4, -0.6, 0.6, 0] }
                      : phase === "settlement" || phase === "exiting"
                        ? { rotate: 0 }
                        : {}
                  }
                  transition={
                    phase === "transmission"
                      ? { duration: reduce ? 0.4 : 2.2, ease: "easeInOut", repeat: 0 }
                      : phase === "settlement"
                        ? { type: "spring", stiffness: 120, damping: 18 }
                        : {}
                  }
                >
                  <svg viewBox="0 0 120 56" className="h-12 w-[120px] text-[#0A1F3F]" aria-hidden>
                    <line x1="60" y1="8" x2="60" y2="44" stroke="currentColor" strokeWidth="1.5" />
                    <line x1="24" y1="44" x2="96" y2="44" stroke="currentColor" strokeWidth="1.5" />
                    <motion.g
                      style={{ transformOrigin: "60px 8px" }}
                      animate={{
                        rotate:
                          phase === "settlement" || phase === "exiting"
                            ? 0
                            : phase === "transmission"
                              ? [ -6, 5, -4, 3, -2, 0 ]
                              : phase === "detection"
                                ? -8
                                : 0,
                      }}
                      transition={{
                        duration: phase === "transmission" ? 2 : 0.4,
                        ease: "easeInOut",
                      }}
                    >
                      <line x1="60" y1="8" x2="28" y2="44" stroke="#3d6ea8" strokeWidth="2" />
                      <line x1="60" y1="8" x2="92" y2="44" stroke="#C5A059" strokeWidth="2" />
                    </motion.g>
                    <circle cx="60" cy="8" r="3.5" fill="#0A1F3F" />
                  </svg>
                </motion.div>
              </div>

              {/* 右：目标链金针抬起 */}
              <div className="flex flex-col items-center">
                <span className="mb-2 text-[9px] font-medium uppercase tracking-wide text-[#036652]/70">
                  Base Sepolia
                </span>
                <div className="relative flex h-28 w-full max-w-[100px] items-end justify-center sm:h-32">
                  <div className="absolute bottom-0 h-20 w-px bg-[#036652]/25" />
                  <motion.div
                    className="origin-bottom"
                    style={{
                      width: 3,
                      height: 72,
                      background: "linear-gradient(180deg,#d4b87a,#9a7b3c)",
                      borderRadius: 2,
                    }}
                    initial={{ rotate: 18 }}
                    animate={{
                      rotate:
                        phase === "settlement" || phase === "exiting"
                          ? [ 18, -32, -18 ]
                          : phase === "transmission"
                            ? 14
                            : 18,
                    }}
                    transition={{
                      duration: phase === "settlement" || phase === "exiting" ? 0.85 : 0.4,
                      times: phase === "settlement" || phase === "exiting" ? [0, 0.55, 1] : undefined,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                  />
                  <div className="absolute bottom-0 h-2 w-2 rounded-full bg-[#036652]" />
                </div>
              </div>
            </div>

            <p className="border-t border-[#0A1F3F]/10 px-4 py-2 text-center text-[10px] leading-relaxed text-[#0A1F3F]/50">
              异步美学：节奏与链上确认解耦 — 无论 RPC 快慢，系统都以固定咬合感完成叙事。
            </p>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
