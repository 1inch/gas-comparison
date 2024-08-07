const { ethers } = require('hardhat');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');
const { ether } = require('@1inch/solidity-utils');
const { ProtocolKey } = require('./helpers/utils');
const { initRouterContracts, adjustV2PoolTimestamps, encodePathExactInput } = require('./helpers/fixtures');
const { createGasUsedTable } = require('./helpers/table');
const { UniswapV2Pools, UniswapV3Pools } = require('./helpers/pools');
const { RoutePlanner, CommandType } = require('@uniswap/universal-router-sdk');

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
            const tx = await uniswapUniversalRouter.execute(commands, inputs, Date.now(), { value: amount });
            console.log('Gas used:', (await tx.wait()).gasUsed.toString());
            gasUsedTable.addElementToRow(gasUsedTableRow, ProtocolKey.UNISWAP, (await tx.wait()).gasUsed);
        });
    });
});
