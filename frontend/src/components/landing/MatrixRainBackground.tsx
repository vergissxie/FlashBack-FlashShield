import { useCallback, useEffect, useRef } from "react"

export type MatrixRainBackgroundProps = {
  /** 关闭时不挂载 Canvas，节省性能 */
  enabled: boolean
  /** 移动端 / 系统减弱动效时降低列数与特效 */
  reducedMotion?: boolean
}

/** 项目关键词：随机「亮起」时短暂替换普通字符，暗示数据语义 */
const KEYWORDS = [
  "FlashBack",
  "Sepolia",
  "Polygon",
  "HEDGE",
  "REACTIVE",
  "DELTA",
] as const

/** 左区 Sepolia：价格暴跌信号注入（红字预警片段） */
const LEFT_WARN_FRAGMENTS = ["↓", "PRICE", "WARN", "LIQ", "DROP", "!"] as const

/** 右区 Polygon：对冲盈利语义（绿字） */
const RIGHT_GAIN_FRAGMENTS = ["+", "P&L", "↑", "GAIN", "HEDGE", "OK"] as const

type Zone = "left" | "center" | "right"

type ColumnDrop = {
  /** 列左坐标 */
  x: number
  /** 雨滴头部 y */
  y: number
  /** 下落速度 px/frame（含分区倍率） */
  speed: number
  /** 尾迹长度（字符格数） */
  trailLen: number
  zone: Zone
  /** 每格字符与闪烁相位 */
  glyphs: string[]
  flash: {
    word: string
    pos: number
    ttl: number
  } | null
  /** 随机亮度闪烁 */
  twinkle: number
}

/**
 * 黑客帝国数字雨背景（Canvas）
 *
 * 与业务叙事映射：
 * - 左 1/3：数据监听侧「风险注入」——更多红预警片段
 * - 中 1/3：Reactive 核心——最密、最快 + 蓝紫脉冲（高速处理）
 * - 右 1/3：对冲落地——绿色正向收益片段，与左侧形成视觉对冲
 *
 * 交互：全局 mousemove 驱动涡流偏移（绕光标轻微旋转），隐喻「观测者影响数据流」
 */
