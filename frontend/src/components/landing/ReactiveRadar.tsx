import { useEffect, useRef } from "react"

/**
 * 右侧：Reactive Layer — 脉冲霓虹光环（雷达扫描）+ 粒子流动
 * 体现「毫秒级监听 / 事件驱动响应」
 */
export function ReactiveRadar() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    let w = 0
    let h = 0
    let t = 0
    const parts: { x: number; y: number; vx: number; vy: number; a: number }[] = []

    const resize = () => {
      const r = canvas.getBoundingClientRect()
      w = r.width
      h = r.height
      canvas.width = Math.floor(w * dpr)
      canvas.height = Math.floor(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      if (parts.length === 0) {
        for (let i = 0; i < 90; i++) {
          parts.push({
            x: Math.random() * w,
            y: Math.random() * h,
            vx: (Math.random() - 0.5) * 0.7,
            vy: (Math.random() - 0.5) * 0.7,
            a: 0.2 + Math.random() * 0.6,
          })
        }
      }
    }
    resize()
    window.addEventListener("resize", resize)

    let raf = 0
    const loop = () => {
      t += 0.02
      ctx.clearRect(0, 0, w, h)

      const cx = w * 0.5
      const cy = h * 0.52
      const maxR = Math.min(w, h) * 0.48

      const sweep = (t * 140) % 360
      const g = ctx.createConicGradient(
        (sweep * Math.PI) / 180,
        cx,
        cy,
      )
      g.addColorStop(0, "rgba(34,211,238,0.55)")
      g.addColorStop(0.15, "rgba(34,211,238,0.08)")
      g.addColorStop(1, "rgba(34,211,238,0)")

      ctx.fillStyle = g
      ctx.beginPath()
      ctx.arc(cx, cy, maxR, 0, Math.PI * 2)
      ctx.fill()

      ctx.strokeStyle = "rgba(34,211,238,0.35)"
      ctx.lineWidth = 1
      for (let i = 1; i <= 4; i++) {
        ctx.beginPath()
        ctx.arc(cx, cy, (maxR * i) / 4, 0, Math.PI * 2)
        ctx.stroke()
      }

      ctx.strokeStyle = "rgba(168,85,247,0.5)"
      ctx.shadowColor = "rgba(34,211,238,0.8)"
      ctx.shadowBlur = 18
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(cx, cy, maxR * 0.55 + Math.sin(t * 3) * 6, 0, Math.PI * 2)
      ctx.stroke()
      ctx.shadowBlur = 0

      for (const p of parts) {
        p.x += p.vx
        p.y += p.vy
        if (p.x < 0 || p.x > w) p.vx *= -1
        if (p.y < 0 || p.y > h) p.vy *= -1
        const dx = p.x - cx
        const dy = p.y - cy
        const d = Math.sqrt(dx * dx + dy * dy)
        if (d < maxR * 1.1) {
          ctx.fillStyle = `rgba(34,211,238,${p.a})`
          ctx.fillRect(p.x, p.y, 1.2, 1.2)
        }
      }

      ctx.fillStyle = "rgba(226,232,240,0.9)"
      ctx.font = "11px ui-monospace, monospace"
      ctx.fillText("Reactive Layer · listener (demo)", 10, 18)

      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener("resize", resize)
    }
  }, [])

  return (
    <div className="relative h-full min-h-[200px] w-full overflow-hidden rounded-2xl border border-cyan-500/25 bg-gradient-to-b from-cyan-950/40 to-purple-950/30 md:min-h-[240px]">
      <div
        className="pointer-events-none absolute inset-0 animate-pulse-ring rounded-2xl"
        style={{
          boxShadow: "inset 0 0 60px rgba(34,211,238,0.15)",
        }}
      />
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-hidden />
    </div>
  )
}
