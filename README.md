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
│ WETH => DAI w/o callback by EOA           │ 116,214 │ 128,157 │ +10.28% │ 131,704 │ +13.33% │
├───────────────────────────────────────────┼─────────┼─────────┼─────────┼─────────┼─────────┤
│ WETH => DAI w/o callback by contract      │ 116,586 │ 128,618 │ +10.32% │ 135,778 │ +16.46% │
├───────────────────────────────────────────┼─────────┼─────────┼─────────┼─────────┼─────────┤
│ WETH => DAI with callback, resolver funds │ 120,767 │ 132,878 │ +10.03% │ 140,917 │ +16.69% │
├───────────────────────────────────────────┼─────────┼─────────┼─────────┼─────────┼─────────┤
│ WETH => DAI with callback, taker funds    │ 137,624 │ 146,425 │ +6.39%  │ 154,575 │ +12.32% │
└───────────────────────────────────────────┴─────────┴─────────┴─────────┴─────────┴─────────┘
```

### Limit Orders
```
┌──────────────────────────────────────────────────────────────────────────────────┐
│ Limit Orders                                                                     │
├─────────────┬─────────┬───────────────────┬──────────────────┬───────────────────┤
│ case        │   1inch │      uniswap      │        0x        │     paraswap      │
├─────────────┼─────────┼─────────┬─────────┼──────────────────┴───────────────────┤
│ ETH => DAI  │  90,345 │ 113,519 │ +25.65% │                                      │
├─────────────┼─────────┼─────────┼─────────┼─────────┬────────┬─────────┬─────────┤
│ WETH => DAI │ 102,560 │ 113,377 │ +10.55% │ 111,045 │ +8.27% │ 153,693 │ +49.86% │
└─────────────┴─────────┴─────────┴─────────┴─────────┴────────┴─────────┴─────────┘
```

### Router
```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ UniswapV2 pools                                                                                                     │
├─────────────────────────────┬─────────┬──────────────────┬───────────────────┬──────────────────┬───────────────────┤
│ path                        │   1inch │        0x        │ uniswap_universal │    uniswap_v2    │     paraswap      │
├─────────────────────────────┼─────────┼─────────┬────────┼─────────┬─────────┼─────────┬────────┼─────────┬─────────┤
│ ETH => DAI                  │  88,124 │ 92,367  │ +4.81% │ 99,047  │ +12.40% │ 91,558  │ +3.90% │ 98,119  │ +11.34% │
├─────────────────────────────┼─────────┼─────────┼────────┼─────────┼─────────┼─────────┼────────┼─────────┼─────────┤
│ ETH => USDC => DAI          │ 140,942 │ 146,011 │ +3.60% │ 155,271 │ +10.17% │ 148,765 │ +5.55% │ 151,566 │ +7.54%  │
├─────────────────────────────┼─────────┼─────────┼────────┼─────────┼─────────┼─────────┼────────┼─────────┼─────────┤
│ DAI => ETH                  │ 100,153 │ 101,197 │ +1.04% │ 104,985 │ +4.82%  │ 103,127 │ +2.97% │ 101,185 │ +1.03%  │
├─────────────────────────────┼─────────┼─────────┼────────┼─────────┼─────────┼─────────┼────────┼─────────┼─────────┤
│ DAI => WETH                 │  84,087 │ 87,789  │ +4.40% │ 100,457 │ +19.47% │ 87,209  │ +3.71% │ 92,808  │ +10.37% │
├─────────────────────────────┼─────────┼─────────┼────────┼─────────┼─────────┼─────────┼────────┼─────────┼─────────┤
│ DAI => WETH => USDC         │ 136,874 │ 140,628 │ +2.74% │ 157,420 │ +15.01% │ 143,612 │ +4.92% │ 148,397 │ +8.42%  │
├─────────────────────────────┼─────────┼─────────┼────────┼─────────┼─────────┼─────────┼────────┼─────────┼─────────┤
│ DAI => WETH => USDC => USDT │ 190,978 │ 194,795 │ +2.00% │ 214,242 │ +12.18% │ 201,269 │ +5.39% │ 203,672 │ +6.65%  │
└─────────────────────────────┴─────────┴─────────┴────────┴─────────┴─────────┴─────────┴────────┴─────────┴─────────┘
```
```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ UniswapV3 pools                                                                                                    │
├─────────────────────────────┬─────────┬──────────────────┬───────────────────┬──────────────────┬──────────────────┤
│ path                        │   1inch │        0x        │ uniswap_universal │    uniswap_v3    │     paraswap     │
├─────────────────────────────┼─────────┼─────────┬────────┼─────────┬─────────┼─────────┬────────┼─────────┬────────┤
│ ETH => DAI                  │ 100,497 │ 109,126 │ +8.59% │ 107,166 │ +6.64%  │ 104,266 │ +3.75% │ 110,171 │ +9.63% │
├─────────────────────────────┼─────────┼─────────┼────────┼─────────┼─────────┼─────────┼────────┼─────────┼────────┤
│ ETH => USDC => DAI          │ 174,796 │ 185,111 │ +5.90% │ 182,888 │ +4.63%  │ 184,723 │ +5.68% │ 184,596 │ +5.61% │
├─────────────────────────────┼─────────┼─────────┼────────┼─────────┼─────────┼─────────┼────────┼─────────┼────────┤
│ DAI => ETH                  │ 117,147 │ 123,530 │ +5.45% │ 119,307 │ +1.84%  │ 125,169 │ +6.85% │ 118,769 │ +1.38% │
├─────────────────────────────┼─────────┼─────────┼────────┼─────────┼─────────┼─────────┼────────┼─────────┼────────┤
│ DAI => WETH                 │ 103,555 │ 109,813 │ +6.04% │ 114,779 │ +10.84% │ 105,311 │ +1.70% │ 110,359 │ +6.57% │
├─────────────────────────────┼─────────┼─────────┼────────┼─────────┼─────────┼─────────┼────────┼─────────┼────────┤
│ DAI => WETH => USDC         │ 174,198 │ 182,027 │ +4.49% │ 186,729 │ +7.19%  │ 182,012 │ +4.49% │ 183,154 │ +5.14% │
├─────────────────────────────┼─────────┼─────────┼────────┼─────────┼─────────┼─────────┼────────┼─────────┼────────┤
│ DAI => WETH => USDC => USDT │ 249,513 │ 258,754 │ +3.70% │ 263,167 │ +5.47%  │ 262,702 │ +5.29% │ 260,099 │ +4.24% │
└─────────────────────────────┴─────────┴─────────┴────────┴─────────┴─────────┴─────────┴────────┴─────────┴────────┘
```
### Mixed pools
```
┌───────────────────────────────────────────────────────────────────┐
│ Mixed pools                                                       │
├─────────────────────────────────────┬─────────┬───────────────────┤
│ path                                │   1inch │      uniswap      │
├─────────────────────────────────────┼─────────┼─────────┬─────────┤
│ ETH =(uniV2)=> DAI =(uniV3)=> USDC  │ 158,538 │ 175,822 │ +10.90% │
├─────────────────────────────────────┼─────────┼─────────┼─────────┤
│ ETH =(uniV3)=> DAI =(uniV2)=> USDC  │ 161,891 │ 178,050 │ +9.98%  │
├─────────────────────────────────────┼─────────┼─────────┼─────────┤
│ DAI =(uniV2)=> WETH =(uniV3)=> USDC │ 154,754 │ 175,949 │ +13.70% │
├─────────────────────────────────────┼─────────┼─────────┼─────────┤
│ DAI =(uniV3)=> WETH =(uniV2)=> USDC │ 151,513 │ 172,076 │ +13.57% │
└─────────────────────────────────────┴─────────┴─────────┴─────────┘
```

## Contribution

We warmly welcome the contribution of additional comparison cases. By sharing different scenarios and use cases, teams can identify specific areas for potential improvements in their protocols. If you have encountered a scenario where you believe there is room for optimization or enhancement, please consider contributing by:

1. Forking the repository.
2. Adding your case to the designated section/file with a clear description of the scenario and why it presents an opportunity for improvement.
3. Creating a pull request with a concise but informative title and description.

Your contributions will not only help improve the protocols but also provide valuable insights for the community on where there are opportunities for enhancement. 

Thank you for helping us and the community identify opportunities for improvement and optimization.