export function MatrixRainBackground({
  enabled,
  reducedMotion,
}: MatrixRainBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mouseRef = useRef({ x: 0, y: 0, active: false })
  const dropsRef = useRef<ColumnDrop[]>([])
  const pulseRef = useRef(0)

  const onMove = useCallback((e: MouseEvent) => {
    mouseRef.current = { x: e.clientX, y: e.clientY, active: true }
  }, [])

  const onLeave = useCallback(() => {
    mouseRef.current.active = false
  }, [])

  useEffect(() => {
    if (!enabled) return
    window.addEventListener("mousemove", onMove, { passive: true })
    window.addEventListener("mouseleave", onLeave)
    return () => {
      window.removeEventListener("mousemove", onMove)
      window.removeEventListener("mouseleave", onLeave)
    }
  }, [enabled, onLeave, onMove])

  useEffect(() => {
    if (!enabled) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d", { alpha: true })
    if (!ctx) return

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    let w = 0
    let h = 0
    let fontSize = reducedMotion ? 13 : 15

    /** 随机下落字符：不含日文假名；保留数字/英文/符号与汉字「日月年」 */
    const charset =
      "0123456789日月年ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!@#$%^&*()_+-=[]{}|;:,.<>?/~"

    const zoneAt = (x: number): Zone => {
      const t = x / w
      if (t < 1 / 3) return "left"
      if (t < 2 / 3) return "center"
      return "right"
    }

    const pickGlyph = (zone: Zone, rowFromHead: number, headBright: number): string => {
      const r = Math.random()
      if (zone === "left" && r < 0.14) {
        return LEFT_WARN_FRAGMENTS[Math.floor(Math.random() * LEFT_WARN_FRAGMENTS.length)]!
      }
      if (zone === "right" && r < 0.12) {
        return RIGHT_GAIN_FRAGMENTS[Math.floor(Math.random() * RIGHT_GAIN_FRAGMENTS.length)]!
      }
      if (rowFromHead === 0 && r < 0.08 + headBright * 0.05) {
        return charset[Math.floor(Math.random() * charset.length)]!
      }
      return charset[Math.floor(Math.random() * charset.length)]!
    }

    const initDrops = () => {
      dropsRef.current = []
      const totalCols = Math.max(8, Math.floor(w / fontSize))
      /** 性能：列数上限，避免低端机掉帧 */
      const maxCols = reducedMotion ? 36 : 72
      const actualCols = Math.min(totalCols, maxCols)
      const step = w / actualCols

      for (let i = 0; i < actualCols; i++) {
        const x = i * step + step * 0.1
        const zone = zoneAt(x)
        const speedMul =
          zone === "center" ? 1.35 + Math.random() * 0.55 : 0.65 + Math.random() * 0.55
        const trailLen =
          zone === "center"
            ? 18 + Math.floor(Math.random() * 22)
            : 12 + Math.floor(Math.random() * 18)

        const glyphs: string[] = []
        for (let j = 0; j < trailLen; j++) {
          glyphs.push(pickGlyph(zone, j, 1))
        }

        dropsRef.current.push({
          x,
          y: Math.random() * -h * 1.5,
          speed: (1.2 + Math.random() * 1.8) * speedMul * (reducedMotion ? 0.75 : 1),
          trailLen,
          zone,
          glyphs,
          flash: null,
          twinkle: Math.random() * Math.PI * 2,
        })
      }
    }

    const resize = () => {
      w = window.innerWidth
      h = window.innerHeight
      canvas.width = Math.floor(w * dpr)
      canvas.height = Math.floor(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      fontSize = reducedMotion ? 12 : window.innerWidth < 768 ? 12 : 15
      initDrops()
    }
    resize()
    window.addEventListener("resize", resize)

    let raf = 0
    let last = performance.now()

    const vortexOffset = (px: number, py: number) => {
      const m = mouseRef.current
      if (!m.active || reducedMotion) return { ox: 0, oy: 0 }
      const dx = px - m.x
      const dy = py - m.y
      const dist = Math.sqrt(dx * dx + dy * dy) + 80
      const str = 420 / dist
      /** 涡流：垂直于径向的切向偏移 */
      return {
        ox: (-dy / dist) * str * 1.2,
        oy: (dx / dist) * str * 1.2,
      }
    }

    const frame = (now: number) => {
      const dt = Math.min(32, now - last)
      last = now
      pulseRef.current += dt * 0.004

      ctx.fillStyle = "rgba(5, 8, 12, 0.22)"
      ctx.fillRect(0, 0, w, h)

      /** 中区 Reactive：蓝紫脉冲光晕（高速处理隐喻） */
      if (!reducedMotion) {
        const cx = w * 0.5
        const cy = h * 0.45
        const pulse = 0.35 + 0.25 * Math.sin(pulseRef.current * 2.2)
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.min(w, h) * 0.42)
        g.addColorStop(0, `rgba(34, 211, 238, ${0.06 * pulse})`)
        g.addColorStop(0.45, `rgba(168, 85, 247, ${0.05 * pulse})`)
        g.addColorStop(1, "rgba(0,0,0,0)")
        ctx.fillStyle = g
        ctx.fillRect(0, 0, w, h)
      }

      ctx.font = `${fontSize}px ui-monospace, "Cascadia Code", monospace`
      ctx.textBaseline = "top"

      for (const drop of dropsRef.current) {
        drop.twinkle += 0.08 + drop.speed * 0.01

        /** 随机触发关键词闪烁 */
        if (!drop.flash && Math.random() < 0.0018) {
          const word = KEYWORDS[Math.floor(Math.random() * KEYWORDS.length)]!
          drop.flash = { word, pos: 0, ttl: 28 + Math.floor(Math.random() * 24) }
        }

        if (drop.flash) {
          drop.flash.ttl -= 1
          if (drop.flash.ttl <= 0) drop.flash = null
          else if (Math.random() < 0.45) drop.flash.pos = (drop.flash.pos + 1) % drop.flash.word.length
        }

        for (let j = 0; j < drop.trailLen; j++) {
          const py = drop.y + j * fontSize
          if (py < -fontSize || py > h + 40) continue

          const { ox, oy } = vortexOffset(drop.x, py)
          const px = drop.x + ox
          const pyDraw = py + oy

          const head = j === 0
          const tailFade = 1 - j / drop.trailLen
          const baseA = head ? 0.95 : 0.15 + tailFade * 0.45
          const tw = 0.15 * Math.sin(drop.twinkle + j * 0.4)

          let ch = drop.glyphs[j]!
          if (drop.flash && j === 0) {
            ch = drop.flash.word[drop.flash.pos] ?? ch
          }

          let r = 40
          let g = 255
          let b = 90
          if (drop.zone === "left") {
            const warn =
              ch === "↓" ||
              ch === "!" ||
              ch.includes("WARN") ||
              ch === "LIQ" ||
              ch === "DROP" ||
              ch === "PRICE"
            if (warn || (head && Math.random() < 0.08)) {
              r = 255
              g = 80 + tw * 40
              b = 100
            }
          } else if (drop.zone === "right") {
            const gain =
              ch === "+" ||
              ch.includes("GAIN") ||
              ch.includes("P&L") ||
              ch.includes("↑") ||
              ch === "OK" ||
              ch === "HEDGE"
            if (gain || (head && Math.random() < 0.07)) {
              r = 60 + tw * 30
              g = 255
              b = 140
            }
          } else {
            /** 中区偏青 */
            r = 50 + tw * 20
            g = 240
            b = 200
          }

          if (head) {
            ctx.shadowColor = `rgba(${r},${g},${b},0.85)`
            ctx.shadowBlur = drop.zone === "center" ? 14 : 10
          } else {
            ctx.shadowBlur = 0
          }

          ctx.fillStyle = `rgba(${r},${g},${b},${Math.min(1, baseA + tw * 0.12)})`
          ctx.fillText(ch, px, pyDraw)

          /** 随机刷新尾迹字符（模拟新旧数据交替） */
          if (Math.random() < 0.04 + (head ? 0.12 : 0)) {
            drop.glyphs[j] = pickGlyph(drop.zone, j, tailFade)
          }
        }

        ctx.shadowBlur = 0

        /** 中区下落更快、更密已在 init 中通过 speed/trail 体现；此处更新位置 */
        drop.y += drop.speed * (dt / 16)

        if (drop.y > h + drop.trailLen * fontSize) {
          drop.y = -drop.trailLen * fontSize * (0.5 + Math.random())
          drop.speed =
            (1.2 + Math.random() * 1.8) *
            (drop.zone === "center" ? 1.35 + Math.random() * 0.55 : 0.65 + Math.random() * 0.55) *
            (reducedMotion ? 0.75 : 1)
        }
      }

      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener("resize", resize)
    }
  }, [enabled, reducedMotion])

  if (!enabled) return null

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 -z-[12] h-full w-full"
      aria-hidden
    />
  )
}
