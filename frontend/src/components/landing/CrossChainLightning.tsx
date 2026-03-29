import { motion, AnimatePresence } from "framer-motion"
import { useEffect } from "react"

type CrossChainLightningProps = {
  open: boolean
  onClose: () => void
}

/**
 * 主按钮「跨链闪电」：从按钮中心向左 Sepolia / 右 Polygon 发射光束（SVG stroke 动画）
 */
export function CrossChainLightning({ open, onClose }: CrossChainLightningProps) {
  useEffect(() => {
    if (!open) return
    const t = window.setTimeout(() => onClose(), 900)
    return () => window.clearTimeout(t)
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="pointer-events-none fixed inset-0 z-[60] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <svg
            className="h-full w-full max-w-5xl"
            viewBox="0 0 800 400"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden
          >
            <defs>
              <linearGradient id="beamL" x1="400" y1="200" x2="120" y2="200" gradientUnits="userSpaceOnUse">
                <stop stopColor="#22d3ee" />
                <stop offset="1" stopColor="#f87171" />
              </linearGradient>
              <linearGradient id="beamR" x1="400" y1="200" x2="680" y2="200" gradientUnits="userSpaceOnUse">
                <stop stopColor="#22d3ee" />
                <stop offset="1" stopColor="#34d399" />
              </linearGradient>
            </defs>
            <motion.path
              d="M400 200 L120 200"
              stroke="url(#beamL)"
              strokeWidth="3"
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0.2 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.45, ease: "easeOut" }}
            />
            <motion.path
              d="M400 200 L680 200"
              stroke="url(#beamR)"
              strokeWidth="3"
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0.2 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.45, ease: "easeOut", delay: 0.05 }}
            />
            <circle cx="120" cy="200" r="22" fill="rgba(248,113,113,0.15)" stroke="#f87171" strokeWidth="2" />
            <text x="120" y="206" textAnchor="middle" fill="#fecaca" fontSize="11" fontFamily="ui-monospace">
              Sepolia
            </text>
            <circle cx="680" cy="200" r="22" fill="rgba(52,211,153,0.15)" stroke="#34d399" strokeWidth="2" />
            <text x="680" y="206" textAnchor="middle" fill="#bbf7d0" fontSize="11" fontFamily="ui-monospace">
              Polygon
            </text>
            <circle cx="400" cy="200" r="14" fill="rgba(34,211,238,0.35)" stroke="#22d3ee" strokeWidth="2" />
          </svg>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
