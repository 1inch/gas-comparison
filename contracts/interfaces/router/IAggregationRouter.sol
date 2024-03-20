// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;

interface IAggregationRouter {
    function ethUnoswap(uint256 minReturn, uint256 dex) external payable returns(uint256 returnAmount);
    function ethUnoswap2(uint256 minReturn, uint256 dex, uint256 dex2) external payable returns(uint256 returnAmount);
    function unoswap(
        uint256 token,
        uint256 amount,
        uint256 minReturn,
        uint256 dex
    ) external returns(uint256 returnAmount);
    function unoswap2(
        uint256 token,
        uint256 amount,
        uint256 minReturn,
        uint256 dex,
        uint256 dex2
    ) external returns(uint256 returnAmount);
    function unoswap3(
        uint256 token,
        uint256 amount,
        uint256 minReturn,
        uint256 dex,
        uint256 dex2,
        uint256 dex3
    ) external returns(uint256 returnAmount);
}
