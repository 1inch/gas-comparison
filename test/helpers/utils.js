const { ethers } = require('hardhat');
const { trim0x, ether } = require('@1inch/solidity-utils');
const { PERMIT2_ADDRESS, SignatureTransfer } = require('@uniswap/permit2-sdk');

const ProtocolKey = {
    INCH: '1inch',
    UNISWAP: 'uniswap',
    UNISWAP_V2: 'uniswap_v2',
    UNISWAP_V3: 'uniswap_v3',
    UNISWAP_UNIVERSAL: 'uniswap_universal',
    COWSWAP: 'cowswap',
    MATCHA: '0x',
    PARASWAP: 'paraswap',
    MATCHA2: '0x settler',
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

// @dev Encodes a path and fee amounts into a single string for uniswap v3 RoutePlanner
// @param path - an array of token addresses
// @param fees - an array of fee amounts associated with each pool
// @returns the encoded path string
// source: https://github.com/Uniswap/universal-router/blob/228f2d151a5fc99836d72ae00f81db92cdb44bd3/test/integration-tests/shared/swapRouter02Helpers.ts#L47
function uniswapV3EncodePath(path, fees) {
    if (path.length !== fees.length + 1) {
        throw new Error('path/fee lengths do not match');
    }

    let encoded = '0x';
    for (let i = 0; i < fees.length; i++) {
        // 20 byte encoding of the address
        encoded += path[i].slice(2);
        // 3 byte encoding of the fee
        encoded += fees[i].toString(16).padStart(2 * 3, '0');
    }
    // encode the final token
    encoded += path[path.length - 1].slice(2);

    return encoded.toLowerCase();
}

function encodeUniswapPath(sourceToken, fork, feeTeir, destinationToken) {
    return '0x' + ((BigInt(sourceToken) << 192n) | (BigInt(fork) << 184n) | (BigInt(feeTeir) << 160n) | BigInt(destinationToken)).toString(16);
}

async function getPermit2Data({ token, amount = ether('1'), spender, signer }) {
    const permit2Data = SignatureTransfer.getPermitData(
        {
            permitted: {
                token,
                amount,
            },
            spender,
            nonce: 0n,
            deadline: Date.now() + 1000,
        },
        PERMIT2_ADDRESS,
        31337,
        undefined,
    ); // 31337 is the chain ID, used to validate the signer

    const permitSignature = await signer.signTypedData(permit2Data.domain, permit2Data.types, permit2Data.values);

    return { permit2Data, permitSignature };
}

module.exports = {
    ProtocolKey,
    percentageOf,
    paraswapUniV2PoolData,
    uniswapV3EncodePath,
    encodeUniswapPath,
    getPermit2Data,
};
