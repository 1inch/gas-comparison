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
┌───────────────────────────────────────────┬──────────┬──────────┬──────────┐
│ (index)                                   │ 1inch    │ uniswap  │ cowswap  │
├───────────────────────────────────────────┼──────────┼──────────┼──────────┤
│ WETH => DAI w/o callback by EOA           │ '116214' │ '128157' │ '131704' │
│ WETH => DAI w/o callback by contract      │ '116574' │ '128618' │ '135778' │
│ WETH => DAI with callback, resolver funds │ '120767' │ '132890' │ '140917' │
│ WETH => DAI with callback, taker funds    │ '137624' │ '146413' │ '154587' │
└───────────────────────────────────────────┴──────────┴──────────┴──────────┘
```

### Limit Orders
```
┌─────────────┬──────────┬──────────┬──────────┬──────────┐
│ (index)     │ 1inch    │ uniswap  │ 0x       │ paraswap │
├─────────────┼──────────┼──────────┼──────────┼──────────┤
│ ETH => DAI  │ '90345'  │ '96419'  │          │          │
│ WETH => DAI │ '102560' │ '111045' │ '113389' │ '153684' │
└─────────────┴──────────┴──────────┴──────────┴──────────┘
```

### Router
```
┌─────────────────────────────┬──────────┬──────────┬──────────┬──────────┐
│ (index)                     │ 1inch    │ 0x       │ paraswap │ uniswap  │
├─────────────────────────────┼──────────┼──────────┼──────────┼──────────┤
│ ETH => DAI                  │ '97906'  │ '102783' │ '104424' │ '101962' │
│ ETH => USDC => DAI          │ '161762' │ '166843' │          │ '169585' │
│ DAI => ETH                  │ '108476' │ '111613' │ '121814' │ '111800' │
│ DAI => WETH                 │ '94491'  │ '98205'  │ '107649' │ '97601'  │
│ DAI => WETH => USDC         │ '157694' │ '161460' │          │ '164420' │
│ DAI => WETH => USDC => USDT │ '222214' │ '226043' │          │ '232493' │
└─────────────────────────────┴──────────┴──────────┴──────────┴──────────┘
```

## Contribution

We warmly welcome the contribution of additional comparison cases. By sharing different scenarios and use cases, teams can identify specific areas for potential improvements in their protocols. If you have encountered a scenario where you believe there is room for optimization or enhancement, please consider contributing by:

1. Forking the repository.
2. Adding your case to the designated section/file with a clear description of the scenario and why it presents an opportunity for improvement.
3. Creating a pull request with a concise but informative title and description.

Your contributions will not only help improve the protocols but also provide valuable insights for the community on where there are opportunities for enhancement. 

Thank you for helping us and the community identify opportunities for improvement and optimization.
