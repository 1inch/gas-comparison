const { ethers } = require('hardhat');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');
const { ether, constants } = require('@1inch/solidity-utils');
const { ProtocolKey } = require('./helpers/utils');
const { initRouterContracts, adjustV2PoolTimestamps } = require('./helpers/fixtures');
const { createGasUsedTable } = require('./helpers/table');
const { MixedRouteTrade, MixedRouteSDK, Protocol, Trade, MixedRoute  } = require('@uniswap/router-sdk');
const { SwapRouter, UniswapTrade } = require('@uniswap/universal-router-sdk');
const { Pool } = require('@uniswap/v3-sdk');
const { Pair } = require('@uniswap/v2-sdk');
const { CurrencyAmount, Token, TradeType, Ether, Percent } = require('@uniswap/sdk-core');

Error.stackTraceLimit = Infinity

describe('Router [UniV2 => UniV3]', async function () {
    const gasUsedTable = createGasUsedTable("UniswapV2 => UniswapV3 pools", "path");

    const poolsV2 = {
        WETH_DAI: '0xa478c2975ab1ea89e8196811f51a7b7ade33eb11',
        WETH_USDC: '0xb4e16d0168e52d35cacd2c6185b44281ec28c9dc',
        USDC_DAI: '0xae461ca67b15dc8dc81ce7615e0320da1a9ab8d5',
        USDC_USDT: '0x3041cbd36888becc7bbcbc0045e3b1f144466f5f',
    };

    const poolsV3 = {
        WETH_DAI: { address: '0xc2e9f25be6257c210d7adf0d4cd6e3e881ba25f8', fee: 3000 },
        WETH_USDC: { address: '0x8ad599c3a0ff1de082011efddc58f1908eb6e6d8', fee: 3000 },
        USDC_DAI: { address: '0x6c6bc977e13df9b0de53b251522280bb72383700', fee: 500 },
        USDT_USDC: { address: '0x7858e59e0c01ea06df3af3d20ac7b0003275d4bf', fee: 500 },
    }

    after(async function () {
        console.log(gasUsedTable.toString());
    });

    async function initContracts () {
        const fixtureData = await initRouterContracts();

        await adjustV2PoolTimestamps(ethers, poolsV2);

        return fixtureData
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
                BigInt(poolsV2.WETH_DAI),
                BigInt(poolsV3.USDC_DAI.address) | (1n << 253n) | (1n << 247n),
                { value: amount}
            );
            console.log('Gas used:', (await tx.wait()).gasUsed.toString());
            gasUsedTable.addElementToRow(gasUsedTableRow, ProtocolKey.INCH, (await tx.wait()).gasUsed);
        });

        it('uniswap', async function () {
            const { addr1, uniswapUniversalRouter, tokens, settings: {gasUsedTableRow, amount} } = await loadFixture(initContractsWithCaseSettings);
            
            const coder = new ethers.AbiCoder();
            // we need slot0 from the uniswap v3 pool and reserves from the uniswap v2 pool
            const slot0 = await ethers.provider.call({
                to: poolsV3.USDC_DAI.address,
                data: '0x3850c7bd'
            }).then(res => coder.decode(['uint160', 'int24', 'uint16', 'uint16', 'uint8'], res));

            const liquidity = await ethers.provider.getStorage(poolsV3.USDC_DAI.address, '0x04');
            const reserves = await ethers.provider.call({
                to: poolsV2.WETH_DAI,
                data: '0x0902f1ac'
            }).then(res => coder.decode(['uint112', 'uint112', 'uint32'], res));

            // for some reason the UniswapTrade SwapOptions constructor omits the "RouterSwapOptions" from the @uniswap/router-sdk 
            // so instead of making a `new SwapOptions` we must make an object instead
            const options = {
                slippageTolerance: new Percent('9999', '10000') // 99.99%
            }

            let mixedRoute = new MixedRouteSDK(
                    [
                        new Pair(
                            CurrencyAmount.fromRawAmount(
                                new Token(1, tokens.DAI.target, 18), 
                                reserves[0].toString(10)
                            ),
                            CurrencyAmount.fromRawAmount(
                                new Token(1, tokens.WETH.target, 18), 
                                reserves[1].toString(10)
                            )
                        ),
                        new Pool(
                            new Token(1, tokens.USDC.target, 6),
                            new Token(1, tokens.DAI.target, 18),
                            poolsV3.USDC_DAI.fee, 
                            slot0[0].toString(10),
                            liquidity.toString(10),
                            Number(slot0[1])
                        )
                    ],
                    new Ether(1),
                    new Token(1, tokens.USDC.target, 6)
                )

            let trade = MixedRouteTrade.createUncheckedTrade(
                {
                    route: mixedRoute,
                    inputAmount: CurrencyAmount.fromRawAmount(new Ether(1), amount.toString(10)),
                    outputAmount: CurrencyAmount.fromRawAmount(new Token(1, tokens.USDC.target, 6), '0'),
                    tradeType: TradeType.EXACT_INPUT
                }
            )

            // fix the object because building the unchecked trade doesn't create these fields
            trade.routes = [mixedRoute];
            trade.swaps[0].route.protocol = Protocol.MIXED
            const uniswapTrade = new UniswapTrade(trade, options);
            const calldata = SwapRouter.swapCallParameters(uniswapTrade);
            // calldata.calldata is a valid calldata on mainnet

            // finally addr1 can send the transaction
            const tx = await addr1.sendTransaction({
                to: uniswapUniversalRouter.getAddress(),
                value: calldata.value,
                data: calldata.calldata
            });

            console.log('Gas used:', (await tx.wait()).gasUsed.toString());
            gasUsedTable.addElementToRow(gasUsedTableRow, ProtocolKey.UNISWAP, (await tx.wait()).gasUsed);
        });

    });

});

// describe('Router [UniV3 => UniV2]', async function () {

// });