const { ethers } = require('hardhat');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');
const { ether, constants } = require('@1inch/solidity-utils');
const { ProtocolKey, paraswapUniV2PoolData } = require('./helpers/utils');
const { initRouterContracts, adjustV2PoolTimestamps } = require('./helpers/fixtures');
const { createGasUsedTable } = require('./helpers/table');
const { UniswapV2Pools } = require('./helpers/pools');
const { RoutePlanner, CommandType } = require('@uniswap/universal-router-sdk');

describe('Router [UniV2]', async function () {
    const gasUsedTable = createGasUsedTable('UniswapV2 pools', 'path');

    async function initContracts() {
        const fixtureData = await initRouterContracts();

        await adjustV2PoolTimestamps(ethers, UniswapV2Pools);

        return fixtureData;
    }

    after(async function () {
        console.log(gasUsedTable.toString());
    });

    describe('ETH => DAI', async function () {
        async function initContractsWithCaseSettings() {
            return {
                ...(await initContracts()),
                settings: {
                    gasUsedTableRow: gasUsedTable.addRow(['ETH => DAI']),
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
            const tx = await inch.ethUnoswapTo(addr1.address, '1', UniswapV2Pools.WETH_DAI, { value: amount });
            gasUsedTable.addElementToRow(gasUsedTableRow, ProtocolKey.INCH, (await tx.wait()).gasUsed);
        });

        it('matcha', async function () {
            const {
                tokens,
                matcha,
                settings: { gasUsedTableRow, amount },
            } = await loadFixture(initContractsWithCaseSettings);
            const tx = await matcha.sellToUniswap([tokens.EEE, tokens.DAI], amount, '1', false, { value: amount });
            gasUsedTable.addElementToRow(gasUsedTableRow, ProtocolKey.MATCHA, (await tx.wait()).gasUsed);
        });

        it('uniswap', async function () {
            const {
                addr1,
                tokens,
                uniswapUniversalRouter,
                settings: { gasUsedTableRow, amount },
            } = await loadFixture(initContractsWithCaseSettings);

            const planner = new RoutePlanner();
            // see https://github.com/Uniswap/sdks/blob/92b765bdf2759e5e6639a01728a96df81efbaa2b/sdks/universal-router-sdk/src/utils/routerCommands.ts#L87
            planner.addCommand(CommandType.WRAP_ETH, [
                UniswapV2Pools.WETH_DAI, // recipient
                amount,
            ]);
            planner.addCommand(CommandType.V2_SWAP_EXACT_IN, [
                addr1.address,
                0, // amount 0 because pair already has wETH deposited
                1, // minimum return
                [tokens.WETH.target, tokens.DAI.target],
                false,
            ]);

            const { commands, inputs } = planner;

            const tx = await uniswapUniversalRouter["execute(bytes,bytes[])"](commands, inputs, { value: amount });

            gasUsedTable.addElementToRow(gasUsedTableRow, ProtocolKey.UNISWAP, (await tx.wait()).gasUsed);
        });

        it('paraswap', async function () {
            const {
                addr1,
                tokens,
                uniswapv2,
                paraswap,
                settings: { gasUsedTableRow, amount },
            } = await loadFixture(initContractsWithCaseSettings);
            // Get `quotedAmount` to avoid positive slippage which makes the transaction significantly more expensive
            const [, quotedAmount] = await uniswapv2.swapExactETHForTokens.staticCall(amount, [tokens.WETH, tokens.DAI], addr1.address, '0xffffffffff', {
                value: amount,
            });
            const tx = await paraswap.swapExactAmountInOnUniswapV2(
                [
                    tokens.EEE,
                    tokens.DAI,
                    amount,
                    '1',
                    quotedAmount,
                    constants.ZERO_BYTES32,
                    constants.ZERO_ADDRESS,
                    paraswapUniV2PoolData([[tokens.WETH.target, tokens.DAI.target]]),
                ],
                0n,
                '0x',
                { value: amount },
            );
            gasUsedTable.addElementToRow(gasUsedTableRow, ProtocolKey.PARASWAP, (await tx.wait()).gasUsed);
        });
    });

    describe('ETH => USDC => DAI', async function () {
        async function initContractsWithCaseSettings() {
            return {
                ...(await initContracts()),
                settings: {
                    gasUsedTableRow: gasUsedTable.addRow(['ETH => USDC => DAI']),
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
            const tx = await inch.ethUnoswapTo2(addr1.address, '1', UniswapV2Pools.WETH_USDC, UniswapV2Pools.USDC_DAI, { value: amount });
            gasUsedTable.addElementToRow(gasUsedTableRow, ProtocolKey.INCH, (await tx.wait()).gasUsed);
        });

        it('matcha', async function () {
            const {
                tokens,
                matcha,
                settings: { gasUsedTableRow, amount },
            } = await loadFixture(initContractsWithCaseSettings);
            const tx = await matcha.sellToUniswap([tokens.EEE, tokens.USDC, tokens.DAI], amount, '1', false, { value: amount });
            gasUsedTable.addElementToRow(gasUsedTableRow, ProtocolKey.MATCHA, (await tx.wait()).gasUsed);
        });

        it('uniswap', async function () {
            const {
                tokens,
                uniswapUniversalRouter,
                settings: { gasUsedTableRow, amount },
                addr1,
            } = await loadFixture(initContractsWithCaseSettings);

            const planner = new RoutePlanner();
            planner.addCommand(CommandType.WRAP_ETH, [
                UniswapV2Pools.WETH_USDC, // recipient
                amount,
            ]);

            planner.addCommand(CommandType.V2_SWAP_EXACT_IN, [
                addr1.address,
                0, // amount 0 because pair already has wETH deposited
                1, // minimum return
                [tokens.WETH.target, tokens.USDC.target, tokens.DAI.target],
                false,
            ]);

            const { commands, inputs } = planner;

            const tx = await uniswapUniversalRouter["execute(bytes,bytes[])"](commands, inputs, { value: amount });
            gasUsedTable.addElementToRow(gasUsedTableRow, ProtocolKey.UNISWAP, (await tx.wait()).gasUsed);
        });

        it('paraswap', async function () {
            const {
                addr1,
                tokens,
                uniswapv2,
                paraswap,
                settings: { gasUsedTableRow, amount },
            } = await loadFixture(initContractsWithCaseSettings);
            // Get `quotedAmount` to avoid positive slippage which makes the transaction significantly more expensive
            const [, , quotedAmount] = await uniswapv2.swapExactETHForTokens.staticCall(
                amount,
                [tokens.WETH, tokens.USDC, tokens.DAI],
                addr1.address,
                '0xffffffffff',
                {
                    value: amount,
                },
            );
            const tx = await paraswap.swapExactAmountInOnUniswapV2(
                [
                    tokens.EEE,
                    tokens.DAI,
                    amount,
                    '1',
                    quotedAmount,
                    constants.ZERO_BYTES32,
                    constants.ZERO_ADDRESS,
                    paraswapUniV2PoolData([
                        [tokens.WETH.target, tokens.USDC.target],
                        [tokens.USDC.target, tokens.DAI.target],
                    ]),
                ],
                0n,
                '0x',
                { value: amount },
            );
            gasUsedTable.addElementToRow(gasUsedTableRow, ProtocolKey.PARASWAP, (await tx.wait()).gasUsed);
        });
    });

    describe('DAI => ETH', async function () {
        async function initContractsWithCaseSettings() {
            return {
                ...(await initContracts()),
                settings: {
                    gasUsedTableRow: gasUsedTable.addRow(['DAI => ETH']),
                    amount: ether('1'),
                },
            };
        }

        it('1inch', async function () {
            const {
                addr1,
                tokens,
                inch,
                settings: { gasUsedTableRow, amount },
            } = await loadFixture(initContractsWithCaseSettings);
            const tx = await inch.unoswapTo(
                addr1.address,
                await tokens.DAI.getAddress(),
                amount,
                '1',
                BigInt(UniswapV2Pools.WETH_DAI) | (1n << 252n) | (1n << 247n),
            );
            gasUsedTable.addElementToRow(gasUsedTableRow, ProtocolKey.INCH, (await tx.wait()).gasUsed);
        });

        it('matcha', async function () {
            const {
                tokens,
                matcha,
                settings: { gasUsedTableRow, amount },
            } = await loadFixture(initContractsWithCaseSettings);
            const tx = await matcha.sellToUniswap([tokens.DAI, tokens.EEE], amount, '1', false);
            gasUsedTable.addElementToRow(gasUsedTableRow, ProtocolKey.MATCHA, (await tx.wait()).gasUsed);
        });

        it('uniswap', async function () {
            const {
                addr1,
                tokens,
                uniswapUniversalRouter,
                settings: { gasUsedTableRow, amount },
            } = await loadFixture(initContractsWithCaseSettings);

            const planner = new RoutePlanner();

            planner.addCommand(CommandType.V2_SWAP_EXACT_IN, [addr1.address, amount, 1, [tokens.DAI.target, tokens.WETH.target], true]);

            planner.addCommand(CommandType.UNWRAP_WETH, [addr1.address, 0]);

            const { commands, inputs } = planner;

            const tx = await uniswapUniversalRouter["execute(bytes,bytes[])"](commands, inputs);

            gasUsedTable.addElementToRow(gasUsedTableRow, ProtocolKey.UNISWAP, (await tx.wait()).gasUsed);
        });

        it('paraswap', async function () {
            const {
                addr1,
                tokens,
                uniswapv2,
                paraswap,
                settings: { gasUsedTableRow, amount },
            } = await loadFixture(initContractsWithCaseSettings);
            // Get `quotedAmount` to avoid positive slippage which makes the transaction significantly more expensive
            const [, quotedAmount] = await uniswapv2.swapExactTokensForETH.staticCall(amount, '1', [tokens.DAI, tokens.WETH], addr1.address, '0xffffffffff');
            const tx = await paraswap.swapExactAmountInOnUniswapV2(
                [
                    tokens.DAI,
                    tokens.EEE,
                    amount,
                    '1',
                    quotedAmount,
                    constants.ZERO_BYTES32,
                    constants.ZERO_ADDRESS,
                    paraswapUniV2PoolData([[tokens.DAI.target, tokens.WETH.target]]),
                ],
                0n,
                '0x',
            );
            gasUsedTable.addElementToRow(gasUsedTableRow, ProtocolKey.PARASWAP, (await tx.wait()).gasUsed);
        });
    });

    describe('DAI => WETH', async function () {
        async function initContractsWithCaseSettings() {
            return {
                ...(await initContracts()),
                settings: {
                    gasUsedTableRow: gasUsedTable.addRow(['DAI => WETH']),
                    amount: ether('1'),
                },
            };
        }

        it('1inch', async function () {
            const {
                addr1,
                tokens,
                inch,
                settings: { gasUsedTableRow, amount },
            } = await loadFixture(initContractsWithCaseSettings);
            const tx = await inch.unoswapTo(addr1.address, await tokens.DAI.getAddress(), amount, '1', BigInt(UniswapV2Pools.WETH_DAI) | (1n << 247n));
            gasUsedTable.addElementToRow(gasUsedTableRow, ProtocolKey.INCH, (await tx.wait()).gasUsed);
        });

        it('matcha', async function () {
            const {
                tokens,
                matcha,
                settings: { gasUsedTableRow, amount },
            } = await loadFixture(initContractsWithCaseSettings);
            const tx = await matcha.sellToUniswap([tokens.DAI, tokens.WETH], amount, '1', false);
            gasUsedTable.addElementToRow(gasUsedTableRow, ProtocolKey.MATCHA, (await tx.wait()).gasUsed);
        });

        it('uniswap', async function () {
            const {
                addr1,
                tokens,
                uniswapUniversalRouter,
                settings: { gasUsedTableRow, amount },
            } = await loadFixture(initContractsWithCaseSettings);

            const planner = new RoutePlanner();

            planner.addCommand(CommandType.V2_SWAP_EXACT_IN, [addr1.address, amount, 1, [tokens.DAI.target, tokens.WETH.target], true]);

            const { commands, inputs } = planner;

            const tx = await uniswapUniversalRouter["execute(bytes,bytes[])"](commands, inputs);

            gasUsedTable.addElementToRow(gasUsedTableRow, ProtocolKey.UNISWAP, (await tx.wait()).gasUsed);
        });

        it('paraswap', async function () {
            const {
                addr1,
                tokens,
                uniswapv2,
                paraswap,
                settings: { gasUsedTableRow, amount },
            } = await loadFixture(initContractsWithCaseSettings);
            // Get `quotedAmount` to avoid positive slippage which makes the transaction significantly more expensive
            const [, quotedAmount] = await uniswapv2.swapExactTokensForTokens.staticCall(amount, '1', [tokens.DAI, tokens.WETH], addr1.address, '0xffffffffff');
            const tx = await paraswap.swapExactAmountInOnUniswapV2(
                [
                    tokens.DAI,
                    tokens.WETH,
                    amount,
                    '1',
                    quotedAmount,
                    constants.ZERO_BYTES32,
                    constants.ZERO_ADDRESS,
                    paraswapUniV2PoolData([[tokens.DAI.target, tokens.WETH.target]]),
                ],
                0n,
                '0x',
            );
            gasUsedTable.addElementToRow(gasUsedTableRow, ProtocolKey.PARASWAP, (await tx.wait()).gasUsed);
        });
    });

    describe('DAI => WETH => USDC', async function () {
        async function initContractsWithCaseSettings() {
            return {
                ...(await initContracts()),
                settings: {
                    gasUsedTableRow: gasUsedTable.addRow(['DAI => WETH => USDC']),
                    amount: ether('1'),
                },
            };
        }

        it('1inch', async function () {
            const {
                addr1,
                tokens,
                inch,
                settings: { gasUsedTableRow, amount },
            } = await loadFixture(initContractsWithCaseSettings);
            const tx = await inch.unoswapTo2(
                addr1.address,
                await tokens.DAI.getAddress(),
                amount,
                '1',
                BigInt(UniswapV2Pools.WETH_DAI) | (1n << 247n),
                UniswapV2Pools.WETH_USDC,
            );
            gasUsedTable.addElementToRow(gasUsedTableRow, ProtocolKey.INCH, (await tx.wait()).gasUsed);
        });

        it('matcha', async function () {
            const {
                tokens,
                matcha,
                settings: { gasUsedTableRow, amount },
            } = await loadFixture(initContractsWithCaseSettings);
            const tx = await matcha.sellToUniswap([tokens.DAI, tokens.WETH, tokens.USDC], amount, '1', false);
            gasUsedTable.addElementToRow(gasUsedTableRow, ProtocolKey.MATCHA, (await tx.wait()).gasUsed);
        });

        it('uniswap', async function () {
            const {
                addr1,
                tokens,
                uniswapUniversalRouter,
                settings: { gasUsedTableRow, amount },
            } = await loadFixture(initContractsWithCaseSettings);

            const planner = new RoutePlanner();

            planner.addCommand(CommandType.V2_SWAP_EXACT_IN, [addr1.address, amount, 1, [tokens.DAI.target, tokens.WETH.target, tokens.USDC.target], true]);

            const { commands, inputs } = planner;

            const tx = await uniswapUniversalRouter["execute(bytes,bytes[])"](commands, inputs);

            gasUsedTable.addElementToRow(gasUsedTableRow, ProtocolKey.UNISWAP, (await tx.wait()).gasUsed);
        });

        it('paraswap', async function () {
            const {
                addr1,
                tokens,
                uniswapv2,
                paraswap,
                settings: { gasUsedTableRow, amount },
            } = await loadFixture(initContractsWithCaseSettings);
            // Get `quotedAmount` to avoid positive slippage which makes the transaction significantly more expensive
            const [, , quotedAmount] = await uniswapv2.swapExactTokensForTokens.staticCall(
                amount,
                '1',
                [tokens.DAI, tokens.WETH, tokens.USDC],
                addr1.address,
                '0xffffffffff',
            );
            const tx = await paraswap.swapExactAmountInOnUniswapV2(
                [
                    tokens.DAI,
                    tokens.USDC,
                    amount,
                    '1',
                    quotedAmount,
                    constants.ZERO_BYTES32,
                    constants.ZERO_ADDRESS,
                    paraswapUniV2PoolData([
                        [tokens.DAI.target, tokens.WETH.target],
                        [tokens.WETH.target, tokens.USDC.target],
                    ]),
                ],
                0n,
                '0x',
            );
            gasUsedTable.addElementToRow(gasUsedTableRow, ProtocolKey.PARASWAP, (await tx.wait()).gasUsed);
        });
    });

    describe('DAI => WETH => USDC => USDT', async function () {
        async function initContractsWithCaseSettings() {
            return {
                ...(await initContracts()),
                settings: {
                    gasUsedTableRow: gasUsedTable.addRow(['DAI => WETH => USDC => USDT']),
                    amount: ether('1'),
                },
            };
        }

        it('1inch', async function () {
            const {
                addr1,
                tokens,
                inch,
                settings: { gasUsedTableRow, amount },
            } = await loadFixture(initContractsWithCaseSettings);
            const tx = await inch.unoswapTo3(
                addr1.address,
                await tokens.DAI.getAddress(),
                amount,
                '1',
                BigInt(UniswapV2Pools.WETH_DAI) | (1n << 247n),
                UniswapV2Pools.WETH_USDC,
                BigInt(UniswapV2Pools.USDC_USDT) | (1n << 247n),
            );
            gasUsedTable.addElementToRow(gasUsedTableRow, ProtocolKey.INCH, (await tx.wait()).gasUsed);
        });

        it('matcha', async function () {
            const {
                tokens,
                matcha,
                settings: { gasUsedTableRow, amount },
            } = await loadFixture(initContractsWithCaseSettings);
            const tx = await matcha.sellToUniswap([tokens.DAI, tokens.WETH, tokens.USDC, tokens.USDT], amount, '1', false);
            gasUsedTable.addElementToRow(gasUsedTableRow, ProtocolKey.MATCHA, (await tx.wait()).gasUsed);
        });

        it('uniswap', async function () {
            const {
                addr1,
                tokens,
                uniswapUniversalRouter,
                settings: { gasUsedTableRow, amount },
            } = await loadFixture(initContractsWithCaseSettings);

            const planner = new RoutePlanner();

            planner.addCommand(CommandType.V2_SWAP_EXACT_IN, [
                addr1.address,
                amount,
                1,
                [tokens.DAI.target, tokens.WETH.target, tokens.USDC.target, tokens.USDT.target],
                true,
            ]);

            const { commands, inputs } = planner;

            const tx = await uniswapUniversalRouter["execute(bytes,bytes[])"](commands, inputs);

            gasUsedTable.addElementToRow(gasUsedTableRow, ProtocolKey.UNISWAP, (await tx.wait()).gasUsed);
        });

        it('paraswap', async function () {
            const {
                addr1,
                tokens,
                uniswapv2,
                paraswap,
                settings: { gasUsedTableRow, amount },
            } = await loadFixture(initContractsWithCaseSettings);
            // Get `quotedAmount` to avoid positive slippage which makes the transaction significantly more expensive
            const [, , , quotedAmount] = await uniswapv2.swapExactTokensForTokens.staticCall(
                amount,
                '1',
                [tokens.DAI, tokens.WETH, tokens.USDC, tokens.USDT],
                addr1.address,
                '0xffffffffff',
            );
            const tx = await paraswap.swapExactAmountInOnUniswapV2(
                [
                    tokens.DAI,
                    tokens.USDT,
                    amount,
                    '1',
                    quotedAmount,
                    constants.ZERO_BYTES32,
                    constants.ZERO_ADDRESS,
                    paraswapUniV2PoolData([
                        [tokens.DAI.target, tokens.WETH.target],
                        [tokens.WETH.target, tokens.USDC.target],
                        [tokens.USDC.target, tokens.USDT.target],
                    ]),
                ],
                0n,
                '0x',
            );
            gasUsedTable.addElementToRow(gasUsedTableRow, ProtocolKey.PARASWAP, (await tx.wait()).gasUsed);
        });
    });
});
