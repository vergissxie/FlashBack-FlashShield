import { useEffect, useRef } from "react"

type ClassicClockCanvasProps = {
  size?: number
}

export function ClassicClockCanvas({ size = 220 }: ClassicClockCanvasProps) {
  const ref = useRef<HTMLCanvasElement>(null)
  const lastSecondRef = useRef<number>(-1)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    canvas.width = size * dpr
    canvas.height = size * dpr
    canvas.style.width = `${size}px`
    canvas.style.height = `${size}px`
    ctx.scale(dpr, dpr)

    let raf = 0

    const tickSound = () => {
      // Mechanical click with very low volume.
      try {
        const Ctx =
          window.AudioContext ||
          (window as typeof window & { webkitAudioContext?: typeof AudioContext })
            .webkitAudioContext
        if (!Ctx) return
        const audio = new Ctx()
        const osc = audio.createOscillator()
        const gain = audio.createGain()
        osc.type = "square"
        osc.frequency.value = 1450
        gain.gain.value = 0.01
        osc.connect(gain)
        gain.connect(audio.destination)
        osc.start()
        osc.stop(audio.currentTime + 0.02)
      } catch {
        // ignore audio failures
      }
    }

    const render = () => {
      const now = new Date()
      const sec = now.getSeconds()
      const min = now.getMinutes()
      const hr = now.getHours() % 12

      if (sec !== lastSecondRef.current) {
        lastSecondRef.current = sec
        tickSound()
      }

      ctx.clearRect(0, 0, size, size)

      const cx = size / 2
      const cy = size / 2
      const r = size * 0.46

      const dial = ctx.createRadialGradient(cx, cy, r * 0.2, cx, cy, r)
      dial.addColorStop(0, "#FAF9F6")
      dial.addColorStop(1, "#E9E8E4")
      ctx.fillStyle = dial
      ctx.beginPath()
      ctx.arc(cx, cy, r, 0, Math.PI * 2)
      ctx.fill()

      ctx.strokeStyle = "#0A1F3F"
      ctx.lineWidth = 1.2
      ctx.beginPath()
      ctx.arc(cx, cy, r, 0, Math.PI * 2)
      ctx.stroke()

      for (let i = 0; i < 60; i++) {
        const major = i % 5 === 0
        const a = (Math.PI * 2 * i) / 60 - Math.PI / 2
        const r1 = r * (major ? 0.8 : 0.86)
        const r2 = r * 0.92
        ctx.strokeStyle = "#0A1F3F"
        ctx.lineWidth = major ? 1.8 : 0.8
        ctx.beginPath()
        ctx.moveTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1)
        ctx.lineTo(cx + Math.cos(a) * r2, cy + Math.sin(a) * r2)
        ctx.stroke()
      }

      const drawHand = (
        angle: number,
        len: number,
        w: number,
        color: string,
        tail = 0.06,
      ) => {
        const a = angle - Math.PI / 2
        ctx.strokeStyle = color
        ctx.lineWidth = w
        ctx.lineCap = "round"
        ctx.beginPath()
        ctx.moveTo(cx - Math.cos(a) * (r * tail), cy - Math.sin(a) * (r * tail))
        ctx.lineTo(cx + Math.cos(a) * (r * len), cy + Math.sin(a) * (r * len))
        ctx.stroke()
      }

      drawHand((((hr + min / 60) * Math.PI) / 6), 0.5, 3.2, "#0A1F3F")
      drawHand(((min * Math.PI) / 30), 0.72, 2.2, "#0A1F3F")
      drawHand(((sec * Math.PI) / 30), 0.78, 1.2, "#B7410E", 0.08)

      ctx.fillStyle = "#E6D5B8"
      ctx.beginPath()
      ctx.arc(cx, cy, 4.2, 0, Math.PI * 2)
      ctx.fill()

      ctx.fillStyle = "#0A1F3F"
      ctx.font = "10px 'Times New Roman', serif"
      ctx.textAlign = "center"
      ctx.fillText("GMT", cx, cy + r * 0.28)

      raf = window.requestAnimationFrame(render)
    }

    raf = window.requestAnimationFrame(render)
    return () => window.cancelAnimationFrame(raf)
  }, [size])

  return (
    <div className="rounded-full border border-[#0A1F3F]/20 bg-[#FAF9F6] p-2 shadow-[0_10px_30px_rgba(10,31,63,0.15)]">
      <canvas ref={ref} aria-label="GMT mechanical clock" />
    </div>
  )
}

