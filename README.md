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
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│ Fusion                                                                                      │
├───────────────────────────────────────────┬─────────┬───────────────────┬───────────────────┤
│ case                                      │   1inch │      uniswap      │      cowswap      │
├───────────────────────────────────────────┼─────────┼─────────┬─────────┼─────────┬─────────┤
│ WETH => DAI w/o callback by EOA           │ 116,226 │ 128,157 │ +10.27% │ 131,704 │ +13.32% │
├───────────────────────────────────────────┼─────────┼─────────┼─────────┼─────────┼─────────┤
│ WETH => DAI w/o callback by contract      │ 116,586 │ 128,618 │ +10.32% │ 135,778 │ +16.46% │
├───────────────────────────────────────────┼─────────┼─────────┼─────────┼─────────┼─────────┤
│ WETH => DAI with callback, resolver funds │ 120,779 │ 132,866 │ +10.01% │ 140,917 │ +16.67% │
├───────────────────────────────────────────┼─────────┼─────────┼─────────┼─────────┼─────────┤
│ WETH => DAI with callback, taker funds    │ 137,624 │ 146,425 │ +6.39%  │ 154,575 │ +12.32% │
└───────────────────────────────────────────┴─────────┴─────────┴─────────┴─────────┴─────────┘
```

### Limit Orders
```
┌───────────────────────────────────────────────────────────────────────────────────┐
│ Limit Orders                                                                      │
├─────────────┬─────────┬───────────────────┬───────────────────┬───────────────────┤
│ case        │   1inch │      uniswap      │        0x         │     paraswap      │
├─────────────┼─────────┼─────────┬─────────┼───────────────────┴───────────────────┤
│ ETH => DAI  │  90,345 │ 113,519 │ +25.65% │                                       │
├─────────────┼─────────┼─────────┼─────────┼─────────┬─────────┬─────────┬─────────┤
│ WETH => DAI │ 102,560 │ 111,033 │ +8.26%  │ 113,389 │ +10.56% │ 153,693 │ +49.86% │
└─────────────┴─────────┴─────────┴─────────┴─────────┴─────────┴─────────┴─────────┘
```

### Router
```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ UniswapV2 pools                                                                                                                         │
├─────────────────────────────┬─────────┬──────────────────┬───────────────────┬───────────────────┬──────────────────┬───────────────────┤
│ path                        │   1inch │        0x        │    0x settler     │ uniswap_universal │    uniswap_v2    │     paraswap      │
├─────────────────────────────┼─────────┼─────────┬────────┼─────────┬─────────┼─────────┬─────────┼─────────┬────────┼─────────┬─────────┤
│ ETH => DAI                  │  88,124 │ 92,367  │ +4.81% │ 93,032  │ +5.57%  │ 99,047  │ +12.40% │ 91,558  │ +3.90% │ 98,107  │ +11.33% │
├─────────────────────────────┼─────────┼─────────┼────────┼─────────┼─────────┼─────────┼─────────┼─────────┼────────┼─────────┼─────────┤
│ ETH => USDC => DAI          │ 140,942 │ 146,011 │ +3.60% │ 149,932 │ +6.38%  │ 155,271 │ +10.17% │ 148,765 │ +5.55% │ 151,554 │ +7.53%  │
├─────────────────────────────┼─────────┼─────────┼────────┼─────────┼─────────┼─────────┼─────────┼─────────┼────────┼─────────┼─────────┤
│ DAI => ETH                  │ 102,491 │ 105,997 │ +3.42% │ 113,862 │ +11.09% │ 109,785 │ +7.12%  │ 106,208 │ +3.63% │ 105,961 │ +3.39%  │
├─────────────────────────────┼─────────┼─────────┼────────┼─────────┼─────────┼─────────┼─────────┼─────────┼────────┼─────────┼─────────┤
│ DAI => WETH                 │  88,887 │ 92,589  │ +4.16% │ 94,966  │ +6.84%  │ 105,257 │ +18.42% │ 92,009  │ +3.51% │ 97,584  │ +9.78%  │
├─────────────────────────────┼─────────┼─────────┼────────┼─────────┼─────────┼─────────┼─────────┼─────────┼────────┼─────────┼─────────┤
│ DAI => WETH => USDC         │ 141,674 │ 145,428 │ +2.65% │ 150,312 │ +6.10%  │ 162,220 │ +14.50% │ 148,412 │ +4.76% │ 153,185 │ +8.12%  │
├─────────────────────────────┼─────────┼─────────┼────────┼─────────┼─────────┼─────────┼─────────┼─────────┼────────┼─────────┼─────────┤
│ DAI => WETH => USDC => USDT │ 195,778 │ 199,595 │ +1.95% │ 207,769 │ +6.12%  │ 219,042 │ +11.88% │ 206,069 │ +5.26% │ 208,460 │ +6.48%  │
└─────────────────────────────┴─────────┴─────────┴────────┴─────────┴─────────┴─────────┴─────────┴─────────┴────────┴─────────┴─────────┘
```
```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ UniswapV3 pools                                                                                                                        │
├─────────────────────────────┬─────────┬──────────────────┬───────────────────┬───────────────────┬──────────────────┬──────────────────┤
│ path                        │   1inch │        0x        │    0x settler     │ uniswap_universal │    uniswap_v3    │     paraswap     │
├─────────────────────────────┼─────────┼─────────┬────────┼─────────┬─────────┼─────────┬─────────┼─────────┬────────┼─────────┬────────┤
│ ETH => DAI                  │ 100,423 │ 109,052 │ +8.59% │ 107,778 │ +7.32%  │ 107,116 │ +6.66%  │ 104,204 │ +3.77% │ 110,109 │ +9.65% │
├─────────────────────────────┼─────────┼─────────┼────────┼─────────┼─────────┼─────────┼─────────┼─────────┼────────┼─────────┼────────┤
│ ETH => USDC => DAI          │ 174,718 │ 185,033 │ +5.90% │ 179,458 │ +2.71%  │ 182,834 │ +4.65%  │ 184,657 │ +5.69% │ 184,530 │ +5.62% │
├─────────────────────────────┼─────────┼─────────┼────────┼─────────┼─────────┼─────────┼─────────┼─────────┼────────┼─────────┼────────┤
│ DAI => ETH                  │ 117,402 │ 123,785 │ +5.44% │ 132,575 │ +12.92% │ 119,562 │ +1.84%  │ 125,424 │ +6.83% │ 119,024 │ +1.38% │
├─────────────────────────────┼─────────┼─────────┼────────┼─────────┼─────────┼─────────┼─────────┼─────────┼────────┼─────────┼────────┤
│ DAI => WETH                 │ 103,810 │ 110,068 │ +6.03% │ 122,499 │ +18.00% │ 115,034 │ +10.81% │ 105,566 │ +1.69% │ 110,614 │ +6.55% │
├─────────────────────────────┼─────────┼─────────┼────────┼─────────┼─────────┼─────────┼─────────┼─────────┼────────┼─────────┼────────┤
│ DAI => WETH => USDC         │ 174,341 │ 182,170 │ +4.49% │ 191,530 │ +9.86%  │ 186,872 │ +7.19%  │ 182,155 │ +4.48% │ 183,309 │ +5.14% │
├─────────────────────────────┼─────────┼─────────┼────────┼─────────┼─────────┼─────────┼─────────┼─────────┼────────┼─────────┼────────┤
│ DAI => WETH => USDC => USDT │ 248,560 │ 257,801 │ +3.72% │ 266,088 │ +7.05%  │ 262,214 │ +5.49%  │ 261,749 │ +5.31% │ 259,158 │ +4.26% │
└─────────────────────────────┴─────────┴─────────┴────────┴─────────┴─────────┴─────────┴─────────┴─────────┴────────┴─────────┴────────┘
```
```
┌───────────────────────────────────────────────────────────────────────────────────────┐
│ Mixed pools                                                                           │
├─────────────────────────────────────┬─────────┬───────────────────┬───────────────────┤
│ path                                │   1inch │    0x settler     │      uniswap      │
├─────────────────────────────────────┼─────────┼─────────┬─────────┼─────────┬─────────┤
│ ETH =(uniV2)=> DAI =(uniV3)=> USDC  │ 158,572 │ 166,693 │ +5.12%  │ 175,849 │ +10.90% │
├─────────────────────────────────────┼─────────┼─────────┼─────────┼─────────┼─────────┤
│ ETH =(uniV3)=> DAI =(uniV2)=> USDC  │ 153,171 │ 163,216 │ +6.56%  │ 169,331 │ +10.55% │
├─────────────────────────────────────┼─────────┼─────────┼─────────┼─────────┼─────────┤
│ DAI =(uniV2)=> WETH =(uniV3)=> USDC │ 159,442 │ 174,759 │ +9.61%  │ 180,637 │ +13.29% │
├─────────────────────────────────────┼─────────┼─────────┼─────────┼─────────┼─────────┤
│ DAI =(uniV3)=> WETH =(uniV2)=> USDC │ 156,582 │ 174,644 │ +11.54% │ 177,145 │ +13.13% │
└─────────────────────────────────────┴─────────┴─────────┴─────────┴─────────┴─────────┘
```

#### PERMIT2

```
┌──────────────────────────────────────────┐
│ UniswapV2 pools (Permit2)                │
├─────────────────────────────┬────────────┤
│ path                        │ 0x settler │
├─────────────────────────────┼────────────┤
│ DAI => ETH                  │    144,125 │
├─────────────────────────────┼────────────┤
│ DAI => WETH                 │    125,304 │
├─────────────────────────────┼────────────┤
│ DAI => WETH => USDC         │    180,594 │
├─────────────────────────────┼────────────┤
│ DAI => WETH => USDC => USDT │    237,948 │
└─────────────────────────────┴────────────┘
```
```
┌──────────────────────────────────────────┐
│ UniswapV3 pools (Permit2)                │
├─────────────────────────────┬────────────┤
│ path                        │ 0x settler │
├─────────────────────────────┼────────────┤
│ DAI => ETH                  │    158,140 │
├─────────────────────────────┼────────────┤
│ DAI => WETH                 │    148,102 │
├─────────────────────────────┼────────────┤
│ DAI => WETH => USDC         │    234,227 │
├─────────────────────────────┼────────────┤
│ DAI => WETH => USDC => USDT │    308,797 │
└─────────────────────────────┴────────────┘
```
```
┌──────────────────────────────────────────────────┐
│ Mixed pools (Permit2)                            │
├─────────────────────────────────────┬────────────┤
│ path                                │ 0x settler │
├─────────────────────────────────────┼────────────┤
│ DAI =(uniV2)=> WETH =(uniV3)=> USDC │    200,213 │
├─────────────────────────────────────┼────────────┤
│ DAI =(uniV3)=> WETH =(uniV2)=> USDC │    200,086 │
└─────────────────────────────────────┴────────────┘
```

## Contribution

We warmly welcome the contribution of additional comparison cases. By sharing different scenarios and use cases, teams can identify specific areas for potential improvements in their protocols. If you have encountered a scenario where you believe there is room for optimization or enhancement, please consider contributing by:

1. Forking the repository.
2. Adding your case to the designated section/file with a clear description of the scenario and why it presents an opportunity for improvement.
3. Creating a pull request with a concise but informative title and description.

Your contributions will not only help improve the protocols but also provide valuable insights for the community on where there are opportunities for enhancement.

Thank you for helping us and the community identify opportunities for improvement and optimization.
