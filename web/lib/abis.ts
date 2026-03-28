export const positionRiskSimulatorAbi = [
  "function openPosition(bytes32 strategyId,uint256 entryPrice,uint256 liquidationThreshold) external",
  "function updateMarkPrice(bytes32 strategyId,uint256 markPrice) external",
  "function getPosition(bytes32 strategyId) view returns (uint256 entryPrice,uint256 markPrice,uint256 liquidationThreshold,uint8 status)",
] as const;

export const protectionExecutorAbi = [
  "function getProtectionState() view returns (uint256 riskBalance,uint256 stableBalance,uint256 amountProtected,uint8 currentStatus,bytes32 strategyId,uint256 triggerPrice,uint8 action)",
] as const;
