import { motion } from "framer-motion"

import type { ChronicleItem } from "@/hooks/useHedgeSequence"

type EventChronicleProps = {
  items: ChronicleItem[]
}

const stateLabel = {
  clock: "WAIT",
  pulse: "FLOW",
  check: "DONE",
} as const

export function EventChronicle({ items }: EventChronicleProps) {
  return (
    <aside className="rounded-2xl border border-[#001F5B]/12 bg-white/75 p-4 shadow-[0_10px_24px_rgba(0,31,91,0.08)]">
      <h2 className="text-lg font-semibold text-[#001F5B] font-serif">Chronicle Logs</h2>
      <p className="mt-1 text-xs uppercase tracking-[0.2em] text-[#001F5B]/50">
        Navy Clock → Gold Pulse → Green Check
      </p>
      <div className="mt-4 space-y-3">
        {items.length === 0 && (
          <div className="rounded-lg border border-dashed border-[#001F5B]/20 p-4 text-sm text-[#001F5B]/60">
            等待事件触发...
          </div>
        )}
        {items.map((log, idx) => {
          const colors =
            log.state === "clock"
              ? "border-[#001F5B]/20 bg-[#F4F7FF]"
              : log.state === "pulse"
                ? "border-[#C5A059]/45 bg-[#FFF8EC]"
                : "border-emerald-300/60 bg-emerald-50/70"
          return (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: idx * 0.04 }}
              className={`rounded-xl border px-3 py-3 ${colors}`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-medium text-[#001F5B]">{log.title}</div>
                <span className="rounded px-2 py-0.5 text-[10px] font-mono tracking-wider text-[#001F5B]/75">
                  {stateLabel[log.state]}
                </span>
              </div>
              <div className="mt-1 text-xs text-[#001F5B]/70">{log.detail}</div>
              <div className="mt-2 font-mono text-xs text-[#001F5B]/65">{log.txHash}</div>
            </motion.div>
          )
        })}
      </div>
    </aside>
  )
}

