// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @notice Minimal callback surface used by the Reactive callback path.
interface IProtectionExecutorCallback {
    function onReactiveCallback(
        address rvmId,
        bytes32 strategyId,
        uint256 triggerPrice,
        uint8 action
    ) external;

    function executeProtection(bytes32 strategyId, uint256 triggerPrice) external;
}

/// @notice One-way B-chain executor for the FlashShield P0 demo.
/// @dev The contract intentionally keeps recovery unimplemented so it can be added later.
contract ProtectionExecutor {
    uint256 public constant BPS_DENOMINATOR = 10_000;
    uint256 public constant PROTECTION_BPS = 8_000;
    uint8 public constant ACTION_PROTECT = 1;

    enum ProtectionStatus {
        Idle,
        Protected,
        RecoveryPending,
        Recovered
    }

    address public immutable authorizedCallbackProxy;
    address public immutable expectedRvmId;
    uint256 public immutable initialRiskTokenBalance;
    uint256 public immutable initialStableTokenBalance;
    mapping(address => bool) private _authorizedSenders;

    uint256 public riskTokenBalance;
    uint256 public stableTokenBalance;
    uint256 public protectedAmount;
    bytes32 public lastStrategyId;
    uint256 public lastTriggerPrice;
    uint8 public lastAction;
    ProtectionStatus public status;

    event CallbackValidated(address indexed callbackProxy, address indexed rvmId, bytes32 indexed strategyId);
    event ProtectionStateReset(bytes32 indexed previousStrategyId);
    event ProtectionExecuted(
        bytes32 indexed strategyId,
        uint256 triggerPrice,
        uint256 protectedAmount,
        uint256 remainingRiskBalance,
        uint256 stableBalance
    );

    error InvalidCallbackSource(address sender);
    error InvalidRvmId(address expected, address actual);
    error InvalidAction(uint8 action);
    error AlreadyProtected();
    error NoRiskBalance();

    constructor(
        address _authorizedCallbackProxy,
        address _expectedRvmId,
        uint256 _initialRiskBalance,
        uint256 _initialStableBalance
    ) payable {
        require(_authorizedCallbackProxy != address(0), "Proxy required");
        require(_expectedRvmId != address(0), "RVM required");

        authorizedCallbackProxy = _authorizedCallbackProxy;
        expectedRvmId = _expectedRvmId;
        initialRiskTokenBalance = _initialRiskBalance;
        initialStableTokenBalance = _initialStableBalance;
        riskTokenBalance = _initialRiskBalance;
        stableTokenBalance = _initialStableBalance;
        status = ProtectionStatus.Idle;
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
        _executeProtection(strategyId, triggerPrice, action);
    }

    /// @notice Direct one-way protection path reserved for the approved callback proxy.
    function executeProtection(bytes32 strategyId, uint256 triggerPrice) external {
        if (msg.sender != authorizedCallbackProxy) {
            revert InvalidCallbackSource(msg.sender);
        }

        _executeProtection(strategyId, triggerPrice, ACTION_PROTECT);
    }

    /// @notice Returns the current demo balances and status.
    function getProtectionState()
        external
        view
        returns (
            uint256 riskBalance,
            uint256 stableBalance,
            uint256 amountProtected,
            ProtectionStatus currentStatus,
            bytes32 strategyId,
            uint256 triggerPrice,
            uint8 action
        )
    {
        return (
            riskTokenBalance,
            stableTokenBalance,
            protectedAmount,
            status,
            lastStrategyId,
            lastTriggerPrice,
            lastAction
        );
    }

    function _executeProtection(bytes32 strategyId, uint256 triggerPrice, uint8 action) internal {
        if (status == ProtectionStatus.Protected) {
            if (lastStrategyId == strategyId) {
                revert AlreadyProtected();
            }

            emit ProtectionStateReset(lastStrategyId);
            _resetToInitialBalances();
        }
        if (riskTokenBalance == 0) {
            revert NoRiskBalance();
        }

        uint256 amountToProtect = (riskTokenBalance * PROTECTION_BPS) / BPS_DENOMINATOR;
        if (amountToProtect == 0) {
            revert NoRiskBalance();
        }

        protectedAmount = amountToProtect;
        riskTokenBalance -= amountToProtect;
        stableTokenBalance += amountToProtect;
        lastStrategyId = strategyId;
        lastTriggerPrice = triggerPrice;
        lastAction = action;
        status = ProtectionStatus.Protected;

        emit ProtectionExecuted(
            strategyId,
            triggerPrice,
            amountToProtect,
            riskTokenBalance,
            stableTokenBalance
        );
    }

    function _resetToInitialBalances() internal {
        riskTokenBalance = initialRiskTokenBalance;
        stableTokenBalance = initialStableTokenBalance;
        protectedAmount = 0;
        lastAction = 0;
        lastTriggerPrice = 0;
        status = ProtectionStatus.Idle;
    }
}

/// @notice Local mock proxy used to exercise the callback sender checks in tests.
contract ProtectionCallbackProxyMock {
    function forwardReactiveCallback(
        address target,
        address rvmId,
        bytes32 strategyId,
        uint256 triggerPrice,
        uint8 action
    ) external {
        IProtectionExecutorCallback(target).onReactiveCallback(rvmId, strategyId, triggerPrice, action);
    }

    function forwardExecuteProtection(
        address target,
        bytes32 strategyId,
        uint256 triggerPrice
    ) external {
        IProtectionExecutorCallback(target).executeProtection(strategyId, triggerPrice);
    }
}
