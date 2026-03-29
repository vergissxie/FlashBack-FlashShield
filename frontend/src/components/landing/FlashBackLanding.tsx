import { motion, useScroll } from "framer-motion"
import { useMemo, useState } from "react"
import { Link } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { useHedgeSequence } from "@/hooks/useHedgeSequence"

import { BalanceScale } from "./BalanceScale"
import { DataPulse } from "./DataPulse"
import { EventChronicle } from "./EventChronicle"
import { PrecisionGauge } from "./PrecisionGauge"

const SECTIONS = [
  { id: "hero", label: "引子" },
  { id: "pain", label: "问题" },
  { id: "magic", label: "方案" },
  { id: "architecture", label: "原理" },
  { id: "proof", label: "可信" },
  { id: "cta", label: "行动" },
] as const

const VIDEO_BG_SRC =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260302_085640_276ea93b-d7da-4418-a09b-2aa5b490e838.mp4"

/**
 * 演示视频须放在 `public/media/` 下（构建后 URL 为 /media/...），勿放在项目根目录。
 * 默认：`public/media/演示视频.mp4`；也可通过 VITE_MECHANISM_DEMO_VIDEO 覆盖。
 */
const MECHANISM_DEMO_SRC =
  import.meta.env.VITE_MECHANISM_DEMO_VIDEO?.trim() || "/media/演示视频.mp4"

