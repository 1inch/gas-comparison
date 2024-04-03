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

    function settleUniswapXOrders(uint256 value, bytes calldata params) external payable {
        // solhint-disable-next-line avoid-low-level-calls
        (bool success,) = _REACTOR.call{value: value}(params);
        if (!success) RevertReasonForwarder.reRevert();
    }

    function reactorCallback(ResolvedOrder[] calldata resolvedOrders, bytes calldata callbackData) public virtual {
        if (msg.sender != _REACTOR) revert OnlyReactor();

        uint8 approvalMask = uint8(callbackData[0]);

        bytes[] calldata blobs;
        assembly ("memory-safe") { // solhint-disable-line no-inline-assembly
            // 1 extra byte was used for approvals mask
            blobs.offset := add(callbackData.offset, 0x21)
            blobs.length := calldataload(add(callbackData.offset, 1))
        }
        if (resolvedOrders.length != blobs.length) revert LengthMismatch();

        for (uint256 i = 0; i < resolvedOrders.length; i++) {
            if ((approvalMask >> i) & 1 == 1) {
                IERC20(resolvedOrders[i].outputs[0].token).forceApprove(_REACTOR, type(uint256).max);
            }
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
