// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

import { IERC20 } from "@openzeppelin/contracts/interfaces/IERC20.sol";

interface ISettler {
    struct AllowedSlippage {
        address recipient;
        IERC20 buyToken;
        uint256 minAmountOut;
    }

    function execute(
        AllowedSlippage calldata slippage,
        bytes[] calldata actions,
        bytes32 affiliate
    ) external payable returns (bool);
}
