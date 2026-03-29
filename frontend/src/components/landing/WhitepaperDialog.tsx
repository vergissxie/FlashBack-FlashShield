import { motion, AnimatePresence } from "framer-motion"
import { X } from "lucide-react"

import { Button } from "@/components/ui/button"

type WhitepaperDialogProps = {
  open: boolean
  onClose: () => void
}

/**
 * 白皮书悬浮卡片：SVG 动画演示 Delta Neutral / 三角对冲思路（示意）
 */
export function WhitepaperDialog({ open, onClose }: WhitepaperDialogProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="wp-title"
          onClick={onClose}
        >
          <motion.div
            className="relative max-h-[90vh] w-full max-w-lg overflow-auto rounded-2xl border border-white/15 bg-[hsl(262_35%_10%/0.92)] p-6 shadow-[0_0_80px_rgba(34,211,238,0.15)] backdrop-blur-xl"
            initial={{ scale: 0.92, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: 12, opacity: 0 }}
            transition={{ type: "spring", damping: 22, stiffness: 260 }}
            onClick={(e) => e.stopPropagation()}
          >
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-3 top-3 text-hero-muted hover:text-foreground"
              onClick={onClose}
              aria-label="关闭"
            >
              <X />
            </Button>
            <h2 id="wp-title" className="pr-10 text-lg font-semibold text-hero-heading">
              技术白皮书 · Delta Neutral 示意
            </h2>
            <p className="mt-2 text-sm text-hero-sub">
              通过跨链反向头寸，使组合 Delta 趋近于零：一链极端行情由另一链对冲吸收。
            </p>
            <div className="mt-6 rounded-xl border border-white/10 bg-black/25 p-4">
              <svg viewBox="0 0 320 200" className="h-auto w-full" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                <defs>
                  <linearGradient id="tri" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#22d3ee" />
                    <stop offset="100%" stopColor="#a855f7" />
                  </linearGradient>
                </defs>
                <motion.circle
                  cx="80"
                  cy="140"
                  r="10"
                  fill="rgba(248,113,113,0.35)"
                  stroke="#f87171"
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                />
                <motion.circle
                  cx="240"
                  cy="140"
                  r="10"
                  fill="rgba(52,211,153,0.35)"
                  stroke="#34d399"
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
                />
                <motion.circle
                  cx="160"
                  cy="50"
                  r="12"
                  fill="rgba(34,211,238,0.25)"
                  stroke="#22d3ee"
                  animate={{ scale: [1, 1.08, 1] }}
                  transition={{ duration: 1.8, repeat: Infinity }}
                />
                <motion.path
                  d="M80 140 L160 50 L240 140 Z"
                  fill="none"
                  stroke="url(#tri)"
                  strokeWidth="2"
                  strokeDasharray="1 0"
                  initial={{ pathLength: 0, opacity: 0.3 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 1.6, repeat: Infinity, repeatDelay: 1.2 }}
                />
                <motion.path
                  d="M160 50 L160 120"
                  stroke="rgba(226,232,240,0.35)"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                  animate={{ strokeDashoffset: [0, -16] }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                />
                <text x="70" y="175" fill="#94a3b8" fontSize="10" fontFamily="ui-monospace">
                  Leg A
                </text>
                <text x="225" y="175" fill="#94a3b8" fontSize="10" fontFamily="ui-monospace">
                  Leg B
                </text>
                <text x="145" y="40" fill="#e2e8f0" fontSize="10" fontFamily="ui-monospace">
                  Reactive
                </text>
              </svg>
            </div>
            <ul className="mt-4 space-y-2 text-xs text-hero-muted">
              <li>· Origin 监听价格与清算风险信号</li>
              <li>· Reactive 层撮合跨链执行与再平衡</li>
              <li>· Destination 完成对冲头寸与结算</li>
            </ul>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
