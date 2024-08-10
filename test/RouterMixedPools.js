const { ethers } = require('hardhat');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');
const { ether, permit2Contract } = require('@1inch/solidity-utils');
const { ProtocolKey, uniswapMixedPoolsData } = require('./helpers/utils');
const { initRouterContracts, adjustV2PoolTimestamps } = require('./helpers/fixtures');
const { createGasUsedTable } = require('./helpers/table');
const { UniswapV2Pools, UniswapV3Pools } = require('./helpers/pools');

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

    async function initContractsWithApproveInPermit2() {
        // This fixture is used to approve tokens in the permit2 contract and doesn't use permit functionality
        const fixtureData = await initContracts();

        // TODO: add this abi method to the interface in solidity-utils
        const abi = ['function approve(address token, address spender, uint160 amount, uint48 expiration) external'];
        const permit2 = await ethers.getContractAt(abi, (await permit2Contract()).target);
        await fixtureData.tokens.DAI.approve(permit2, ether('1'));
        await permit2.approve(fixtureData.tokens.DAI, fixtureData.uniswapUniversalRouter, ether('1'), Date.now());
        await permit2.approve(fixtureData.tokens.DAI, fixtureData.inch, ether('1'), Date.now());

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

            const tx = await addr1.sendTransaction({
                to: uniswapUniversalRouter.getAddress(),
                ...(await uniswapMixedPoolsData(
                    [UniswapV2Pools.WETH_DAI, UniswapV3Pools.USDC_DAI],
                    [tokens.WETH.target, tokens.DAI.target, tokens.USDC.target],
                    1,
                    amount,
                )),
            });
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

            const tx = await addr1.sendTransaction({
                to: uniswapUniversalRouter.getAddress(),
                ...(await uniswapMixedPoolsData(
                    [UniswapV3Pools.WETH_DAI, UniswapV2Pools.USDC_DAI],
                    [tokens.WETH.target, tokens.DAI.target, tokens.USDC.target],
                    1,
                    amount,
                )),
            });
            gasUsedTable.addElementToRow(gasUsedTableRow, ProtocolKey.UNISWAP, (await tx.wait()).gasUsed);
        });
    });

    describe('DAI =(uniV2)=> WETH =(uniV3)=> USDC', async function () {
        async function initContractsWithCaseSettings() {
            return {
                ...(await initContractsWithApproveInPermit2()),
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

            const tx = await addr1.sendTransaction({
                to: uniswapUniversalRouter.getAddress(),
                ...(await uniswapMixedPoolsData(
                    [UniswapV2Pools.WETH_DAI, UniswapV3Pools.WETH_USDC],
                    [tokens.DAI.target, tokens.WETH.target, tokens.USDC.target],
                    0,
                    amount,
                )),
            });
            gasUsedTable.addElementToRow(gasUsedTableRow, ProtocolKey.UNISWAP, (await tx.wait()).gasUsed);
        });
    });

    describe('DAI =(uniV3)=> WETH =(uniV2)=> USDC', async function () {
        async function initContractsWithCaseSettings() {
            return {
                ...(await initContractsWithApproveInPermit2()),
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

            const tx = await addr1.sendTransaction({
                to: uniswapUniversalRouter.getAddress(),
                ...(await uniswapMixedPoolsData(
                    [UniswapV3Pools.WETH_DAI, UniswapV2Pools.WETH_USDC],
                    [tokens.DAI.target, tokens.WETH.target, tokens.USDC.target],
                    0,
                    amount,
                )),
            });
            gasUsedTable.addElementToRow(gasUsedTableRow, ProtocolKey.UNISWAP, (await tx.wait()).gasUsed);
        });
    });
});
