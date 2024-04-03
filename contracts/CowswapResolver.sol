// SPDX-License-Identifier: MIT

pragma solidity 0.8.23;

import { IERC20 } from "@openzeppelin/contracts/interfaces/IERC20.sol";
import { SafeERC20 } from "@1inch/solidity-utils/contracts/libraries/SafeERC20.sol";
import { RevertReasonForwarder } from "@1inch/solidity-utils/contracts/libraries/RevertReasonForwarder.sol";

contract CowswapResolver {
    using SafeERC20 for IERC20;

    error OnlyCowswapSettlement();

    address private immutable _COWSWAP_SETTLEMENT;

    constructor(address cowswapSettlement) {
        _COWSWAP_SETTLEMENT = cowswapSettlement;
    }

    function settleCowswapOrders(uint256 value, bytes calldata params) external payable {
        // solhint-disable-next-line avoid-low-level-calls
        (bool success,) = _COWSWAP_SETTLEMENT.call{value: value}(params);
        if (!success) RevertReasonForwarder.reRevert();
    }

    function cowswapResolve(bytes calldata blob) external {
        if (msg.sender != _COWSWAP_SETTLEMENT) revert OnlyCowswapSettlement();
        bytes[] calldata arguments;
        assembly { // solhint-disable-line no-inline-assembly
            let argumentsLengthPtr := add(blob.offset, calldataload(blob.offset))
            arguments.offset := add(argumentsLengthPtr, 0x20)
            arguments.length := calldataload(argumentsLengthPtr)
        }
        for (uint256 i = 0; i < arguments.length; ++i) {
            address target = address(bytes20(arguments[i]));
            // solhint-disable-next-line avoid-low-level-calls
            (bool success,) = target.call(arguments[i][20:]);
            if (!success) RevertReasonForwarder.reRevert();
        }
    }
}
