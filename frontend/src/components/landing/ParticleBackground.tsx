import { useScroll, useSpring } from "framer-motion"
import { useEffect, useRef } from "react"

type ParticleBackgroundProps = {
  /** 降低移动端粒子数量 */
  reducedMotion?: boolean
}

/**
 * 全屏背景粒子：滚动时反转粒子漂移方向（隐喻「逆时间」）
 */
export function ParticleBackground({ reducedMotion }: ParticleBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { scrollY } = useScroll()
  const dir = useSpring(1, { stiffness: 80, damping: 28 })
  const lastY = useRef(0)

  useEffect(() => {
    return scrollY.on("change", (v) => {
      const delta = v - lastY.current
      lastY.current = v
      if (Math.abs(delta) > 0.5) {
        dir.set(delta > 0 ? -1 : 1)
      }
    })
  }, [dir, scrollY])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const count = reducedMotion ? 45 : 110
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    let w = 0
    let h = 0
    const pts: { x: number; y: number; s: number; o: number }[] = []

    const resize = () => {
      w = window.innerWidth
      h = window.innerHeight
      canvas.width = Math.floor(w * dpr)
      canvas.height = Math.floor(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      if (pts.length === 0) {
        for (let i = 0; i < count; i++) {
          pts.push({
            x: Math.random() * w,
            y: Math.random() * h,
            s: 0.4 + Math.random() * 1.6,
            o: 0.08 + Math.random() * 0.35,
          })
        }
      }
    }
    resize()
    window.addEventListener("resize", resize)

    let raf = 0
    const loop = () => {
      const flow = dir.get()
      ctx.clearRect(0, 0, w, h)
      for (const p of pts) {
        p.y += flow * 0.35 * p.s
        p.x += Math.sin(p.y * 0.002) * 0.15
        if (p.y > h + 10) p.y = -10
        if (p.y < -10) p.y = h + 10
        ctx.fillStyle = `rgba(186,200,255,${p.o})`
        ctx.fillRect(p.x, p.y, p.s, p.s)
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener("resize", resize)
    }
  }, [dir, reducedMotion])

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 -z-10 opacity-70"
      aria-hidden
    />
  )
}
