const { ethers } = require('hardhat');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');
const { ether } = require('@1inch/solidity-utils');
const { ProtocolKey } = require('./helpers/utils');
const { initRouterContracts, adjustV2PoolTimestamps } = require('./helpers/fixtures');
const { createGasUsedTable } = require('./helpers/table');
const { MixedRouteTrade, MixedRouteSDK, Protocol } = require('@uniswap/router-sdk');
const { SwapRouter, UniswapTrade } = require('@uniswap/universal-router-sdk');
const { Pool } = require('@uniswap/v3-sdk');
const { Pair } = require('@uniswap/v2-sdk');
const { CurrencyAmount, Token, TradeType, Ether, Percent } = require('@uniswap/sdk-core');
const { UniswapV2Pools, UniswapV3Pools } = require('./helpers/pools');

describe('Router [UniV2 => UniV3]', async function () {
    const gasUsedTable = createGasUsedTable('UniswapV2 => UniswapV3 pools', 'path');

    after(async function () {
        console.log(gasUsedTable.toString());
    });

    async function initContracts() {
        const fixtureData = await initRouterContracts();

        await adjustV2PoolTimestamps(ethers, UniswapV2Pools);

        return fixtureData;
    }

    describe('ETH =[uniV2]=> DAI =[uniV3]=> USDC', async function () {
        async function initContractsWithCaseSettings() {
            return {
                ...(await initContracts()),
                settings: {
                    gasUsedTableRow: gasUsedTable.addRow(['ETH =[uniV2]=> DAI =[uniV3]=> USDC']),
                    amount: ether('1'),
                },
            };
        }

        it('1inch', async function () {
            const {
                addr1,
                inch,
                settings: { gasUsedTableRow, amount },
            } = await loadFixture(initContractsWithCaseSettings);

            const tx = await inch.ethUnoswapTo2(
                addr1.address,
                '1',
                BigInt(UniswapV2Pools.WETH_DAI),
                BigInt(UniswapV3Pools.USDC_DAI.address) | (1n << 253n) | (1n << 247n),
                {
                    value: amount,
                },
            );
            console.log('Gas used:', (await tx.wait()).gasUsed.toString());
            gasUsedTable.addElementToRow(gasUsedTableRow, ProtocolKey.INCH, (await tx.wait()).gasUsed);
        });

        it('uniswap', async function () {
            const {
                addr1,
                uniswapUniversalRouter,
                tokens,
                settings: { gasUsedTableRow, amount },
            } = await loadFixture(initContractsWithCaseSettings);

            const uniswapV3Pool = await ethers.getContractAt('IUniswapV3Pool', UniswapV3Pools.USDC_DAI.address);
            const slot0 = await uniswapV3Pool.slot0();
            const liquidity = await uniswapV3Pool.liquidity();

            const uniswapV2Pool = await ethers.getContractAt('IUniswapV2Pair', UniswapV2Pools.WETH_DAI);
            const reserves = await uniswapV2Pool.getReserves();

            // for some reason the UniswapTrade SwapOptions constructor omits the "RouterSwapOptions" from the @uniswap/router-sdk
            // so instead of making a `new SwapOptions` we must make an object instead
            const options = {
                slippageTolerance: new Percent('9999', '10000'), // 99.99%
            };

            const mixedRoute = new MixedRouteSDK(
                [
                    new Pair(
                        CurrencyAmount.fromRawAmount(new Token(1, tokens.DAI.target, 18), reserves.reserve0.toString()),
                        CurrencyAmount.fromRawAmount(new Token(1, tokens.WETH.target, 18), reserves.reserve1.toString()),
                    ),
                    new Pool(
                        new Token(1, tokens.USDC.target, 6),
                        new Token(1, tokens.DAI.target, 18),
                        UniswapV3Pools.USDC_DAI.fee,
                        slot0.sqrtPriceX96.toString(),
                        liquidity.toString(),
                        Number(slot0.tick),
                    ),
                ],
                new Ether(1),
                new Token(1, tokens.USDC.target, 6),
            );

            const trade = MixedRouteTrade.createUncheckedTrade({
                route: mixedRoute,
                inputAmount: CurrencyAmount.fromRawAmount(mixedRoute.input, amount.toString()),
                outputAmount: CurrencyAmount.fromRawAmount(mixedRoute.output, '0'),
                tradeType: TradeType.EXACT_INPUT,
            });

            // fix the object because building the unchecked trade doesn't create these fields
            trade.routes = [mixedRoute];
            trade.swaps[0].route.protocol = Protocol.MIXED;
            const uniswapTrade = new UniswapTrade(trade, options);
            const { value, calldata } = SwapRouter.swapCallParameters(uniswapTrade);

            // finally addr1 can send the transaction
            const tx = await addr1.sendTransaction({
                to: uniswapUniversalRouter.getAddress(),
                value,
                data: calldata,
            });

            console.log('Gas used:', (await tx.wait()).gasUsed.toString());
            gasUsedTable.addElementToRow(gasUsedTableRow, ProtocolKey.UNISWAP, (await tx.wait()).gasUsed);
        });
    });
});
