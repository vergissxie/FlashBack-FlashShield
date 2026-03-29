import { motion } from "framer-motion"

import type { HedgeStage } from "@/hooks/useHedgeSequence"

type BalanceScaleProps = {
  tilt: number
  stage: HedgeStage
}

export function BalanceScale({ tilt, stage }: BalanceScaleProps) {
  const transmission = stage === "transmission"
  const settling = stage === "settlement" || stage === "restored"
  return (
    <div className="rounded-2xl border border-[#001F5B]/10 bg-[#F8F8F4] p-4">
      <div className="text-center text-xs uppercase tracking-[0.2em] text-[#001F5B]/60">
        Reactive Layer Transmission Engine
      </div>
      <div className="mt-4">
        <div className="mx-auto flex w-[170px] items-center justify-center gap-4 md:w-[210px]">
          {[0, 1, 2].map((n) => (
            <motion.div
              key={n}
              className="relative h-10 w-10 rounded-full border-2 border-[#C5A059]/80"
              animate={transmission ? { rotate: n % 2 ? 360 : -360 } : { rotate: 0 }}
              transition={{
                duration: 2.8,
                repeat: transmission ? Infinity : 0,
                ease: "linear",
              }}
            >
              <div className="absolute inset-[9px] rounded-full border border-[#C5A059]/75" />
            </motion.div>
          ))}
        </div>
      </div>
      <div className="mt-5 flex justify-center">
        <motion.div
          className="relative h-20 w-44 md:w-52"
          animate={
            transmission
              ? { rotate: [tilt, tilt - 1.8, tilt + 1.2, tilt - 1.1, tilt] }
              : { rotate: tilt }
          }
          transition={{
            // Stage 2: 传导中轻微颤动，体现异步计算仍在进行
            // Stage 3: 回正使用 anticipate，模拟轻微过冲再精准回弹
            duration: transmission ? 0.55 : 1,
            ease: settling ? "anticipate" : "easeInOut",
            repeat: transmission ? Infinity : 0,
          }}
        >
          <div className="absolute left-1/2 top-0 h-6 w-[2px] -translate-x-1/2 bg-[#C5A059]" />
          <div className="absolute bottom-4 left-0 right-0 h-[3px] rounded-full bg-[#C5A059]" />
          <div className="absolute bottom-0 left-2 h-8 w-10 rounded-b-full border border-[#C5A059]/75">
            <div className="pt-1 text-center text-[10px] font-mono text-[#001F5B]/70">风险</div>
          </div>
          <div className="absolute bottom-0 right-2 h-8 w-10 rounded-b-full border border-[#C5A059]/75">
            <div className="pt-1 text-center text-[10px] font-mono text-[#001F5B]/70">对冲</div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

