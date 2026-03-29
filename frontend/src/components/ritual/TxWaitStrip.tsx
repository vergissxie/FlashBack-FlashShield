import { AnimatePresence, motion, useReducedMotion } from "framer-motion"

type TxWaitStripProps = {
  active: boolean
  title: string
  /** 例如 feedback 里「等待 Reactive 回调…」 */
  detail?: string
}

/**
 * 链上等待期的「机械表游丝」感：与仪式解耦，专门覆盖签名 / 回执 / 轮询。
 */
export function TxWaitStrip({ active, title, detail }: TxWaitStripProps) {
  const reduce = useReducedMotion()

  return (
    <AnimatePresence>
      {active ? (
        <motion.div
          key="wait-strip"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: reduce ? 0 : 0.25, ease: "easeOut" }}
          className="overflow-hidden border-b border-[#0A1F3F]/12 bg-[#FAF9F6]/92 backdrop-blur-md"
        >
          <div className="mx-auto flex max-w-[1100px] flex-col gap-2 px-4 py-2.5">
            <div className="flex flex-wrap items-center gap-3">
              <div
                className="relative h-2 min-w-[120px] flex-1 overflow-hidden rounded-full bg-[#0A1F3F]/10 sm:min-w-[200px]"
                aria-hidden
              >
                {!reduce ? (
                  <motion.div
                    className="absolute inset-y-0 w-[28%] rounded-full bg-gradient-to-r from-[#3d6ea8]/25 via-[#C5A059] to-[#3d6ea8]/25 opacity-95 shadow-[0_0_10px_rgba(197,160,89,0.45)]"
                    animate={{ x: ["-35%", "135%"] }}
                    transition={{ duration: 1.45, repeat: Infinity, ease: "linear" }}
                  />
                ) : (
                  <div className="h-full w-full bg-[#C5A059]/35" />
                )}
              </div>
              <div className="flex min-w-0 flex-col items-end text-right sm:items-start sm:text-left">
                <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#0A1F3F]/70">
                  {title}
                </span>
                {detail ? (
                  <span className="mt-0.5 max-w-[min(100%,280px)] truncate text-[10px] text-[#0A1F3F]/45">
                    {detail}
                  </span>
                ) : null}
              </div>
            </div>
            {!reduce ? (
              <div className="flex gap-1 pl-0.5" aria-hidden>
                {[0, 1, 2, 3, 4].map((i) => (
                  <motion.span
                    key={i}
                    className="h-1 w-1 rounded-full bg-[#0A1F3F]/35"
                    animate={{ opacity: [0.25, 1, 0.25], scale: [0.85, 1, 0.85] }}
                    transition={{
                      duration: 0.9,
                      repeat: Infinity,
                      delay: i * 0.12,
                      ease: "easeInOut",
                    }}
                  />
                ))}
              </div>
            ) : null}
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