export function FlashBackLanding() {
  const [videoOpen, setVideoOpen] = useState(false)
  const { scrollYProgress } = useScroll()
  const seq = useHedgeSequence()
  const txLogs = useMemo(
    () => ["0x92a...e17f", "0x7bc...11ad", "0x80f...9cd0", "0xaf4...6ec9", "0xee2...3a10"],
    [],
  )

  const startAsyncDemo = () => {
    // Optional mechanical cue: short crisp tone on risk detection trigger.
    try {
      const Ctx = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (Ctx) {
        const ctx = new Ctx()
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = "triangle"
        osc.frequency.value = 980
        gain.gain.value = 0.035
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start()
        osc.stop(ctx.currentTime + 0.08)
      }
    } catch {
      // ignore audio setup issues silently
    }
    seq.runSequence()
  }

  return (
    <div className="relative min-h-svh overflow-x-hidden bg-white text-[#0A1F3F]">
      {/* 全屏动态背景：保留原片蓝粉基调；仅用底部白渐变与页面留白融合 */}
      <div className="pointer-events-none fixed inset-0 z-0 h-svh min-h-svh w-full overflow-hidden">
        <video
          aria-hidden
          className="h-full w-full object-cover [transform:scaleY(-1)]"
          src={VIDEO_BG_SRC}
          autoPlay
          muted
          loop
          playsInline
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[rgba(255,255,255,0)] from-[26.416%] to-[66.943%] to-white" />
      </div>

      <aside className="fixed right-4 top-1/2 z-30 hidden -translate-y-1/2 lg:block">
        <div className="rounded-xl border border-[#0A1F3F]/15 bg-[#FAF9F6]/80 p-3 backdrop-blur-md">
          <motion.div className="mb-3 h-1 rounded bg-[#E6D5B8]" style={{ scaleX: scrollYProgress, transformOrigin: "0%" }} />
          <div className="space-y-2 text-xs">
            {SECTIONS.map((section) => (
              <a key={section.id} href={`#${section.id}`} className="block text-[#0A1F3F]/70 transition hover:text-[#0A1F3F]">
                {section.label}
              </a>
            ))}
          </div>
        </div>
      </aside>

      <main className="relative z-10">
        <section id="hero" className="container py-16 md:py-24">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.3em] text-[#0A1F3F]/70">Flash-Back Protocol</p>
              <h1 className="mt-4 text-4xl font-semibold leading-tight md:text-6xl" style={{ fontFamily: "Times New Roman, serif" }}>
                <span className="text-[#0A1F3F]">Flash-Back</span>{" "}
                <span className="text-[#E6D5B8]">Protocol</span>
              </h1>
              <p className="mt-4 text-lg text-[#0A1F3F]/90" style={{ fontFamily: "Garamond, Times New Roman, serif" }}>
                The Asynchronous Hedge Engine — 当链上波动成为常态，我们提供秩序的基准。
              </p>
              <p className="mt-4 max-w-2xl text-sm text-[#0A1F3F]/75 md:text-lg">
                百年金融智慧，由代码重新封装。通过跨链对冲机制，让风险与机会在不同链上被重新校准为可控秩序。
              </p>
              <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-[#0A1F3F]/20 bg-[#FAF9F6] px-3 py-1">
                <span>🫧</span>
                <span className="text-sm text-[#0A1F3F]/80">全网首个基于跨链的价格波动中性化协议</span>
              </div>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button variant="hero" size="hero" onClick={() => setVideoOpen(true)}>
                  📜 查阅机制白皮书
                </Button>
                <Button asChild variant="heroSecondary" size="hero">
                  <a href="#magic">🕐 预约演示</a>
                </Button>
                <Button asChild variant="heroSecondary" size="hero">
                  <Link to="/dashboard">进入 DAPP 控制台</Link>
                </Button>
              </div>
            </div>
            <div className="rounded-2xl border border-[#0A1F3F]/20 bg-[#FAF9F6]/70 p-5 backdrop-blur-md">
              <div className="relative h-[280px] overflow-hidden rounded-xl border border-[#0A1F3F]/15 bg-[#F8F5F0]">
                <svg viewBox="0 0 700 320" className="h-full w-full">
                  <path d="M60 220 Q190 120 310 150 T640 90" stroke="#b8aa93" strokeWidth="1" fill="none" />
                  <path d="M70 90 L150 130 L220 110 L320 180 L390 150 L460 170 L610 120" stroke="#cbbca3" strokeWidth="1.1" fill="none" />
                  <circle cx="100" cy="110" r="6" fill="#0A1F3F" />
                  <circle cx="600" cy="126" r="6" fill="#036652" />
                  <motion.path
                    d="M100 110 C220 100, 460 150, 600 126"
                    stroke="#0A1F3F"
                    strokeWidth="3"
                    fill="none"
                    initial={{ pathLength: 0.1, opacity: 0.4 }}
                    animate={{ pathLength: [0.1, 1, 0.1], opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 3.2, repeat: Infinity }}
                  />
                </svg>
                <div className="absolute bottom-3 left-3 rounded bg-[#0A1F3F]/10 px-2 py-1 font-mono text-xs text-[#0A1F3F]">Sepolia</div>
                <div className="absolute bottom-3 right-3 rounded bg-[#036652]/10 px-2 py-1 font-mono text-xs text-[#036652]">Polygon</div>
              </div>
            </div>
          </div>
        </section>

        <section id="pain" className="container py-12 md:py-16">
          <h2 className="text-2xl font-semibold md:text-4xl" style={{ fontFamily: "Times New Roman, serif" }}>旧时代的止损，是价值的终点。</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-[#0A1F3F]/15 bg-[#FAF9F6] p-4">
              <div className="relative h-40 rounded-lg border border-[#0A1F3F]/15 bg-[#f2eee8]">
                <svg viewBox="0 0 500 180" className="h-full w-full">
                  <path d="M20 30 L160 50 L260 65 L340 130 L450 160" stroke="#B7410E" strokeWidth="4" fill="none" />
                </svg>
              </div>
            </div>
            <div className="rounded-2xl border border-[#0A1F3F]/15 bg-[#FAF9F6] p-4">
              <div className="text-sm text-[#0A1F3F]/70">在传统金融，时间是你的敌人。</div>
              <motion.div className="mt-2 text-5xl font-bold text-[#B7410E]" initial={{ opacity: 0.6 }} animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 1.8, repeat: Infinity }}>
                -100%
              </motion.div>
            </div>
          </div>

          <h3 className="mt-10 text-2xl font-semibold text-[#036652] md:text-4xl" style={{ fontFamily: "Times New Roman, serif" }}>闪回的对冲，是价值的归零校准。</h3>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-[#0A1F3F]/15 bg-[#FAF9F6] p-4">
              <div className="relative h-40 rounded-lg border border-[#0A1F3F]/15 bg-[#f2eee8]">
                <svg viewBox="0 0 500 180" className="h-full w-full">
                  <path d="M20 30 L160 50 L260 65 L310 115 L390 115 L450 115" stroke="#036652" strokeWidth="4" fill="none" />
                  <motion.line x1="470" y1="20" x2="330" y2="114" stroke="#036652" strokeWidth="3" animate={{ opacity: [0, 1, 0] }} transition={{ duration: 2.1, repeat: Infinity }} />
                </svg>
              </div>
            </div>
            <div className="rounded-2xl border border-[#0A1F3F]/15 bg-[#FAF9F6] p-4">
              <div className="text-sm text-[#0A1F3F]/70">损益归零校准</div>
              <motion.div className="mt-2 text-5xl font-bold text-[#036652]" initial={{ y: 8 }} animate={{ y: [8, 0, 8] }} transition={{ duration: 2, repeat: Infinity }}>
                0 元
              </motion.div>
            </div>
          </div>
        </section>

        <section id="magic" className="container py-12 md:py-16">
          <h2 className="text-2xl font-semibold md:text-4xl" style={{ fontFamily: "Times New Roman, serif" }}>三重齿轮耦合的精密时序</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {[
              ["监听", "Sepolia Price Feed", "全网预言机7×24h监听价格波动。", "radar"],
              ["传输", "Reactive Layer", "Reactive Layer在300ms内路由跨链消息。", "gear"],
              ["对冲", "Polygon Hedger", "目标链合约自动开立空单，盈利即时生成。", "counter"],
            ].map(([title, sub, desc, mode]) => (
              <motion.div
                key={title}
                whileHover={{ scale: 1.03 }}
                className="rounded-2xl border border-[#0A1F3F]/15 bg-[#FAF9F6] p-4 transition"
              >
                <div className="text-lg font-semibold text-[#0A1F3F]">{title}</div>
                <div className="font-mono text-xs text-[#0A1F3F]/60">{sub}</div>
                <div className="mt-3 h-20 rounded-lg border border-[#0A1F3F]/15 bg-[#f2eee8] p-2">
                  {mode === "radar" && (
                    <motion.div className="mx-auto h-16 w-16 rounded-full border border-[#0A1F3F]/50" animate={{ rotate: 360 }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }} />
                  )}
                  {mode === "gear" && (
                    <div className="flex items-center gap-2">
                      <motion.div className="h-9 w-9 rounded-full border-2 border-[#E6D5B8]" animate={{ rotate: 360 }} transition={{ duration: 2.3, repeat: Infinity, ease: "linear" }} />
                      <motion.div className="h-3 w-3 rounded-full bg-[#0A1F3F]" animate={{ x: [0, 40, 0] }} transition={{ duration: 2, repeat: Infinity }} />
                    </div>
                  )}
                  {mode === "counter" && (
                    <motion.div className="font-mono text-2xl text-[#036652]" animate={{ y: [8, -4, 8] }} transition={{ duration: 1.4, repeat: Infinity }}>
                      +12,450
                    </motion.div>
                  )}
                </div>
                <p className="mt-3 text-sm text-[#0A1F3F]/75">{desc}</p>
              </motion.div>
            ))}
          </div>

          <div className="mt-8 grid gap-5 xl:grid-cols-[1.6fr_0.8fr]">
            <div className="rounded-2xl border border-[#0A1F3F]/15 bg-[#FAF9F6]/90 p-4 md:p-5">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#0A1F3F]/70">
                  Async Aesthetic Queue · 0.5s / 3s / 1s
                </p>
                <div className="rounded-full border border-[#0A1F3F]/15 bg-[#f2eee8] px-3 py-1 text-xs text-[#0A1F3F]/80">
                  {seq.ui.statusText}
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-[1fr_1.1fr_1fr]">
                <PrecisionGauge
                  label="Sepolia 风险仪表"
                  subLabel={`触发阈值: $${seq.ui.thresholdPrice.toLocaleString()}`}
                  value={seq.riskGaugeValue}
                  color="navy"
                  alert={seq.ui.isRiskStage}
                />
                <div className="rounded-2xl border border-[#0A1F3F]/10 bg-[#f2eee8] p-3">
                  <BalanceScale tilt={seq.tilt} stage={seq.stage} />
                  <div className="mt-3 rounded-xl border border-[#0A1F3F]/10 bg-[#FAF9F6] p-2">
                    <DataPulse active={seq.pulseActive} />
                  </div>
                </div>
                <PrecisionGauge
                  label="Polygon 对冲仪表"
                  subLabel="盈利目标: 自动反向对冲"
                  value={seq.hedgeGaugeValue}
                  color="gold"
                />
              </div>

              <div className="mt-4">
                <label
                  htmlFor="sepolia-price"
                  className="mb-1 block font-mono text-xs uppercase tracking-[0.15em] text-[#0A1F3F]/65"
                >
                  Simulate Market Crash
                </label>
                <input
                  id="sepolia-price"
                  type="range"
                  min={2800}
                  max={3700}
                  step={10}
                  value={seq.sliderPrice}
                  onChange={(e) => seq.setSliderPrice(Number(e.target.value))}
                  className="h-2 w-full cursor-pointer appearance-none rounded-full bg-[#0A1F3F]/20 accent-[#0A1F3F]"
                />
                <div className="mt-1 flex justify-between font-mono text-xs text-[#0A1F3F]/60">
                  <span>Price: ${seq.sliderPrice.toLocaleString()}</span>
                  <span>Threshold: ${seq.ui.thresholdPrice.toLocaleString()}</span>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <Button variant="hero" size="hero" disabled={seq.isRunning} onClick={startAsyncDemo}>
                  启动异步修复队列
                </Button>
                <Button variant="heroSecondary" size="hero" onClick={seq.reset}>
                  重置演示
                </Button>
              </div>
            </div>

            <EventChronicle items={seq.logs} />
          </div>
        </section>

        <section id="architecture" className="container py-12 md:py-16">
          <div className="grid gap-6 lg:grid-cols-2">
            <div>
          <h2 className="text-2xl font-semibold md:text-4xl" style={{ fontFamily: "Times New Roman, serif" }}>为什么是跨链对冲？</h2>
              <ul className="mt-5 space-y-3 text-sm md:text-base">
                <li>🛡️ 风险隔离：主资产与对冲操作分布于不同链，绝对安全。</li>
                <li>⚡ 机会拓展：利用多链流动性，捕捉最佳对冲时机。</li>
                <li>🔧 模块化设计：支持快速接入新的公链与资产。</li>
              </ul>
            </div>
            <div className="rounded-2xl border border-[#0A1F3F]/15 bg-[#FAF9F6] p-4">
              <div className="grid gap-3 md:grid-cols-3">
                {["Oracle", "Reactive Layer", "Target Chain"].map((name) => (
                  <motion.div key={name} whileHover={{ y: -4, boxShadow: "0 8px 20px rgba(10,31,63,0.15)" }} className="rounded-xl border border-[#0A1F3F]/15 bg-[#f2eee8] p-3 text-center text-sm">
                    {name}
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="proof" className="container py-12 md:py-16">
          <h2 className="text-2xl font-semibold md:text-4xl" style={{ fontFamily: "Times New Roman, serif" }}>为极致确定性而构建</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-[#0A1F3F]/15 bg-[#FAF9F6] p-4">
              <div className="font-mono text-xs text-[#0A1F3F]">AUDIT</div>
              <div className="mt-2 text-sm">SecuryFi / Veridise</div>
            </div>
            <div className="rounded-xl border border-[#0A1F3F]/15 bg-[#FAF9F6] p-4 md:col-span-2">
              <div className="font-mono text-xs text-[#0A1F3F]">ON-CHAIN HASH STREAM</div>
              <div className="mt-2 grid gap-2 font-mono text-xs text-[#0A1F3F]/75 md:grid-cols-2">
                {txLogs.map((hash) => (
                  <motion.div key={hash} animate={{ opacity: [0.55, 1, 0.55] }} transition={{ duration: 2.5, repeat: Infinity }}>
                    {hash}
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
            {["Polygon", "Chainlink", "The Graph", "Reactive"].map((p) => (
              <div key={p} className="rounded-lg border border-[#0A1F3F]/15 bg-[#FAF9F6] px-3 py-2 text-center text-sm text-[#0A1F3F]/80">{p}</div>
            ))}
          </div>
        </section>

        <section id="cta" className="relative mt-10 border-t border-[#0A1F3F]/10 py-20">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(230,213,184,0.35),transparent_55%),repeating-linear-gradient(30deg,rgba(10,31,63,0.025)_0px,rgba(10,31,63,0.025)_2px,transparent_2px,transparent_12px)]" />
          <div className="container relative text-center">
            <h2 className="mx-auto max-w-4xl text-3xl font-semibold leading-tight md:text-5xl" style={{ fontFamily: "Times New Roman, serif" }}>
              秩序，是最高级的美学。
            </h2>
            <p className="mt-3 text-[#0A1F3F]/75">加入我们，重新定义链上风险管理的基准。</p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button variant="hero" size="hero">⏳ 加入等候名单</Button>
              <Button variant="heroSecondary" size="hero">📞 联系商务</Button>
              <Button asChild variant="heroSecondary" size="hero">
                <Link to="/dashboard">前往 DAPP 页面</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      {videoOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-4xl rounded-2xl border border-[#E6D5B8] bg-[#FAF9F6] p-4 text-[#0A1F3F]">
            <div className="flex items-center justify-between">
              <p className="font-mono text-sm text-[#0A1F3F]">Whitepaper / 90s Mechanism Walkthrough</p>
              <button type="button" className="rounded bg-[#0A1F3F]/10 px-3 py-1 text-sm hover:bg-[#0A1F3F]/20" onClick={() => setVideoOpen(false)}>
                关闭
              </button>
            </div>
            <div className="mt-3 aspect-video overflow-hidden rounded-lg border border-[#0A1F3F]/15 bg-black">
              {/* 静音 + autoPlay 才易被浏览器放行；要声音请在控件里取消静音 */}
              <video
                className="h-full w-full object-contain"
                src={MECHANISM_DEMO_SRC}
                controls
                playsInline
                muted
                autoPlay
              >
                您的浏览器不支持 HTML5 视频。
              </video>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
