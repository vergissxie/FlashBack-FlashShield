import { reactiveDemoConfig } from "@/config/reactiveDemo"

import type { HedgeHistoryRow } from "./types"

const demoChain = reactiveDemoConfig.destChainLabel

export const INITIAL_HISTORY: HedgeHistoryRow[] = [
  {
    id: "h1",
    time: "2025-03-26 14:22:08",
    triggerPrice: "$3,198.40",
    hedgeChain: demoChain,
    size: "1.2 ETH",
    estPnl: "+$980.00",
    status: "success",
  },
  {
    id: "h2",
    time: "2025-03-25 09:15:41",
    triggerPrice: "$3,205.10",
    hedgeChain: demoChain,
    size: "0.8 ETH",
    estPnl: "+$640.00",
    status: "success",
  },
  {
    id: "h3",
    time: "2025-03-24 18:03:22",
    triggerPrice: "$3,189.00",
    hedgeChain: demoChain,
    size: "2.0 ETH",
    estPnl: "+$1,450.00",
    status: "success",
  },
  {
    id: "h4",
    time: "2025-03-23 11:47:55",
    triggerPrice: "$3,210.55",
    hedgeChain: demoChain,
    size: "0.5 ETH",
    estPnl: "+$310.00",
    status: "pending",
  },
]
