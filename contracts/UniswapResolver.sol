// SPDX-License-Identifier: MIT

pragma solidity 0.8.23;

import { IERC20 } from "@openzeppelin/contracts/interfaces/IERC20.sol";
import { SafeERC20 } from "@1inch/solidity-utils/contracts/libraries/SafeERC20.sol";
import { RevertReasonForwarder } from "@1inch/solidity-utils/contracts/libraries/RevertReasonForwarder.sol";
import { IReactorCallback } from "./interfaces/limit-orders/IReactorCallback.sol";
import { ResolvedOrder } from "./interfaces/limit-orders/ReactorStructs.sol";

contract UniswapResolver is IReactorCallback {
    using SafeERC20 for IERC20;

    error OnlyReactor();
    error LengthMismatch();

    address private immutable _REACTOR;

    constructor(address reactor) {
        _REACTOR = reactor;
    }

    function settleUniswapXOrders(uint256 value, bytes calldata params) public payable virtual {
        // solhint-disable-next-line avoid-low-level-calls
        (bool success,) = _REACTOR.call{value: value}(params);
        if (!success) RevertReasonForwarder.reRevert();
    }

    function reactorCallback(ResolvedOrder[] calldata resolvedOrders, bytes calldata callbackData) public virtual {
        if (msg.sender != _REACTOR) revert OnlyReactor();

        bytes[] calldata blobs;
        assembly ("memory-safe") { // solhint-disable-line no-inline-assembly
            blobs.offset := add(callbackData.offset, 0x20)
            blobs.length := calldataload(callbackData.offset)
        }
        if (resolvedOrders.length != blobs.length) revert LengthMismatch();

        for (uint256 i = 0; i < resolvedOrders.length; i++) {
            bytes calldata blob = blobs[i];
            bytes[] calldata arguments;
            assembly { // solhint-disable-line no-inline-assembly
                let argumentsLengthPtr := add(blob.offset, calldataload(blob.offset))
                arguments.offset := add(argumentsLengthPtr, 0x20)
                arguments.length := calldataload(argumentsLengthPtr)
            }
            for (uint256 j = 0; j < arguments.length; ++j) {
                address target = address(bytes20(arguments[j]));
                // solhint-disable-next-line avoid-low-level-calls
                (bool success,) = target.call(arguments[j][20:]);
                if (!success) RevertReasonForwarder.reRevert();
            }
        }
    }
}
