export const positionRiskSimulatorAbi = [
  "function openPosition(bytes32 strategyId,uint256 entryPrice,uint256 liquidationThreshold,uint256 collateralValue,uint256 targetPrice) external",
  "function updateMarkPrice(bytes32 strategyId,uint256 markPrice) external",
  "function getPosition(bytes32 strategyId) view returns (uint256 entryPrice,uint256 markPrice,uint256 liquidationThreshold,uint256 collateralValue,uint256 targetPrice,uint8 status)",
  "event NearLiquidation(bytes32 indexed strategyId,uint256 triggerPrice,uint256 collateralValue,uint256 targetPrice)",
] as const;

export const protectionExecutorAbi = [
  "function getProtectionState() view returns (uint256 hedgeSize,uint256 collateralValue,uint256 triggerPrice,uint256 targetPrice,uint256 multiplier,uint8 currentStatus,bytes32 strategyId,uint8 direction,uint8 action)",
  "event ShortPositionOpened(bytes32 indexed strategyId,uint256 triggerPrice,uint256 targetPrice,uint256 collateralValue,uint256 contractMultiplier,uint256 hedgeSize)",
] as const;
