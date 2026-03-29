/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ORIGIN_CHAIN_LABEL?: string
  readonly VITE_DEST_CHAIN_LABEL?: string
  readonly VITE_ORIGIN_CONTRACT_ADDRESS?: string
  readonly VITE_REACTIVE_CONTRACT_ADDRESS?: string
  readonly VITE_DESTINATION_CONTRACT_ADDRESS?: string
  readonly VITE_TX_ORIGIN_DEPLOY?: string
  readonly VITE_TX_REACTIVE_DEPLOY?: string
  readonly VITE_TX_DESTINATION_DEPLOY?: string
  readonly VITE_TX_ORIGIN_TRIGGER?: string
  readonly VITE_TX_REACTIVE_EXECUTION?: string
  readonly VITE_TX_DESTINATION_CALLBACK?: string
  /** SeeMoon357/FlashShield 联调 */
  readonly VITE_FS_ORIGIN_CHAIN_ID?: string
  readonly VITE_FS_DEST_CHAIN_ID?: string
  readonly VITE_FS_POSITION_RISK_SIMULATOR?: string
  readonly VITE_FS_PROTECTION_EXECUTOR?: string
  readonly VITE_FS_REACTIVE_PROTECTION?: string
  readonly VITE_FS_ETHEREUM_SEPOLIA_RPC?: string
  readonly VITE_FS_BASE_SEPOLIA_RPC?: string
  readonly VITE_FS_REACTIVE_CALLBACK_PROXY?: string
  readonly VITE_FS_EXPECTED_RVM_ID?: string
  /** 机制演示视频 URL（默认同 `/media/mechanism-walkthrough.mp4`） */
  readonly VITE_MECHANISM_DEMO_VIDEO?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
