const { ethers } = require('hardhat');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');
const { ether, permit2Contract } = require('@1inch/solidity-utils');
const { ProtocolKey } = require('./helpers/utils');
const { initRouterContracts, adjustV2PoolTimestamps, encodePathExactInput } = require('./helpers/fixtures');
const { createGasUsedTable } = require('./helpers/table');
const { UniswapV2Pools, UniswapV3Pools } = require('./helpers/pools');
const { RoutePlanner, CommandType } = require('@uniswap/universal-router-sdk');

describe('Mixed pools', async function () {
    const gasUsedTable = createGasUsedTable('Mixed pools', 'path');

    after(async function () {
        console.log(gasUsedTable.toString());
    });

    async function initContracts() {
        const fixtureData = await initRouterContracts();

        await adjustV2PoolTimestamps(ethers, UniswapV2Pools);

        return fixtureData;
    }

    describe('ETH =(uniV2)=> DAI =(uniV3)=> USDC', async function () {
        async function initContractsWithCaseSettings() {
            return {
                ...(await initContracts()),
                settings: {
                    gasUsedTableRow: gasUsedTable.addRow(['ETH =(uniV2)=> DAI =(uniV3)=> USDC']),
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
            gasUsedTable.addElementToRow(gasUsedTableRow, ProtocolKey.INCH, (await tx.wait()).gasUsed);
        });

        it('uniswap', async function () {
            const {
                addr1,
                uniswapUniversalRouter,
                tokens,
                settings: { gasUsedTableRow, amount },
            } = await loadFixture(initContractsWithCaseSettings);

            const planner = new RoutePlanner();
            planner.addCommand(CommandType.WRAP_ETH, [uniswapUniversalRouter.target, amount]);
            planner.addCommand(CommandType.V2_SWAP_EXACT_IN, [uniswapUniversalRouter.target, amount, '1', [tokens.WETH.target, tokens.DAI.target], false]);
            planner.addCommand(CommandType.V3_SWAP_EXACT_IN, [
                addr1.address,
                '0x8000000000000000000000000000000000000000000000000000000000000000',
                '1',
                encodePathExactInput([tokens.DAI.target, tokens.USDC.target], [UniswapV3Pools.USDC_DAI.fee]),
                false,
            ]);
            const { commands, inputs } = planner;
            const tx = await uniswapUniversalRouter["execute(bytes,bytes[])"](commands, inputs, { value: amount });
            gasUsedTable.addElementToRow(gasUsedTableRow, ProtocolKey.UNISWAP, (await tx.wait()).gasUsed);
        });
    });

    describe('ETH =(uniV3)=> DAI =(uniV2)=> USDC', async function () {
        async function initContractsWithCaseSettings() {
            return {
                ...(await initContracts()),
                settings: {
                    gasUsedTableRow: gasUsedTable.addRow(['ETH =(uniV3)=> DAI =(uniV2)=> USDC']),
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
                BigInt(UniswapV3Pools.WETH_DAI.address) | (1n << 253n),
                BigInt(UniswapV2Pools.USDC_DAI) | (1n << 247n),
                {
                    value: amount,
                },
            );
            gasUsedTable.addElementToRow(gasUsedTableRow, ProtocolKey.INCH, (await tx.wait()).gasUsed);
        });

        it('uniswap', async function () {
            const {
                addr1,
                uniswapUniversalRouter,
                tokens,
                settings: { gasUsedTableRow, amount },
            } = await loadFixture(initContractsWithCaseSettings);

            const planner = new RoutePlanner();
            planner.addCommand(CommandType.WRAP_ETH, [uniswapUniversalRouter.target, amount]);
            planner.addCommand(CommandType.V3_SWAP_EXACT_IN, [
                UniswapV2Pools.USDC_DAI,
                amount,
                '1',
                encodePathExactInput([tokens.WETH.target, tokens.DAI.target], [UniswapV3Pools.WETH_DAI.fee]),
                false,
            ]);
            planner.addCommand(CommandType.V2_SWAP_EXACT_IN, [
                addr1.address,
                0, // amount 0 because pair already has amount deposited
                1, // minimum return
                [tokens.DAI.target, tokens.USDC.target],
                false,
            ]);
            const { commands, inputs } = planner;
            const tx = await uniswapUniversalRouter["execute(bytes,bytes[])"](commands, inputs, { value: amount });
            gasUsedTable.addElementToRow(gasUsedTableRow, ProtocolKey.UNISWAP, (await tx.wait()).gasUsed);
        });
    });

    describe('DAI =(uniV2)=> WETH =(uniV3)=> USDC', async function () {
        async function initContractsWithCaseSettings() {
            return {
                ...(await initContracts()),
                settings: {
                    gasUsedTableRow: gasUsedTable.addRow(['DAI =(uniV2)=> WETH =(uniV3)=> USDC']),
                    amount: ether('1'),
                },
            };
        }

        it('1inch', async function () {
            const {
                addr1,
                inch,
                tokens,
                settings: { gasUsedTableRow, amount },
            } = await loadFixture(initContractsWithCaseSettings);

            const tx = await inch.unoswapTo2(
                addr1.address,
                tokens.DAI.target,
                amount,
                '1',
                BigInt(UniswapV2Pools.WETH_DAI) | (1n << 247n),
                BigInt(UniswapV3Pools.WETH_USDC.address) | (1n << 253n),
            );
            gasUsedTable.addElementToRow(gasUsedTableRow, ProtocolKey.INCH, (await tx.wait()).gasUsed);
        });

        it('uniswap', async function () {
            const {
                addr1,
                uniswapUniversalRouter,
                tokens,
                settings: { gasUsedTableRow, amount },
            } = await loadFixture(initContractsWithCaseSettings);

            const planner = new RoutePlanner();
            planner.addCommand(CommandType.V2_SWAP_EXACT_IN, [uniswapUniversalRouter.target, amount, '1', [tokens.DAI.target, tokens.WETH.target], true]);
            planner.addCommand(CommandType.V3_SWAP_EXACT_IN, [
                addr1.address,
                '0x8000000000000000000000000000000000000000000000000000000000000000',
                '1',
                encodePathExactInput([tokens.WETH.target, tokens.USDC.target], [UniswapV3Pools.WETH_USDC.fee]),
                false,
            ]);
            const { commands, inputs } = planner;
            const tx = await uniswapUniversalRouter["execute(bytes,bytes[])"](commands, inputs);
            gasUsedTable.addElementToRow(gasUsedTableRow, ProtocolKey.UNISWAP, (await tx.wait()).gasUsed);
        });
    });

    describe('DAI =(uniV3)=> WETH =(uniV2)=> USDC', async function () {
        async function initContractsWithCaseSettings() {
            return {
                ...(await initContracts()),
                settings: {
                    gasUsedTableRow: gasUsedTable.addRow(['DAI =(uniV3)=> WETH =(uniV2)=> USDC']),
                    amount: ether('1'),
                },
            };
        }

        it('1inch', async function () {
            const {
                addr1,
                inch,
                tokens,
                settings: { gasUsedTableRow, amount },
            } = await loadFixture(initContractsWithCaseSettings);

            const tx = await inch.unoswapTo2(
                addr1.address,
                tokens.DAI.target,
                amount,
                '1',
                BigInt(UniswapV3Pools.WETH_DAI.address) | (1n << 253n) | (1n << 247n),
                UniswapV2Pools.WETH_USDC,
            );
            gasUsedTable.addElementToRow(gasUsedTableRow, ProtocolKey.INCH, (await tx.wait()).gasUsed);
        });

        it('uniswap', async function () {
            const {
                addr1,
                uniswapUniversalRouter,
                tokens,
                settings: { gasUsedTableRow, amount },
            } = await loadFixture(initContractsWithCaseSettings);

            const planner = new RoutePlanner();
            planner.addCommand(CommandType.V3_SWAP_EXACT_IN, [
                UniswapV2Pools.WETH_USDC,
                amount,
                '1',
                encodePathExactInput([tokens.DAI.target, tokens.WETH.target], [UniswapV3Pools.WETH_DAI.fee]),
                true,
            ]);
            planner.addCommand(CommandType.V2_SWAP_EXACT_IN, [
                addr1.address,
                0, // amount 0 because pair already has amount deposited
                1, // minimum return
                [tokens.WETH.target, tokens.USDC.target],
                false,
            ]);
            const { commands, inputs } = planner;
            const tx = await uniswapUniversalRouter["execute(bytes,bytes[])"](commands, inputs);
            gasUsedTable.addElementToRow(gasUsedTableRow, ProtocolKey.UNISWAP, (await tx.wait()).gasUsed);
        });
    });
});
