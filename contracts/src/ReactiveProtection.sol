// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./ReactiveCore.sol";

/// @notice Subscribes to NearLiquidation on the origin chain and forwards a callback to the destination executor.
contract ReactiveProtection is ReactiveBase {
    uint8 public constant ACTION_PROTECT = 1;

    uint256 public immutable originChainId;
    uint256 public immutable destinationChainId;
    address public immutable originContract;
    address public immutable destinationExecutor;
    bytes32 public immutable nearLiquidationTopic;

    constructor(
        uint256 _originChainId,
        uint256 _destinationChainId,
        address _originContract,
        bytes32 _nearLiquidationTopic,
        address _destinationExecutor
    ) payable {
        originChainId = _originChainId;
        destinationChainId = _destinationChainId;
        originContract = _originContract;
        nearLiquidationTopic = _nearLiquidationTopic;
        destinationExecutor = _destinationExecutor;

        if (_serviceAvailable()) {
            service.subscribe(
                _originChainId,
                _originContract,
                uint256(_nearLiquidationTopic),
                REACTIVE_IGNORE,
                REACTIVE_IGNORE,
                REACTIVE_IGNORE
            );
        }
    }

    /// @notice Called by Reactive with the matching origin-chain event.
    function react(LogRecord calldata log) external vmOnly {
        require(log.chain_id == originChainId, "Invalid origin chain");
        require(log._contract == originContract, "Invalid origin contract");
        require(bytes32(log.topic_0) == nearLiquidationTopic, "Invalid topic");

        bytes32 strategyId = bytes32(log.topic_1);
        (uint256 triggerPrice, uint256 collateralValue, uint256 targetPrice) =
            abi.decode(log.data, (uint256, uint256, uint256));

        emit Callback(
            destinationChainId,
            destinationExecutor,
            500000,
            abi.encodeWithSelector(
                ICallbackTarget.onReactiveCallback.selector,
                address(0),
                strategyId,
                triggerPrice,
                collateralValue,
                targetPrice,
                ACTION_PROTECT
            )
        );
    }
}
