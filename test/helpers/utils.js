const { ethers } = require('hardhat');
const { trim0x } = require('@1inch/solidity-utils');
const { MixedRouteTrade, MixedRouteSDK, Trade } = require('@uniswap/router-sdk');
const { SwapRouter, UniswapTrade } = require('@uniswap/universal-router-sdk');
const { Pool } = require('@uniswap/v3-sdk');
const { Pair } = require('@uniswap/v2-sdk');
const { CurrencyAmount, Token, TradeType, Ether, Percent } = require('@uniswap/sdk-core');

const ProtocolKey = {
    INCH: '1inch',
    UNISWAP: 'uniswap',
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

/**
 * Create `value` and `data` for `uniswapUniversalRouter` contract to swap tokens through mixed pools.
 * @param poolObjects Array of elements with pool data:
 *          - `string` with pool address gor UniswapV2 pools
 *          - `{ address: string, fee: number }` for UniswapV3 pools
 * @param pathTokens Array of token addresses in the swap path
 * @param useEth Use ETH as input/output token. 1 - input is eth, 2 - output is eth
 */
async function uniswapMixedPoolsData(poolObjects, pathTokens, useEth, amount) {
    if (poolObjects.length + 1 !== pathTokens.length) {
        return new Error('Invalid input data');
    }

    const chainId = 1;
    const mixedRouteObjects = [];
    let firstTokenDecimals = 18;
    let lastTokenDecimals = 18;
    for (let i = 0; i < poolObjects.length; i++) {
        const poolObject = poolObjects[i];
        const fromTokenDecimals = Number(await (await ethers.getContractAt('IERC20Metadata', pathTokens[i])).decimals());
        const toTokenDecimals = Number(await (await ethers.getContractAt('IERC20Metadata', pathTokens[i + 1])).decimals());
        if (i === 0) firstTokenDecimals = fromTokenDecimals;
        if (i === poolObjects.length - 2) lastTokenDecimals = toTokenDecimals;

        if (typeof poolObject === 'string') {
            // UniswapV2 pools
            const uniswapV2Pool = await ethers.getContractAt('IUniswapV2Pair', poolObject);
            const reserves = await uniswapV2Pool.getReserves();
            const token0 = await uniswapV2Pool.token0();
            const [reserveFromToken, reserveToToken] =
                token0 === pathTokens[i] ? [reserves.reserve0, reserves.reserve1] : [reserves.reserve1, reserves.reserve0];

            mixedRouteObjects.push(
                new Pair(
                    CurrencyAmount.fromRawAmount(new Token(chainId, pathTokens[i], fromTokenDecimals), reserveFromToken.toString()),
                    CurrencyAmount.fromRawAmount(new Token(chainId, pathTokens[i + 1], toTokenDecimals), reserveToToken.toString()),
                ),
            );
        } else {
            // UniswapV3 pools
            const uniswapV3Pool = await ethers.getContractAt('IUniswapV3Pool', poolObject.address);
            const slot0 = await uniswapV3Pool.slot0();
            const liquidity = await uniswapV3Pool.liquidity();

            mixedRouteObjects.push(
                new Pool(
                    new Token(chainId, pathTokens[i], fromTokenDecimals),
                    new Token(chainId, pathTokens[i + 1], toTokenDecimals),
                    poolObject.fee,
                    slot0.sqrtPriceX96.toString(),
                    liquidity.toString(),
                    Number(slot0.tick),
                ),
            );
        }
    }

    const mixedRoute = new MixedRouteSDK(
        mixedRouteObjects,
        useEth === 1 ? new Ether(chainId) : new Token(chainId, pathTokens[0], firstTokenDecimals),
        useEth === 2 ? new Ether(chainId) : new Token(chainId, pathTokens[pathTokens.length - 1], lastTokenDecimals),
    );

    const mixedRouteTrade = MixedRouteTrade.createUncheckedTrade({
        route: mixedRoute,
        inputAmount: CurrencyAmount.fromRawAmount(mixedRoute.input, amount.toString()),
        outputAmount: CurrencyAmount.fromRawAmount(mixedRoute.output, '0'),
        tradeType: TradeType.EXACT_INPUT,
    });
    const trade = new Trade({
        v2Routes: [],
        v3Routes: [],
        mixedRoutes: [mixedRouteTrade]
            .filter((t) => t instanceof MixedRouteTrade)
            .map((t) => ({
                mixedRoute: t.route,
                inputAmount: t.inputAmount,
                outputAmount: t.outputAmount,
            })),
        tradeType: TradeType.EXACT_INPUT,
    });

    const uniswapTrade = new UniswapTrade(trade, { slippageTolerance: new Percent('5', '100') });
    const { value, calldata: data } = SwapRouter.swapCallParameters(uniswapTrade);
    return { value, data };
}

/**
 * Create `value` and `data` for `uniswapUniversalRouter` contract to swap tokens through mixed pools.
 * @param poolObjects Array of elements with pool data:
 *          - `string` with pool address gor UniswapV2 pools
 *          - `{ address: string, fee: number }` for UniswapV3 pools
 * @param pathTokens Array of token addresses in the swap path
 * @param useEth Use ETH as input/output token. 1 - input is eth, 2 - output is eth
 */
async function uniswapMixedPoolsData(poolObjects, pathTokens, useEth, amount) {
    if (poolObjects.length + 1 !== pathTokens.length) {
        return new Error('Invalid input data');
    }

    const chainId = 1;
    const mixedRouteObjects = [];
    let firstTokenDecimals = 18;
    let lastTokenDecimals = 18;
    for (let i = 0; i < poolObjects.length; i++) {
        const poolObject = poolObjects[i];
        const fromTokenDecimals = Number(await (await ethers.getContractAt('IERC20Metadata', pathTokens[i])).decimals());
        const toTokenDecimals = Number(await (await ethers.getContractAt('IERC20Metadata', pathTokens[i + 1])).decimals());
        if (i === 0) firstTokenDecimals = fromTokenDecimals;
        if (i === poolObjects.length - 2) lastTokenDecimals = toTokenDecimals;

        if (typeof poolObject === 'string') {
            // UniswapV2 pools
            const uniswapV2Pool = await ethers.getContractAt('IUniswapV2Pair', poolObject);
            const reserves = await uniswapV2Pool.getReserves();
            const token0 = await uniswapV2Pool.token0();
            const [reserveFromToken, reserveToToken] =
                token0 === pathTokens[i] ? [reserves.reserve0, reserves.reserve1] : [reserves.reserve1, reserves.reserve0];

            mixedRouteObjects.push(
                new Pair(
                    CurrencyAmount.fromRawAmount(new Token(chainId, pathTokens[i], fromTokenDecimals), reserveFromToken.toString()),
                    CurrencyAmount.fromRawAmount(new Token(chainId, pathTokens[i + 1], toTokenDecimals), reserveToToken.toString()),
                ),
            );
        } else {
            // UniswapV3 pools
            const uniswapV3Pool = await ethers.getContractAt('IUniswapV3Pool', poolObject.address);
            const slot0 = await uniswapV3Pool.slot0();
            const liquidity = await uniswapV3Pool.liquidity();

            mixedRouteObjects.push(
                new Pool(
                    new Token(chainId, pathTokens[i], fromTokenDecimals),
                    new Token(chainId, pathTokens[i + 1], toTokenDecimals),
                    poolObject.fee,
                    slot0.sqrtPriceX96.toString(),
                    liquidity.toString(),
                    Number(slot0.tick),
                ),
            );
        }
    }

    const mixedRoute = new MixedRouteSDK(
        mixedRouteObjects,
        useEth === 1 ? new Ether(chainId) : new Token(chainId, pathTokens[0], firstTokenDecimals),
        useEth === 2 ? new Ether(chainId) : new Token(chainId, pathTokens[pathTokens.length - 1], lastTokenDecimals),
    );

    const mixedRouteTrade = MixedRouteTrade.createUncheckedTrade({
        route: mixedRoute,
        inputAmount: CurrencyAmount.fromRawAmount(mixedRoute.input, amount.toString()),
        outputAmount: CurrencyAmount.fromRawAmount(mixedRoute.output, '0'),
        tradeType: TradeType.EXACT_INPUT,
    });
    const trade = new Trade({
        v2Routes: [],
        v3Routes: [],
        mixedRoutes: [mixedRouteTrade]
            .filter((t) => t instanceof MixedRouteTrade)
            .map((t) => ({
                mixedRoute: t.route,
                inputAmount: t.inputAmount,
                outputAmount: t.outputAmount,
            })),
        tradeType: TradeType.EXACT_INPUT,
    });

    const uniswapTrade = new UniswapTrade(trade, { slippageTolerance: new Percent('5', '100') });
    const { value, calldata: data } = SwapRouter.swapCallParameters(uniswapTrade);
    return { value, data };
}

function encodeUniswapPath(sourceToken, fork, feeTeir, destinationToken) {
    return '0x' + ((BigInt(sourceToken) << 192n) | (BigInt(fork) << 184n) | (BigInt(feeTeir) << 160n) | BigInt(destinationToken)).toString(16);
}

function encodeUniswapPath(sourceToken, fork, feeTeir, destinationToken) {
    return '0x' + ((BigInt(sourceToken) << 192n) | (BigInt(fork) << 184n) | (BigInt(feeTeir) << 160n) | BigInt(destinationToken)).toString(16);
}
module.exports = {
    ProtocolKey,
    percentageOf,
    paraswapUniV2PoolData,
    uniswapMixedPoolsData,
    encodeUniswapPath,
};
