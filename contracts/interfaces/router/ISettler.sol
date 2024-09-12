// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

import { IERC20 } from "@openzeppelin/contracts/interfaces/IERC20.sol";
import { ISignatureTransfer } from "../ISignatureTransfer.sol";

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

    function _hasMetaTxn() external pure returns (bool);

    function _msgSender() external view returns (address);

    function _isRestrictedTarget(address target) external pure returns (bool);

    function _dispatchVIP(bytes4 action, bytes calldata data) external returns (bool);
}
