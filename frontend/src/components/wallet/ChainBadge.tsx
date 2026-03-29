import { useAccount } from "wagmi"

const NAMES: Record<number, string> = {
  11155111: "Sepolia",
  84532: "Base Sepolia",
}

/**
 * 当前钱包所在链；与业务「源/目标」文案区分展示。
 */
export function ChainBadge({ className = "" }: { className?: string }) {
  const { chainId, isConnected } = useAccount()
  if (!isConnected || chainId === undefined) {
    return (
      <span className={`rounded-full bg-[#0A1F3F]/8 px-2 py-0.5 text-[10px] text-[#0A1F3F]/55 ${className}`}>
        未选链
      </span>
    )
  }
  const name = NAMES[chainId] ?? `chain ${chainId}`
  return (
    <span
      className={`rounded-full bg-[#036652]/12 px-2 py-0.5 font-mono text-[10px] text-[#036652] ${className}`}
    >
      {name}
    </span>
  )
}
