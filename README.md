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
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│ UniswapV2 pools                                                                                 │
├─────────────────────────────┬─────────┬──────────────────┬──────────────────┬───────────────────┤
│ path                        │   1inch │        0x        │     uniswap      │     paraswap      │
├─────────────────────────────┼─────────┼─────────┬────────┼─────────┬────────┼─────────┬─────────┤
│ ETH => DAI                  │  88,124 │ 92,367  │ +4.81% │ 91,558  │ +3.90% │ 98,097  │ +11.32% │
├─────────────────────────────┼─────────┼─────────┼────────┼─────────┼────────┼─────────┼─────────┤
│ ETH => USDC => DAI          │ 140,942 │ 146,011 │ +3.60% │ 148,765 │ +5.55% │ 151,544 │ +7.52%  │
├─────────────────────────────┼─────────┼─────────┼────────┼─────────┼────────┼─────────┼─────────┤
│ DAI => ETH                  │ 100,153 │ 101,197 │ +1.04% │ 103,127 │ +2.97% │ 101,163 │ +1.01%  │
├─────────────────────────────┼─────────┼─────────┼────────┼─────────┼────────┼─────────┼─────────┤
│ DAI => WETH                 │  84,087 │ 87,789  │ +4.40% │ 87,209  │ +3.71% │ 92,786  │ +10.35% │
├─────────────────────────────┼─────────┼─────────┼────────┼─────────┼────────┼─────────┼─────────┤
│ DAI => WETH => USDC         │ 136,874 │ 140,628 │ +2.74% │ 143,612 │ +4.92% │ 148,375 │ +8.40%  │
├─────────────────────────────┼─────────┼─────────┼────────┼─────────┼────────┼─────────┼─────────┤
│ DAI => WETH => USDC => USDT │ 190,978 │ 194,795 │ +2.00% │ 201,269 │ +5.39% │ 203,650 │ +6.64%  │
└─────────────────────────────┴─────────┴─────────┴────────┴─────────┴────────┴─────────┴─────────┘
```
```
┌────────────────────────────────────────────────────────────────────────────────────────────────┐
│ UniswapV3 pools                                                                                │
├─────────────────────────────┬─────────┬──────────────────┬──────────────────┬──────────────────┤
│ path                        │   1inch │        0x        │     uniswap      │     paraswap     │
├─────────────────────────────┼─────────┼─────────┬────────┼─────────┬────────┼─────────┬────────┤
│ ETH => DAI                  │ 109,143 │ 117,772 │ +7.91% │ 112,924 │ +3.46% │ 118,796 │ +8.84% │
├─────────────────────────────┼─────────┼─────────┼────────┼─────────┼────────┼─────────┼────────┤
│ ETH => USDC => DAI          │ 174,760 │ 185,075 │ +5.90% │ 184,699 │ +5.69% │ 184,518 │ +5.58% │
├─────────────────────────────┼─────────┼─────────┼────────┼─────────┼────────┼─────────┼────────┤
│ DAI => ETH                  │ 112,333 │ 118,716 │ +5.68% │ 120,355 │ +7.14% │ 113,935 │ +1.43% │
├─────────────────────────────┼─────────┼─────────┼────────┼─────────┼────────┼─────────┼────────┤
│ DAI => WETH                 │  98,741 │ 104,999 │ +6.34% │ 100,497 │ +1.78% │ 105,525 │ +6.87% │
├─────────────────────────────┼─────────┼─────────┼────────┼─────────┼────────┼─────────┼────────┤
│ DAI => WETH => USDC         │ 169,348 │ 177,177 │ +4.62% │ 177,162 │ +4.61% │ 178,262 │ +5.26% │
├─────────────────────────────┼─────────┼─────────┼────────┼─────────┼────────┼─────────┼────────┤
│ DAI => WETH => USDC => USDT │ 244,663 │ 253,904 │ +3.78% │ 257,852 │ +5.39% │ 255,185 │ +4.30% │
└─────────────────────────────┴─────────┴─────────┴────────┴─────────┴────────┴─────────┴────────┘
```
### Mixed pools
```
┌───────────────────────────────────────────────────────────────────┐
│ Mixed pools                                                       │
├─────────────────────────────────────┬─────────┬───────────────────┤
│ path                                │   1inch │      uniswap      │
├─────────────────────────────────────┼─────────┼─────────┬─────────┤
│ ETH =(uniV2)=> DAI =(uniV3)=> USDC  │ 158,538 │ 177,220 │ +11.78% │
├─────────────────────────────────────┼─────────┼─────────┼─────────┤
│ ETH =(uniV3)=> DAI =(uniV2)=> USDC  │ 161,907 │ 187,006 │ +15.50% │
├─────────────────────────────────────┼─────────┼─────────┼─────────┤
│ DAI =(uniV2)=> WETH =(uniV3)=> USDC │ 164,140 │ 184,939 │ +12.67% │
├─────────────────────────────────────┼─────────┼─────────┼─────────┤
│ DAI =(uniV3)=> WETH =(uniV2)=> USDC │ 161,945 │ 189,024 │ +16.72% │
└─────────────────────────────────────┴─────────┴─────────┴─────────┘
```

## Contribution

We warmly welcome the contribution of additional comparison cases. By sharing different scenarios and use cases, teams can identify specific areas for potential improvements in their protocols. If you have encountered a scenario where you believe there is room for optimization or enhancement, please consider contributing by:

1. Forking the repository.
2. Adding your case to the designated section/file with a clear description of the scenario and why it presents an opportunity for improvement.
3. Creating a pull request with a concise but informative title and description.

Your contributions will not only help improve the protocols but also provide valuable insights for the community on where there are opportunities for enhancement. 

Thank you for helping us and the community identify opportunities for improvement and optimization.
