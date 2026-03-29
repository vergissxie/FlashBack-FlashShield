import { AnimatePresence, motion } from "framer-motion"

type ParticleBurstProps = {
  show: boolean
  x: number
  y: number
}

/** 主按钮点击：粒子爆炸（短时） */
export function ParticleBurst({ show, x, y }: ParticleBurstProps) {
  const parts = Array.from({ length: 28 }, (_, i) => ({
    a: (i / 28) * Math.PI * 2,
    // Deterministic pseudo-random spread to satisfy render purity lint rule.
    d: 40 + ((i * 37) % 90),
  }))

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="pointer-events-none fixed z-[70]"
          style={{ left: x, top: y }}
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {parts.map((p, i) => (
            <motion.span
              key={i}
              className="absolute h-1 w-1 rounded-full bg-cyan-300 shadow-[0_0_8px_#22d3ee]"
              initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
              animate={{
                x: Math.cos(p.a) * p.d,
                y: Math.sin(p.a) * p.d,
                opacity: 0,
                scale: 0.2,
              }}
              transition={{ duration: 0.55, ease: "easeOut" }}
            />
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
