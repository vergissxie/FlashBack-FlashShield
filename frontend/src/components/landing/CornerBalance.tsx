import { motion, useScroll, useTransform } from "framer-motion"

export function CornerBalance() {
  const { scrollYProgress } = useScroll()
  const rotate = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [-6, 4, -3, 0])

  return (
    <motion.div className="relative h-24 w-56" style={{ rotate }}>
      <div className="absolute left-1/2 top-0 h-6 w-[2px] -translate-x-1/2 bg-[#0A1F3F]" />
      <div className="absolute bottom-5 left-0 right-0 h-[3px] rounded-full bg-[#E6D5B8]" />
      <div className="absolute bottom-0 left-2 h-10 w-14 rounded-b-full border border-[#0A1F3F]/45 bg-[#E9E8E4]">
        <div className="pt-1 text-center font-mono text-[10px] text-[#0A1F3F]/70">风险</div>
      </div>
      <div className="absolute bottom-0 right-2 h-10 w-14 rounded-b-full border border-[#0A1F3F]/45 bg-[#E9E8E4]">
        <div className="pt-1 text-center font-mono text-[10px] text-[#0A1F3F]/70">对冲</div>
      </div>
    </motion.div>
  )
}

