import { createConfig, http, injected } from "wagmi"
import { baseSepolia, sepolia } from "viem/chains"

import { flashShieldConfig } from "@/integrations/flashshield/config"

/**
 * 双链 DApp：Sepolia（FlashShield 源链写入）+ Base Sepolia（目标链只读 RPC）。
 * 传输层使用与 FlashShield 相同的可配置 RPC（默认 PublicNode）。
 */
export const wagmiConfig = createConfig({
  chains: [sepolia, baseSepolia],
  connectors: [injected({ shimDisconnect: true })],
  transports: {
    [sepolia.id]: http(flashShieldConfig.ethereumSepoliaRpc),
    [baseSepolia.id]: http(flashShieldConfig.baseSepoliaRpc),
  },
})

declare module "wagmi" {
  interface Register {
    config: typeof wagmiConfig
  }
}
