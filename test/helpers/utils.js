const { ethers } = require('hardhat');
const { trim0x } = require('@1inch/solidity-utils');

const ProtocolKey = {
    INCH: '1inch',
    UNISWAP: 'uniswap',
    COWSWAP: 'cowswap',
    MATCHA: '0x',
    PARASWAP: 'paraswap',
};

/**
 * @notice Calculates the percentage of a given number.
 * @param number The number to calculate the percentage of.
 * @param percentage The percentage to calculate.
 */
function percentageOf(number, percentage) {
    return (BigInt(number) * BigInt(percentage)) / 100n;
}

/**
 * Create pools data in `UniswapV2Data` struct for paraswap `swapExactAmountInOnUniswapV2` method.
 * @param pools Array of arrays [`srcTokenAddress`, `dstTokenaddress`] which means swap route in the uniV2 pool.
 */
function paraswapUniV2PoolData(pools) {
    let result = '0x';
    for (const pool of pools) {
        const [token0, token1, reverse] = pool[0] < pool[1] ? [pool[0], pool[1], true] : [pool[1], pool[0], false];
        result += trim0x(token0) + trim0x(token1) + trim0x(ethers.zeroPadValue(reverse ? '0x01' : '0x00', 24));
    }
    return result;
}

module.exports = {
    ProtocolKey,
    percentageOf,
    paraswapUniV2PoolData,
};
