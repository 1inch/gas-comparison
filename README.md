<div align="center">
    <img src="https://github.com/1inch/gas-comparison/blob/master/.github/1inch_github_w.svg#gh-light-mode-only">
    <img src="https://github.com/1inch/gas-comparison/blob/master/.github/1inch_github_b.svg#gh-dark-mode-only">
</div>

# Gas Comparison

[![Build Status](https://github.com/1inch/gas-comparison/workflows/CI/badge.svg)](https://github.com/1inch/gas-comparison/actions)
[![Coverage Status](https://codecov.io/gh/1inch/gas-comparison/graph/badge.svg?token=8VSYYAY3J1)](https://codecov.io/gh/1inch/gas-comparison)

This repository contains detailed gas comparison analysis of our latest products against our competitors. It aims to provide insights into the efficiency and performance differences, highlighting our technological advantages and areas for improvement.

## Getting Started
To run the tests and check the results, please follow the steps below:

### 1. Setting Up Environment Variables
First, you need to set up the necessary environment variables. Create a `.env` file in the root directory of the repository and specify the following variables:

```
# .env file
MAINNET_RPC_URL=your_mainnet_rpc_url_here
```

Replace `your_mainnet_rpc_url_here` with your actual Mainnet RPC URL.

### 2. Running Tests
After setting up your environment variables, you can run the tests using Yarn. Execute the following commands in your terminal:

```
# Install dependencies
yarn

# Run tests
yarn test:ci
```

These commands will first install the necessary dependencies and then execute the tests defined in your project. Ensure you have Yarn installed on your system. If not, you can install it by following the instructions on the [Yarn documentation](https://classic.yarnpkg.com/en/docs/install).

## Current Comparison Results

This section presents detailed gas usage data for various swapping scenarios across different protocols. The tables below compare the amount of gas used for each type of transaction to highlight efficiency across platforms. Each entry denotes the gas used for a swap under the same conditions.

### Fusion
```
┌─────────────────────────────────────────────────────────────────────────┐
│ Fusion                                                                  │
├───────────────────────────────────────────┬─────────┬─────────┬─────────┤
│ case                                      │   1inch │ uniswap │ cowswap │
├───────────────────────────────────────────┼─────────┼─────────┼─────────┤
│ WETH => DAI w/o callback by EOA           │ 116,226 │ 128,157 │ 131,704 │
├───────────────────────────────────────────┼─────────┼─────────┼─────────┤
│ WETH => DAI w/o callback by contract      │ 116,562 │ 128,594 │ 135,766 │
├───────────────────────────────────────────┼─────────┼─────────┼─────────┤
│ WETH => DAI with callback, resolver funds │ 120,779 │ 132,890 │ 140,905 │
├───────────────────────────────────────────┼─────────┼─────────┼─────────┤
│ WETH => DAI with callback, taker funds    │ 137,588 │ 146,413 │ 154,551 │
└───────────────────────────────────────────┴─────────┴─────────┴─────────┘
```

### Limit Orders
```
┌──────────────────────────────────────────────────────┐
│ Limit Orders                                         │
├─────────────┬─────────┬─────────┬─────────┬──────────┤
│ case        │   1inch │ uniswap │      0x │ paraswap │
├─────────────┼─────────┼─────────┼─────────┴──────────┤
│ ETH => DAI  │  90,345 │ 113,519 │                    │
├─────────────┼─────────┼─────────┼─────────┬──────────┤
│ WETH => DAI │ 102,560 │ 113,389 │ 111,045 │  153,674 │
└─────────────┴─────────┴─────────┴─────────┴──────────┘
```

### Router
```
┌──────────────────────────────────────────────────────────────────────┐
│ UniswapV2 pools                                                      │
├─────────────────────────────┬─────────┬─────────┬─────────┬──────────┤
│ path                        │   1inch │      0x │ uniswap │ paraswap │
├─────────────────────────────┼─────────┼─────────┼─────────┼──────────┤
│ ETH => DAI                  │  88,124 │  92,367 │  99,244 │   98,119 │
├─────────────────────────────┼─────────┼─────────┼─────────┼──────────┤
│ ETH => USDC => DAI          │ 140,942 │ 146,011 │ 162,291 │  151,566 │
├─────────────────────────────┼─────────┼─────────┼─────────┼──────────┤
│ DAI => ETH                  │ 100,153 │ 101,197 │ 100,703 │  101,185 │
├─────────────────────────────┼─────────┼─────────┼─────────┼──────────┤
│ DAI => WETH                 │  84,087 │  87,789 │ 100,703 │   92,808 │
├─────────────────────────────┼─────────┼─────────┼─────────┼──────────┤
│ DAI => WETH => USDC         │ 136,874 │ 140,628 │ 157,666 │  148,397 │
├─────────────────────────────┼─────────┼─────────┼─────────┼──────────┤
│ DAI => WETH => USDC => USDT │ 190,978 │ 194,795 │ 214,488 │  203,672 │
└─────────────────────────────┴─────────┴─────────┴─────────┴──────────┘
```
```
┌──────────────────────────────────────────────────────────────────────┐
│ UniswapV3 pools                                                      │
├─────────────────────────────┬─────────┬─────────┬─────────┬──────────┤
│ path                        │   1inch │      0x │ uniswap │ paraswap │
├─────────────────────────────┼─────────┼─────────┼─────────┼──────────┤
│ ETH => DAI                  │ 100,523 │ 109,152 │ 104,304 │  110,221 │
├─────────────────────────────┼─────────┼─────────┼─────────┼──────────┤
│ ETH => USDC => DAI          │ 174,784 │ 185,099 │ 184,723 │  184,608 │
├─────────────────────────────┼─────────┼─────────┼─────────┼──────────┤
│ DAI => ETH                  │ 112,399 │ 118,782 │ 120,421 │  114,033 │
├─────────────────────────────┼─────────┼─────────┼─────────┼──────────┤
│ DAI => WETH                 │  98,807 │ 105,065 │ 100,563 │  105,623 │
├─────────────────────────────┼─────────┼─────────┼─────────┼──────────┤
│ DAI => WETH => USDC         │ 169,418 │ 177,247 │ 177,232 │  178,398 │
├─────────────────────────────┼─────────┼─────────┼─────────┼──────────┤
│ DAI => WETH => USDC => USDT │ 244,539 │ 253,780 │ 257,728 │  255,149 │
└─────────────────────────────┴─────────┴─────────┴─────────┴──────────┘
```
# Mixed pools
```
┌────────────────────────────────────────────────────────┐
│ UniswapV2 => UniswapV3 pools                           │
├────────────────────────────────────┬─────────┬─────────┤
│ path                               │   1inch │ uniswap │
├────────────────────────────────────┼─────────┼─────────┤
│ ETH =[uniV2]=> DAI =[uniV3]=> USDC │ 160,935 │ 177,244 │
└────────────────────────────────────┴─────────┴─────────┘
```

## Contribution

We warmly welcome the contribution of additional comparison cases. By sharing different scenarios and use cases, teams can identify specific areas for potential improvements in their protocols. If you have encountered a scenario where you believe there is room for optimization or enhancement, please consider contributing by:

1. Forking the repository.
2. Adding your case to the designated section/file with a clear description of the scenario and why it presents an opportunity for improvement.
3. Creating a pull request with a concise but informative title and description.

Your contributions will not only help improve the protocols but also provide valuable insights for the community on where there are opportunities for enhancement. 

Thank you for helping us and the community identify opportunities for improvement and optimization.
