// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @notice Minimal callback surface used by the Reactive callback path.
interface IProtectionExecutorCallback {
    function onReactiveCallback(
        address rvmId,
        bytes32 strategyId,
        uint256 triggerPrice,
        uint256 collateralValue,
        uint256 targetPrice,
        uint8 action
    ) external;

    function executeProtection(
        bytes32 strategyId,
        uint256 triggerPrice,
        uint256 collateralValue,
        uint256 targetPrice
    ) external;
}

/// @notice B-chain hedging executor for the FlashShield P0+ demo.
/// @dev It stores a mock short position instead of performing a real perps trade.
contract ProtectionExecutor {
    uint8 public constant ACTION_PROTECT = 1;

    enum HedgeDirection {
        None,
        Short
    }

    enum HedgeStatus {
        Idle,
        ShortOpened,
        RecoveryPending,
        Recovered
    }

    address public immutable authorizedCallbackProxy;
    address public immutable expectedRvmId;
    uint256 public immutable contractMultiplier;
    mapping(address => bool) private _authorizedSenders;

    uint256 public lastHedgeSize;
    uint256 public lastCollateralValue;
    uint256 public lastTriggerPrice;
    uint256 public lastTargetPrice;
    uint8 public lastAction;
    bytes32 public lastStrategyId;
    HedgeDirection public lastDirection;
    HedgeStatus public status;

    event CallbackValidated(address indexed callbackProxy, address indexed rvmId, bytes32 indexed strategyId);
    event HedgeStateReset(bytes32 indexed previousStrategyId);
    event ShortPositionOpened(
        bytes32 indexed strategyId,
        uint256 triggerPrice,
        uint256 targetPrice,
        uint256 collateralValue,
        uint256 contractMultiplier,
        uint256 hedgeSize
    );

    error InvalidCallbackSource(address sender);
    error InvalidRvmId(address expected, address actual);
    error InvalidAction(uint8 action);
    error AlreadyHedged();
    error InvalidCollateralValue();
    error InvalidTargetPrice();
    error InvalidHedgeFormula();

    constructor(address _authorizedCallbackProxy, address _expectedRvmId, uint256 _contractMultiplier) payable {
        require(_authorizedCallbackProxy != address(0), "Proxy required");
        require(_expectedRvmId != address(0), "RVM required");
        require(_contractMultiplier != 0, "Multiplier required");

        authorizedCallbackProxy = _authorizedCallbackProxy;
        expectedRvmId = _expectedRvmId;
        contractMultiplier = _contractMultiplier;
        status = HedgeStatus.Idle;
        lastDirection = HedgeDirection.None;
        _authorizedSenders[_authorizedCallbackProxy] = true;
    }

    receive() external payable {}

    function pay(uint256 amount) external {
        if (!_authorizedSenders[msg.sender]) {
            revert InvalidCallbackSource(msg.sender);
        }
        require(address(this).balance >= amount, "Insufficient funds");
        if (amount > 0) {
            (bool success, ) = payable(msg.sender).call{value: amount}("");
            require(success, "Transfer failed");
        }
    }

    /// @notice Reactive callback entrypoint.
    function onReactiveCallback(
        address rvmId,
        bytes32 strategyId,
        uint256 triggerPrice,
        uint256 collateralValue,
        uint256 targetPrice,
        uint8 action
    ) external {
        if (msg.sender != authorizedCallbackProxy) {
            revert InvalidCallbackSource(msg.sender);
        }
        if (rvmId != expectedRvmId) {
            revert InvalidRvmId(expectedRvmId, rvmId);
        }
        if (action != ACTION_PROTECT) {
            revert InvalidAction(action);
        }

        emit CallbackValidated(msg.sender, rvmId, strategyId);
        _executeProtection(strategyId, triggerPrice, collateralValue, targetPrice, action);
    }

    /// @notice Direct one-way protection path reserved for the approved callback proxy.
    function executeProtection(
        bytes32 strategyId,
        uint256 triggerPrice,
        uint256 collateralValue,
        uint256 targetPrice
    ) external {
        if (msg.sender != authorizedCallbackProxy) {
            revert InvalidCallbackSource(msg.sender);
        }

        _executeProtection(strategyId, triggerPrice, collateralValue, targetPrice, ACTION_PROTECT);
    }

    /// @notice Returns the current mock short state.
    function getProtectionState()
        external
        view
        returns (
            uint256 hedgeSize,
            uint256 collateralValue,
            uint256 triggerPrice,
            uint256 targetPrice,
            uint256 multiplier,
            HedgeStatus currentStatus,
            bytes32 strategyId,
            HedgeDirection direction,
            uint8 action
        )
    {
        return (
            lastHedgeSize,
            lastCollateralValue,
            lastTriggerPrice,
            lastTargetPrice,
            contractMultiplier,
            status,
            lastStrategyId,
            lastDirection,
            lastAction
        );
    }

    function _executeProtection(
        bytes32 strategyId,
        uint256 triggerPrice,
        uint256 collateralValue,
        uint256 targetPrice,
        uint8 action
    ) internal {
        if (status == HedgeStatus.ShortOpened) {
            if (lastStrategyId == strategyId) {
                revert AlreadyHedged();
            }

            emit HedgeStateReset(lastStrategyId);
            _resetState();
        }
        if (collateralValue == 0) {
            revert InvalidCollateralValue();
        }
        if (targetPrice == 0 || targetPrice >= triggerPrice) {
            revert InvalidTargetPrice();
        }

        uint256 priceGap = triggerPrice - targetPrice;
        uint256 hedgeSize = (collateralValue * priceGap) / contractMultiplier;
        if (hedgeSize == 0) {
            revert InvalidHedgeFormula();
        }

        lastStrategyId = strategyId;
        lastTriggerPrice = triggerPrice;
        lastCollateralValue = collateralValue;
        lastTargetPrice = targetPrice;
        lastHedgeSize = hedgeSize;
        lastDirection = HedgeDirection.Short;
        lastAction = action;
        status = HedgeStatus.ShortOpened;

        emit ShortPositionOpened(
            strategyId,
            triggerPrice,
            targetPrice,
            collateralValue,
            contractMultiplier,
            hedgeSize
        );
    }

    function _resetState() internal {
        lastHedgeSize = 0;
        lastCollateralValue = 0;
        lastTriggerPrice = 0;
        lastTargetPrice = 0;
        lastAction = 0;
        lastStrategyId = bytes32(0);
        lastDirection = HedgeDirection.None;
        status = HedgeStatus.Idle;
    }
}

/// @notice Local mock proxy used to exercise the callback sender checks in tests.
contract ProtectionCallbackProxyMock {
    function forwardReactiveCallback(
        address target,
        address rvmId,
        bytes32 strategyId,
        uint256 triggerPrice,
        uint256 collateralValue,
        uint256 targetPrice,
        uint8 action
    ) external {
        IProtectionExecutorCallback(target).onReactiveCallback(
            rvmId,
            strategyId,
            triggerPrice,
            collateralValue,
            targetPrice,
            action
        );
    }

    function forwardExecuteProtection(
        address target,
        bytes32 strategyId,
        uint256 triggerPrice,
        uint256 collateralValue,
        uint256 targetPrice
    ) external {
        IProtectionExecutorCallback(target).executeProtection(strategyId, triggerPrice, collateralValue, targetPrice);
    }
}
