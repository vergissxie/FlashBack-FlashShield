// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title PositionRiskSimulator
/// @notice Minimal A-chain risk simulator for the FlashShield hackathon demo.
contract PositionRiskSimulator {
    uint256 private constant BPS_DENOMINATOR = 10_000;
    uint256 private constant NEAR_LIQUIDATION_BUFFER_BPS = 11_000;

    enum PositionStatus {
        Open,
        NearLiquidation,
        Liquidated
    }

    struct Position {
        uint256 entryPrice;
        uint256 markPrice;
        uint256 liquidationThreshold;
        uint256 collateralValue;
        uint256 targetPrice;
        PositionStatus status;
    }

    mapping(bytes32 => Position) private _positions;

    event PositionOpened(
        bytes32 indexed strategyId,
        uint256 entryPrice,
        uint256 liquidationThreshold,
        uint256 collateralValue,
        uint256 targetPrice
    );
    event MarkPriceUpdated(bytes32 indexed strategyId, uint256 markPrice);
    event NearLiquidation(
        bytes32 indexed strategyId,
        uint256 triggerPrice,
        uint256 collateralValue,
        uint256 targetPrice
    );
    event LiquidationTriggered(bytes32 indexed strategyId, uint256 triggerPrice);

    error InvalidPrice();
    error InvalidThreshold();
    error PositionNotFound(bytes32 strategyId);
    error PositionAlreadyExists(bytes32 strategyId);

    /// @notice Opens a new simulated position.
    /// @param strategyId The strategy identifier used by Reactive callback routing.
    /// @param entryPrice The initial entry price.
    /// @param liquidationThreshold The price at or below which the position is liquidated.
    function openPosition(
        bytes32 strategyId,
        uint256 entryPrice,
        uint256 liquidationThreshold,
        uint256 collateralValue,
        uint256 targetPrice
    ) external {
        if (strategyId == bytes32(0)) revert PositionNotFound(strategyId);
        if (entryPrice == 0) revert InvalidPrice();
        if (liquidationThreshold == 0 || liquidationThreshold >= entryPrice) revert InvalidThreshold();
        if (collateralValue == 0) revert InvalidPrice();
        if (targetPrice == 0 || targetPrice >= liquidationThreshold) revert InvalidThreshold();
        if (_positions[strategyId].entryPrice != 0) revert PositionAlreadyExists(strategyId);

        _positions[strategyId] = Position({
            entryPrice: entryPrice,
            markPrice: entryPrice,
            liquidationThreshold: liquidationThreshold,
            collateralValue: collateralValue,
            targetPrice: targetPrice,
            status: PositionStatus.Open
        });

        emit PositionOpened(strategyId, entryPrice, liquidationThreshold, collateralValue, targetPrice);
    }

    /// @notice Updates the mark price and emits the appropriate risk event if the state changes.
    /// @param strategyId The id of the position to update.
    /// @param markPrice The new simulated market price.
    function updateMarkPrice(bytes32 strategyId, uint256 markPrice) external {
        if (markPrice == 0) revert InvalidPrice();

        Position storage position = _positionOrRevert(strategyId);
        position.markPrice = markPrice;

        emit MarkPriceUpdated(strategyId, markPrice);

        if (position.status == PositionStatus.Liquidated) {
            return;
        }

        if (markPrice <= position.liquidationThreshold) {
            position.status = PositionStatus.Liquidated;
            emit LiquidationTriggered(strategyId, markPrice);
            return;
        }

        uint256 nearLiquidationThreshold = (position.liquidationThreshold * NEAR_LIQUIDATION_BUFFER_BPS)
            / BPS_DENOMINATOR;

        if (markPrice <= nearLiquidationThreshold) {
            if (position.status != PositionStatus.NearLiquidation) {
                position.status = PositionStatus.NearLiquidation;
                emit NearLiquidation(strategyId, markPrice, position.collateralValue, position.targetPrice);
            }
            return;
        }

        position.status = PositionStatus.Open;
    }

    /// @notice Reads the current stored state of a position.
    function getPosition(
        bytes32 strategyId
    )
        external
        view
        returns (
            uint256 entryPrice,
            uint256 markPrice,
            uint256 liquidationThreshold,
            uint256 collateralValue,
            uint256 targetPrice,
            PositionStatus status
        )
    {
        Position storage position = _positionOrRevert(strategyId);
        return (
            position.entryPrice,
            position.markPrice,
            position.liquidationThreshold,
            position.collateralValue,
            position.targetPrice,
            position.status
        );
    }

    function _positionOrRevert(bytes32 strategyId) internal view returns (Position storage position) {
        if (strategyId == bytes32(0)) revert PositionNotFound(strategyId);

        position = _positions[strategyId];
        if (position.entryPrice == 0) revert PositionNotFound(strategyId);
    }
}
