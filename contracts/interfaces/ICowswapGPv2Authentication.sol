// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;  // solhint-disable-line compiler-version

interface ICowswapGPv2Authentication {
    function manager() external view returns (address);
    function addSolver(address) external;
    function removeSolver(address) external;
    function isSolver(address) external view returns (bool);
}
