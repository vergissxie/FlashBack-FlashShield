/**
 * 睿应层（Reactive Layer）演示配置：部署地址与全流程交易哈希通过 Vite 环境变量注入，
 * 便于 README 要求中的「公开合约地址 + 完整 tx 记录」与大屏展示一致。
 */
function env(key: string): string | undefined {
  const raw = (import.meta.env as Record<string, string | undefined>)[key]
  if (typeof raw !== "string") return undefined
  const v = raw.trim()
  return v.length ? v : undefined
}

export type ReactiveDemoConfig = {
  originChainLabel: string
  destChainLabel: string
  originAddress?: string
  reactiveAddress?: string
  destinationAddress?: string
  txOriginDeploy?: string
  txReactiveDeploy?: string
  txDestinationDeploy?: string
  txOriginTrigger?: string
  txReactiveExecution?: string
  txDestinationCallback?: string
}

export const reactiveDemoConfig: ReactiveDemoConfig = {
  originChainLabel: env("VITE_ORIGIN_CHAIN_LABEL") ?? "源链（请在 .env 填写 VITE_ORIGIN_CHAIN_LABEL）",
  destChainLabel: env("VITE_DEST_CHAIN_LABEL") ?? "目标链（请在 .env 填写 VITE_DEST_CHAIN_LABEL）",
  originAddress: env("VITE_ORIGIN_CONTRACT_ADDRESS"),
  reactiveAddress: env("VITE_REACTIVE_CONTRACT_ADDRESS"),
  destinationAddress: env("VITE_DESTINATION_CONTRACT_ADDRESS"),
  txOriginDeploy: env("VITE_TX_ORIGIN_DEPLOY"),
  txReactiveDeploy: env("VITE_TX_REACTIVE_DEPLOY"),
  txDestinationDeploy: env("VITE_TX_DESTINATION_DEPLOY"),
  txOriginTrigger: env("VITE_TX_ORIGIN_TRIGGER"),
  txReactiveExecution: env("VITE_TX_REACTIVE_EXECUTION"),
  txDestinationCallback: env("VITE_TX_DESTINATION_CALLBACK"),
}

export function hasDeploymentProof(c: ReactiveDemoConfig) {
  return Boolean(c.originAddress && c.reactiveAddress && c.destinationAddress)
}
