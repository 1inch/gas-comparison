// SPDX-License-Identifier: Apache-2.0

pragma solidity ^0.8.0;

interface IAllowanceTransfer {
    function nonceBitmap(address, uint256) external view returns(uint256);
}
