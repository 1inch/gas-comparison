// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;

interface IParaswapRouter {
    function swapOnUniswapV2Fork(address tokenIn, uint256 amountIn, uint256 amountOutMin, address weth, uint256[] memory pools) external;
}
