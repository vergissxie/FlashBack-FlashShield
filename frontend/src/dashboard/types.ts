export type SystemStatus = "monitoring" | "idle" | "executing"

export type FlowPhase = "idle" | "oracle" | "reactor" | "execute" | "done"

export type HedgeHistoryRow = {
  id: string
  time: string
  triggerPrice: string
  hedgeChain: string
  size: string
  estPnl: string
  status: "success" | "pending"
  /** 目标链交易哈希（赛方验收） */
  destTxHash?: string
}

export type LastTx = {
  asset: string
  sizeEth: number
  estPnlUsd: number
  /** 目标链 Callback（兼容旧展示字段） */
  txHash?: string
  originTxHash?: string
  reactiveTxHash?: string
  destTxHash?: string
}
