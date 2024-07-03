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
const { UniswapV2Pools, UniswapV3Pools, UNISWAP_V2_ABI, UNISWAP_V3_ABI } = require('./helpers/pools');

describe('Router [UniV2 => UniV3]', async function () {
    const gasUsedTable = createGasUsedTable("UniswapV2 => UniswapV3 pools", "path");


    after(async function () {
        console.log(gasUsedTable.toString());
    });

    async function initContracts () {
        const fixtureData = await initRouterContracts();

        await adjustV2PoolTimestamps(ethers, UniswapV2Pools);

        return fixtureData;
    }


    describe('ETH =[uniV2]=> DAI =[uniV3]=> USDC', async function () {
        async function initContractsWithCaseSettings () {
            return {
                ...(await initContracts()),
                settings: {
                    gasUsedTableRow: gasUsedTable.addRow(['ETH =[uniV2]=> DAI =[uniV3]=> USDC']),
                    amount: ether('1'),
                },
            };
        }

        it('1inch', async function () {
            const { addr1, inch, settings: {gasUsedTableRow, amount} } = await loadFixture(initContractsWithCaseSettings);

            const tx = await inch.ethUnoswapTo2(
                addr1.address,
                '1',
                BigInt(UniswapV2Pools.WETH_DAI),
                BigInt(UniswapV3Pools.USDC_DAI.address) | (1n << 253n) | (1n << 247n),
                { value: amount},
            );
            console.log('Gas used:', (await tx.wait()).gasUsed.toString());
            gasUsedTable.addElementToRow(gasUsedTableRow, ProtocolKey.INCH, (await tx.wait()).gasUsed);
        });

        it('uniswap', async function () {
            const { addr1, uniswapUniversalRouter, tokens, settings: {gasUsedTableRow, amount} } = await loadFixture(initContractsWithCaseSettings);

            const coder = new ethers.AbiCoder();
            // we need slot0 from the uniswap v3 pool and reserves from the uniswap v2 pool
            const UniswapV3Pool = new ethers.Contract(UniswapV3Pools.USDC_DAI.address, UNISWAP_V3_ABI, ethers.provider);
            const slot0 = await UniswapV3Pool.slot0();

            const UniswapV2Pool = new ethers.Contract(UniswapV2Pools.WETH_DAI, UNISWAP_V2_ABI, ethers.provider);
            const liquidity = await ethers.provider.getStorage(UniswapV3Pools.USDC_DAI.address, '0x04');
            const reserves = await UniswapV2Pool.getReserves();

            // for some reason the UniswapTrade SwapOptions constructor omits the "RouterSwapOptions" from the @uniswap/router-sdk
            // so instead of making a `new SwapOptions` we must make an object instead
            const options = {
                slippageTolerance: new Percent('9999', '10000'), // 99.99%
            };

            let mixedRoute = new MixedRouteSDK(
                [
                    new Pair(
                        CurrencyAmount.fromRawAmount(
                            new Token(1, tokens.DAI.target, 18),
                            reserves[0].toString(10),
                        ),
                        CurrencyAmount.fromRawAmount(
                            new Token(1, tokens.WETH.target, 18),
                            reserves[1].toString(10),
                        )
                    ),
                    new Pool(
                        new Token(1, tokens.USDC.target, 6),
                        new Token(1, tokens.DAI.target, 18),
                        UniswapV3Pools.USDC_DAI.fee,
                        slot0[0].toString(10),
                        liquidity.toString(10),
                        Number(slot0[1]),
                    ),
                ],
                new Ether(1),
                new Token(1, tokens.USDC.target, 6),
            );

            let trade = MixedRouteTrade.createUncheckedTrade(
                {
                    route: mixedRoute,
                    inputAmount: CurrencyAmount.fromRawAmount(new Ether(1), amount.toString(10)),
                    outputAmount: CurrencyAmount.fromRawAmount(new Token(1, tokens.USDC.target, 6), '0'),
                    tradeType: TradeType.EXACT_INPUT,
                },
            );

            // fix the object because building the unchecked trade doesn't create these fields
            trade.routes = [mixedRoute];
            trade.swaps[0].route.protocol = Protocol.MIXED;
            const uniswapTrade = new UniswapTrade(trade, options);
            const { value, calldata } = SwapRouter.swapCallParameters(uniswapTrade);

            // finally addr1 can send the transaction
            const tx = await addr1.sendTransaction({
                to: uniswapUniversalRouter.getAddress(),
                value: value,
                data: calldata,
            });

            console.log('Gas used:', (await tx.wait()).gasUsed.toString());
            gasUsedTable.addElementToRow(gasUsedTableRow, ProtocolKey.UNISWAP, (await tx.wait()).gasUsed);
        });

    });

});
