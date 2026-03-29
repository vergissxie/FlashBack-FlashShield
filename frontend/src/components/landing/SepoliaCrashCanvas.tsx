import { useEffect, useRef } from "react"

/**
 * 左侧：Sepolia 链「价格暴跌」折线图（Canvas）
 * 跌破阈值时：红色预警光效 + 闪电式抖动 + 颜色爆闪（项目逻辑：风险暴露）
 */
export function SepoliaCrashCanvas() {
  const ref = useRef<HTMLCanvasElement>(null)
  const prices = useRef<number[]>([])
  const frame = useRef(0)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    let w = 0
    let h = 0
    const THRESHOLD = 0.42

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      w = rect.width
      h = rect.height
      canvas.width = Math.floor(w * dpr)
      canvas.height = Math.floor(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      if (prices.current.length === 0) {
        let p = 0.92
        for (let i = 0; i < 80; i++) {
          p = Math.max(0.08, p - 0.008 + (Math.random() - 0.52) * 0.02)
          prices.current.push(p)
        }
      }
    }
    resize()
    window.addEventListener("resize", resize)

    let raf = 0
    const tick = () => {
      frame.current++
      const arr = prices.current
      if (arr.length < 2) return
      const last = arr[arr.length - 1] ?? 0.5
      const drift = -0.0045 + (Math.random() - 0.48) * 0.012
      const next = Math.max(0.06, Math.min(0.98, last + drift))
      arr.push(next)
      arr.shift()

      const below = next < THRESHOLD
      const shake = below ? Math.sin(frame.current * 0.9) * 4 : 0
      const flash = below && frame.current % 14 < 7

      ctx.clearRect(0, 0, w, h)
      ctx.save()
      ctx.translate(shake, 0)

      const grad = ctx.createLinearGradient(0, 0, w, h)
      grad.addColorStop(0, flash ? "rgba(255,40,80,0.35)" : "rgba(255,60,90,0.12)")
      grad.addColorStop(1, "rgba(80,0,40,0.05)")
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, w, h)

      ctx.strokeStyle = "rgba(148,163,184,0.25)"
      ctx.lineWidth = 1
      for (let i = 1; i < 4; i++) {
        const y = (h * i) / 4
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(w, y)
        ctx.stroke()
      }

      ctx.strokeStyle = below
        ? flash
          ? "rgba(255,60,90,1)"
          : "rgba(255,80,100,0.85)"
        : "rgba(248,113,113,0.9)"
      ctx.shadowColor = below ? "rgba(255,60,100,0.95)" : "rgba(255,80,100,0.45)"
      ctx.shadowBlur = below ? 22 : 12
      ctx.lineWidth = 2.2
      ctx.beginPath()
      arr.forEach((v, i) => {
        const x = (i / (arr.length - 1)) * (w - 16) + 8
        const y = 12 + (1 - v) * (h - 24)
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      })
      ctx.stroke()
      ctx.shadowBlur = 0

      ctx.fillStyle = "rgba(248,250,252,0.85)"
      ctx.font = "11px ui-monospace, monospace"
      ctx.fillText("Sepolia · spot (demo)", 10, 18)
      ctx.fillStyle = below ? "rgba(255,99,120,0.95)" : "rgba(148,163,184,0.9)"
      ctx.fillText(below ? "LIQUIDATION RISK" : "monitoring", w - 120, 18)

      ctx.restore()
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener("resize", resize)
    }
  }, [])

  return (
    <canvas
      ref={ref}
      className="h-full min-h-[200px] w-full rounded-2xl border border-red-500/20 bg-black/30 md:min-h-[240px]"
      aria-hidden
    />
  )
}
