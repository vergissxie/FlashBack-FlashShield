import { motion } from "framer-motion"

import { cn } from "@/lib/utils"

type PrecisionGaugeProps = {
  label: string
  subLabel: string
  value: number
  color: "navy" | "gold"
  alert?: boolean
}

export function PrecisionGauge({
  label,
  subLabel,
  value,
  color,
  alert = false,
}: PrecisionGaugeProps) {
  const stroke = color === "gold" ? "#C5A059" : "#001F5B"
  const angle = -125 + value * 250
  const ticks = Array.from({ length: 37 }, (_, idx) => idx)
  const cx = 90
  // 轴心固定不动：保持在圆盘中心
  const pivotTopPct = 50
  const cy = 90
  // 仅上移“金色上框”弧线，不改变轴心
  const upperArcY = 84
  return (
    <div
      className={cn(
        "rounded-2xl border p-4 shadow-[0_12px_30px_rgba(0,31,91,0.08)]",
        "border-[#001F5B]/15 bg-[#FAFAFA]/90",
        alert && "bg-[radial-gradient(circle_at_50%_45%,rgba(185,28,28,0.14),transparent_65%)]",
      )}
    >
      <div className="text-sm font-medium text-[#001F5B]">{label}</div>
      <div className="font-mono text-xs text-[#001F5B]/65">{subLabel}</div>
      <div className="relative mx-auto mt-4 h-[180px] w-[180px]">
        <svg viewBox="0 0 180 180" className="h-full w-full">
          <circle cx={cx} cy={cy} r="82" fill="#F5F5F5" stroke="#001F5B20" strokeWidth="1.2" />
          {ticks.map((i) => {
            const a = (-125 + i * (250 / 36)) * (Math.PI / 180)
            const major = i % 6 === 0
            const r1 = major ? 66 : 70
            const r2 = 76
            const x1 = cx + Math.cos(a) * r1
            const y1 = cy + Math.sin(a) * r1
            const x2 = cx + Math.cos(a) * r2
            const y2 = cy + Math.sin(a) * r2
            return (
              <line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="#001F5B80"
                strokeWidth={major ? 1.8 : 1}
              />
            )
          })}
          <path
            d={`M${cx - 64} ${upperArcY} A64 64 0 0 1 ${cx + 64} ${upperArcY}`}
            fill="none"
            stroke={stroke}
            strokeWidth={2.8}
          />
        </svg>
        <div
          className="absolute left-1/2 h-[72px] w-[2px] -translate-x-1/2 -translate-y-full"
          style={{ top: `${pivotTopPct}%` }}
        >
          <motion.div
            className="h-full w-full origin-bottom rounded-full"
            style={{ background: stroke }}
            animate={{ rotate: angle }}
            transition={{ type: "spring", stiffness: 130, damping: 18, mass: 0.95 }}
          />
        </div>
        <div
          className="absolute left-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#001F5B33] bg-white"
          style={{ top: `${pivotTopPct}%` }}
        />
      </div>
      <div className="mt-3 text-center font-mono text-sm text-[#001F5B]/75">{Math.round(value * 100)}%</div>
    </div>
  )
}

