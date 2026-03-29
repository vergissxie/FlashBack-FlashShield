import { useEffect, useRef } from "react"

/**
 * 底部：跨链对冲「平衡线」— A 链损失（红）与 B 链盈利（绿）相互抵消的 Demo 动画
 */
export function HedgeBalanceCanvas() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    let w = 0
    let h = 0
    let t = 0

    const resize = () => {
      const r = canvas.getBoundingClientRect()
      w = r.width
      h = r.height
      canvas.width = Math.floor(w * dpr)
      canvas.height = Math.floor(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    window.addEventListener("resize", resize)

    let raf = 0
    const draw = () => {
      t += 0.016
      ctx.clearRect(0, 0, w, h)

      const midY = h * 0.5
      ctx.strokeStyle = "rgba(148,163,184,0.2)"
      ctx.beginPath()
      ctx.moveTo(0, midY)
      ctx.lineTo(w, midY)
      ctx.stroke()

      const n = 120
      const loss: { x: number; y: number }[] = []
      const gain: { x: number; y: number }[] = []

      for (let i = 0; i < n; i++) {
        const x = (i / (n - 1)) * w
        const phase = t * 1.2 + i * 0.04
        const yLoss = midY + 40 + Math.sin(phase) * 28 + (i / n) * 55
        const yGain = midY - 40 - Math.sin(phase + 0.4) * 28 - (i / n) * 55
        loss.push({ x, y: yLoss })
        gain.push({ x, y: yGain })
      }

      const strokePath = (
        pts: { x: number; y: number }[],
        color: string,
        glow: string,
      ) => {
        ctx.strokeStyle = color
        ctx.shadowColor = glow
        ctx.shadowBlur = 14
        ctx.lineWidth = 2.2
        ctx.beginPath()
        pts.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)))
        ctx.stroke()
        ctx.shadowBlur = 0
      }

      strokePath(loss, "rgba(248,113,113,0.95)", "rgba(248,113,113,0.6)")
      strokePath(gain, "rgba(52,211,153,0.95)", "rgba(52,211,153,0.55)")

      const ix = Math.floor(n * 0.62)
      const cx = loss[ix]!.x
      const cy = (loss[ix]!.y + gain[ix]!.y) / 2
      const crossGlow = 0.5 + 0.5 * Math.sin(t * 5)
      ctx.fillStyle = `rgba(250,250,250,${0.35 + crossGlow * 0.45})`
      ctx.shadowColor = "rgba(34,211,238,0.9)"
      ctx.shadowBlur = 24 + crossGlow * 20
      ctx.beginPath()
      ctx.arc(cx, cy, 5 + crossGlow * 3, 0, Math.PI * 2)
      ctx.fill()
      ctx.shadowBlur = 0

      ctx.fillStyle = "rgba(226,232,240,0.85)"
      ctx.font = "11px ui-monospace, monospace"
      ctx.fillText("Hedge PnL offset · net ≈ 0 (demo)", 10, h - 10)

      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener("resize", resize)
    }
  }, [])

  return (
    <canvas
      ref={ref}
      className="h-[120px] w-full rounded-xl border border-white/10 bg-black/25 md:h-[140px]"
      aria-hidden
    />
  )
}
