// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;

interface IAggregationRouter {
    function ethUnoswapTo(uint256 to, uint256 minReturn, uint256 dex) external payable returns(uint256 returnAmount);
    function ethUnoswapTo2(
        uint256 to,
        uint256 minReturn,
        uint256 dex,
        uint256 dex2
    ) external payable returns(uint256 returnAmount);
    function unoswapTo(
        uint256 to,
        uint256 token,
        uint256 amount,
        uint256 minReturn,
        uint256 dex
    ) external returns(uint256 returnAmount);
    function unoswapTo2(
        uint256 to,
        uint256 token,
        uint256 amount,
        uint256 minReturn,
        uint256 dex,
        uint256 dex2
    ) external returns(uint256 returnAmount);
    function unoswapTo3(
        uint256 to,
        uint256 token,
        uint256 amount,
        uint256 minReturn,
        uint256 dex,
        uint256 dex2,
        uint256 dex3
    ) external returns(uint256 returnAmount);
}
