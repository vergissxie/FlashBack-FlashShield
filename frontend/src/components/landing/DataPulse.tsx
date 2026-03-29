import { motion } from "framer-motion"

type DataPulseProps = {
  active: boolean
}

export function DataPulse({ active }: DataPulseProps) {
  return (
    <div className="relative h-10 w-full">
      <div className="absolute left-0 top-1/2 h-[2px] w-full -translate-y-1/2 bg-[#001F5B]/25" />
      <motion.div
        className="absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-[#C5A059] shadow-[0_0_18px_rgba(197,160,89,0.8)]"
        initial={{ left: "0%" }}
        animate={{ left: active ? "98%" : "0%" }}
        transition={{ duration: 2.5, ease: "linear" }}
      />
    </div>
  )
}

