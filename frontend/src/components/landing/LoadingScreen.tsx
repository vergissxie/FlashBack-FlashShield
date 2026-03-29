import { motion, AnimatePresence } from "framer-motion"
import { useCallback, useEffect, useRef, useState } from "react"

type LoadingScreenProps = {
  onDone: () => void
}

/**
 * 首屏加载：粒子向中心汇聚成 Logo + 「时间倒流」提示音（Web Audio 简易 chirp）
 */
export function LoadingScreen({ onDone }: LoadingScreenProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [visible, setVisible] = useState(true)
  const doneRef = useRef(false)

  const playRewindChirp = useCallback(() => {
    try {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: AudioContext }).webkitAudioContext
      if (!Ctx) return
      const ctx = new Ctx()
      const o = ctx.createOscillator()
      const g = ctx.createGain()
      o.type = "sine"
      o.frequency.setValueAtTime(880, ctx.currentTime)
      o.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 1.1)
      g.gain.setValueAtTime(0.0001, ctx.currentTime)
      g.gain.exponentialRampToValueAtTime(0.08, ctx.currentTime + 0.05)
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.15)
      o.connect(g)
      g.connect(ctx.destination)
      o.start()
      o.stop(ctx.currentTime + 1.2)
    } catch {
      /* ignore */
    }
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    let w = 0
    let h = 0
    const cx = () => w / 2
    const cy = () => h / 2

    type P = { x: number; y: number; tx: number; ty: number; t: number }
    const particles: P[] = []
    let start = 0
    const DURATION = 2200

    const resize = () => {
      w = window.innerWidth
      h = window.innerHeight
      canvas.width = Math.floor(w * dpr)
      canvas.height = Math.floor(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    window.addEventListener("resize", resize)

    const initParticles = () => {
      particles.length = 0
      const n = 220
      for (let i = 0; i < n; i++) {
        const ang = Math.random() * Math.PI * 2
        const r = Math.max(w, h) * (0.35 + Math.random() * 0.45)
        particles.push({
          x: cx() + Math.cos(ang) * r,
          y: cy() + Math.sin(ang) * r,
          tx: cx(),
          ty: cy(),
          t: Math.random(),
        })
      }
    }
    initParticles()

    let raf = 0
    const tick = (now: number) => {
      if (!start) start = now
      const elapsed = now - start
      const k = Math.min(1, elapsed / DURATION)
      const ease = 1 - Math.pow(1 - k, 3)

      ctx.fillStyle = "rgba(10,6,20,0.35)"
      ctx.fillRect(0, 0, w, h)

      for (const p of particles) {
        p.x += (p.tx - p.x) * (0.04 + ease * 0.12)
        p.y += (p.ty - p.y) * (0.04 + ease * 0.12)
        ctx.fillStyle = `rgba(34,211,238,${0.15 + 0.55 * ease})`
        ctx.fillRect(p.x, p.y, 2, 2)
      }

      const r = 36 * ease
      ctx.strokeStyle = `rgba(168,85,247,${0.4 + 0.5 * ease})`
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(cx(), cy(), r, 0, Math.PI * 2)
      ctx.stroke()
      ctx.fillStyle = `rgba(226,232,240,${0.2 + 0.75 * ease})`
      ctx.font = "bold 18px ui-sans-serif, system-ui"
      ctx.textAlign = "center"
      ctx.fillText("FB", cx(), cy() + 6)

      if (elapsed >= DURATION && !doneRef.current) {
        doneRef.current = true
        cancelAnimationFrame(raf)
        setVisible(false)
        setTimeout(onDone, 400)
        return
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    playRewindChirp()

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener("resize", resize)
    }
  }, [onDone, playRewindChirp])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[hsl(262_42%_6%)]"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.45 }}
        >
          <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-hidden />
          <p className="relative z-[1] mt-[min(28vh,220px)] text-sm text-hero-sub">
            正在加载闪回协议…
          </p>
          <p className="relative z-[1] mt-2 text-xs text-hero-muted">
            粒子汇聚 · 时间轴校准（音效需浏览器允许自动播放）
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
