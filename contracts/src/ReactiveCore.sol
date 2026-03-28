// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @notice Minimal Reactive-compatible base types for local compilation.
interface IReactive {
    struct LogRecord {
        uint256 chain_id;
        address _contract;
        uint256 topic_0;
        uint256 topic_1;
        uint256 topic_2;
        uint256 topic_3;
        bytes data;
        uint256 block_number;
        uint256 op_code;
        uint256 block_hash;
        uint256 tx_hash;
        uint256 log_index;
    }

    function react(LogRecord calldata log) external;

    event Callback(
        uint256 indexed chain_id,
        address indexed _contract,
        uint64 indexed gas_limit,
        bytes payload
    );
}

interface ISubscriptionService {
    function subscribe(
        uint256 chain_id,
        address _contract,
        uint256 topic_0,
        uint256 topic_1,
        uint256 topic_2,
        uint256 topic_3
    ) external;
}

interface IPayableService {
    function debt(address _contract) external view returns (uint256);
}

interface ICallbackTarget {
    function onReactiveCallback(
        address rvmId,
        bytes32 strategyId,
        uint256 triggerPrice,
        uint256 collateralValue,
        uint256 targetPrice,
        uint8 action
    ) external;
}

abstract contract ReactiveBase is IReactive {
    uint256 internal constant REACTIVE_IGNORE =
        0xa65f96fc951c35ead38878e0f0b7a3c744a6f5ccc1476b313353ce31712313ad;
    address internal constant SERVICE_ADDR =
        0x0000000000000000000000000000000000fffFfF;

    ISubscriptionService internal constant service =
        ISubscriptionService(SERVICE_ADDR);
    IPayableService internal constant servicePayable =
        IPayableService(SERVICE_ADDR);

    mapping(address => bool) private _authorizedSenders;
    bool internal vm;

    constructor() {
        _authorizedSenders[SERVICE_ADDR] = true;
        _detectVm();
    }

    modifier serviceOnly() {
        require(msg.sender == SERVICE_ADDR, "Service only");
        _;
    }

    modifier vmOnly() {
        require(vm, "VM only");
        _;
    }

    modifier rnOnly() {
        require(!vm, "Reactive Network only");
        _;
    }

    modifier authorizedSenderOnly() {
        require(_authorizedSenders[msg.sender], "Authorized sender only");
        _;
    }

    /// @notice Hardhat local tests do not provide the Reactive system contract.
    function _serviceAvailable() internal view returns (bool) {
        return SERVICE_ADDR.code.length > 0;
    }

    receive() external payable {}

    function pay(uint256 amount) external authorizedSenderOnly {
        require(address(this).balance >= amount, "Insufficient funds");
        if (amount > 0) {
            (bool success, ) = payable(msg.sender).call{value: amount}("");
            require(success, "Transfer failed");
        }
    }

    function coverDebt() external {
        uint256 amount = servicePayable.debt(address(this));
        require(address(this).balance >= amount, "Insufficient funds");
        if (amount > 0) {
            (bool success, ) = payable(SERVICE_ADDR).call{value: amount}("");
            require(success, "Transfer failed");
        }
    }

    function _addAuthorizedSender(address sender) internal {
        _authorizedSenders[sender] = true;
    }

    function _detectVm() internal {
        uint256 size;
        assembly {
            size := extcodesize(0x0000000000000000000000000000000000fffFfF)
        }
        vm = size == 0;
    }
}
