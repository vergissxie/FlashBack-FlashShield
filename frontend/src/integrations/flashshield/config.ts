function num(v: string | undefined, fallback: number) {
  const n = Number(v)
  return Number.isFinite(n) ? n : fallback
}

/**
 * 默认地址来自 FlashShield 仓库 README / docs/部署记录.md（Ethereum Sepolia + Base Sepolia + Reactive Lasna）。
 * @see https://github.com/SeeMoon357/FlashShield
 */
export const flashShieldConfig = {
  originChainId: num(import.meta.env.VITE_FS_ORIGIN_CHAIN_ID, 11155111),
  destinationChainId: num(import.meta.env.VITE_FS_DEST_CHAIN_ID, 84532),
  positionRiskSimulatorAddress:
    import.meta.env.VITE_FS_POSITION_RISK_SIMULATOR ??
    "0xc61465d293a4F7EaA11535bB805AF6447b932298",
  protectionExecutorAddress:
    import.meta.env.VITE_FS_PROTECTION_EXECUTOR ?? "0xE5181de9751b82C86ce1f5D5bd2F7B183e8cBd37",
  reactiveProtectionAddress:
    import.meta.env.VITE_FS_REACTIVE_PROTECTION ?? "0x2Fb3e3f539B06940Fb37d5258dD409d36B959Bb9",
  ethereumSepoliaRpc:
    import.meta.env.VITE_FS_ETHEREUM_SEPOLIA_RPC ?? "https://ethereum-sepolia-rpc.publicnode.com",
  baseSepoliaRpc:
    import.meta.env.VITE_FS_BASE_SEPOLIA_RPC ?? "https://base-sepolia-rpc.publicnode.com",
  reactiveCallbackProxy: import.meta.env.VITE_FS_REACTIVE_CALLBACK_PROXY ?? "",
  expectedRvmId: import.meta.env.VITE_FS_EXPECTED_RVM_ID ?? "",
} as const
