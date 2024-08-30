const { ethers } = require('hardhat');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');
const { ether, constants } = require('@1inch/solidity-utils');
const { ProtocolKey, paraswapUniV2PoolData } = require('./helpers/utils');
const { initRouterContracts, adjustV2PoolTimestamps } = require('./helpers/fixtures');
const { createGasUsedTable } = require('./helpers/table');
const { UniswapV2Pools } = require('./helpers/pools');

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

        it('matcha2', async function () {
            const { addr1, tokens, matcha2, settlerActionsABI, settings: { gasUsedTableRow, amount } } = await loadFixture(initContractsWithCaseSettings);            
            const iface = new ethers.Interface(JSON.stringify(settlerActionsABI));
            
            // For some reason matcha2 doesn't have a built in way to wrap ETH so their web app uses
            // the BASIC function. See https://www.tdly.co/shared/simulation/08e0f052-d2c0-4890-ba0b-440f20fb0ee9
            const encodedWrapETHfunction = iface.encodeFunctionData('BASIC', [
                await tokens.EEE.getAddress(),
                10000n, // bps
                tokens.WETH.target, // pool
                4n, // offset
                '0xd0e30db00000000000000000000000000000000000000000000000000000000000000000' // tx data
            ]);

            const encodedUniswapV2FunctionData = iface.encodeFunctionData('UNISWAPV2', [
                addr1.address, // recipient,
                tokens.WETH.target,
                10000n,
                UniswapV2Pools.WETH_DAI,
                0x1e00n, // uint24 swapInfo, lowest 2 bits are FoT and zeroForOne, the highest bits are the pool fee in bps
                0n, // amountOutMin
            ])

            // Attempt to execute the transaction
            const tx = await matcha2.execute(
                { recipient: '0x0000000000000000000000000000000000000000', buyToken: '0x0000000000000000000000000000000000000000', minAmountOut: '0x00' },
                [encodedWrapETHfunction, encodedUniswapV2FunctionData],
                '0x0000000000000000000000000000000000000000000000000000000000000000',
                { value: amount }
            );

            gasUsedTable.addElementToRow(gasUsedTableRow, ProtocolKey.MATCHA2, (await tx.wait()).gasUsed);
        })

        it('uniswap', async function () {
            const {
                addr1,
                tokens,
                uniswapv2,
                settings: { gasUsedTableRow, amount },
            } = await loadFixture(initContractsWithCaseSettings);
            const tx = await uniswapv2.swapExactETHForTokens(amount, [tokens.WETH, tokens.DAI], addr1.address, '0xffffffffff', { value: amount });
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

        it('matcha2', async function() {
            const { addr1, tokens, matcha2, settlerActionsABI, settings: { gasUsedTableRow, amount } } = await loadFixture(initContractsWithCaseSettings);
          
            const iface = new ethers.Interface(JSON.stringify(settlerActionsABI));

            const encodedBasicFunctionData = iface.encodeFunctionData('BASIC', [
                await tokens.EEE.getAddress(),
                10000n, // bps
                tokens.WETH.target, // pool
                4n, // offset
                '0xd0e30db00000000000000000000000000000000000000000000000000000000000000000' // tx data
            ]);

            const encodedUniswapV2FunctionDataWETHtoUSDC = iface.encodeFunctionData('UNISWAPV2', [
                UniswapV2Pools.USDC_DAI, // gas savings to direct output to next pool
                tokens.WETH.target,
                10000n, 
                UniswapV2Pools.WETH_USDC,
                0x1e00n, 
                0n,
            ]);

            const encodedUniswapV2FunctionDataUSDCtoDAI = iface.encodeFunctionData('UNISWAPV2', [
                addr1.address, // recipient,
                tokens.USDC.target,
                10000n,
                UniswapV2Pools.USDC_DAI,
                0x1e00n, // uint24 swapInfo, lowest 2 bits are FoT and zeroForOne, the highest bits are the pool fee in bps
                0n, // amountOutMin
            ])

            const tx = await matcha2.execute(
                { recipient: '0x0000000000000000000000000000000000000000', buyToken: '0x0000000000000000000000000000000000000000', minAmountOut: '0x00' },
                [encodedBasicFunctionData, encodedUniswapV2FunctionDataWETHtoUSDC, encodedUniswapV2FunctionDataUSDCtoDAI],
                '0x0000000000000000000000000000000000000000000000000000000000000000',
                {value: amount}
            )


            gasUsedTable.addElementToRow(gasUsedTableRow, ProtocolKey.MATCHA2, (await tx.wait()).gasUsed);
          });

        it('uniswap', async function () {
            const {
                addr1,
                tokens,
                uniswapv2,
                settings: { gasUsedTableRow, amount },
            } = await loadFixture(initContractsWithCaseSettings);
            const tx = await uniswapv2.swapExactETHForTokens(amount, [tokens.WETH, tokens.USDC, tokens.DAI], addr1.address, '0xffffffffff', { value: amount });
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

        it('matcha2', async function () {
            const { addr1, tokens, matcha2, settlerActionsABI, matcha2PermitData, permitSignature, settings: { gasUsedTableRow, amount } } = await loadFixture(initContractsWithCaseSettings);
            const iface = new ethers.Interface(JSON.stringify(settlerActionsABI));

            const encodedTransferFrom = iface.encodeFunctionData('TRANSFER_FROM', [
                matcha2.target,
                matcha2PermitData.values,
                permitSignature
            ])

            const encodedUniswapV2FunctionDataDAItoWETH = iface.encodeFunctionData('UNISWAPV2', [
                matcha2.target, // since we'll need to unwrap it
                tokens.DAI.target, // sell token
                10000n, // bps
                UniswapV2Pools.WETH_DAI, // pool
                0x1e01n, // swapInfo
                0n, // amountOutMin
            ]);

            const encodedBasicFunctionData = iface.encodeFunctionData('BASIC', [
                tokens.WETH.target,
                10000n, // bps
                tokens.WETH.target, // pool
                4n, // offset
                '0x2e1a7d4d0000000000000000000000000000000000000000000000000000000000000000'
            ]);

            const tx = await matcha2.execute(
                {recipient: addr1.address, buyToken: await tokens.EEE.getAddress(), minAmountOut: '0x00'},
                [encodedTransferFrom,encodedUniswapV2FunctionDataDAItoWETH, encodedBasicFunctionData],
                '0x0000000000000000000000000000000000000000000000000000000000000000',
            );


            gasUsedTable.addElementToRow(gasUsedTableRow, ProtocolKey.MATCHA2, (await tx.wait()).gasUsed);
        });

        it('uniswap', async function () {
            const {
                addr1,
                tokens,
                uniswapv2,
                settings: { gasUsedTableRow, amount },
            } = await loadFixture(initContractsWithCaseSettings);
            const tx = await uniswapv2.swapExactTokensForETH(amount, '1', [tokens.DAI, tokens.WETH], addr1.address, '0xffffffffff');
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

        it('matcha2', async function () {
            const { addr1, tokens, matcha2, settlerActionsABI, matcha2PermitData, permitSignature, settings: { gasUsedTableRow, amount } } = await loadFixture(initContractsWithCaseSettings);

            const iface = new ethers.Interface(JSON.stringify(settlerActionsABI));

            const encodedTransferFrom = iface.encodeFunctionData('TRANSFER_FROM', [
                matcha2.target,
                matcha2PermitData.values,
                permitSignature
            ])

            const encodedUniswapV2FunctionDataDAItoWETH = iface.encodeFunctionData('UNISWAPV2', [
                addr1.address, // recipient
                tokens.DAI.target, // sell token
                10000n, // bps
                UniswapV2Pools.WETH_DAI, // pool
                0x1e01n, // swapInfo
                0n, // amountOutMin
            ]);

            const tx = await matcha2.execute(
                {recipient: '0x0000000000000000000000000000000000000000', buyToken: '0x0000000000000000000000000000000000000000', minAmountOut: '0x00'},
                [encodedTransferFrom, encodedUniswapV2FunctionDataDAItoWETH],
                '0x0000000000000000000000000000000000000000000000000000000000000000',
            );

            gasUsedTable.addElementToRow(gasUsedTableRow, ProtocolKey.MATCHA2, (await tx.wait()).gasUsed);
        });

        it('uniswap', async function () {
            const {
                addr1,
                tokens,
                uniswapv2,
                settings: { gasUsedTableRow, amount },
            } = await loadFixture(initContractsWithCaseSettings);
            const tx = await uniswapv2.swapExactTokensForTokens(amount, '1', [tokens.DAI, tokens.WETH], addr1.address, '0xffffffffff');
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

        it('matcha2', async function () {
            const { addr1, tokens, matcha2, settlerActionsABI, matcha2PermitData, permitSignature, settings: { gasUsedTableRow, amount } } = await loadFixture(initContractsWithCaseSettings);

            const iface = new ethers.Interface(JSON.stringify(settlerActionsABI));


            const encodedTransferFrom = iface.encodeFunctionData('TRANSFER_FROM', [
                matcha2.target,
                matcha2PermitData.values,
                permitSignature
            ])

            const UniswapV2FunctionDataDAItoWETH = iface.encodeFunctionData('UNISWAPV2', [
                UniswapV2Pools.WETH_USDC,
                tokens.DAI.target, // sell token
                10000n, // bps
                UniswapV2Pools.WETH_DAI, // pool
                0x1e01n, // swapInfo
                0n, // amountOutMin
            ]);

            const UniswapV2FunctionDataWETHtoUSDC = iface.encodeFunctionData('UNISWAPV2', [
                addr1.address,
                tokens.WETH.target,
                10000n,
                UniswapV2Pools.WETH_USDC,
                0x1e00,
                0n,
            ]);

            const tx = await matcha2.execute(
                {recipient: '0x0000000000000000000000000000000000000000', buyToken: '0x0000000000000000000000000000000000000000', minAmountOut: '0x00'},
                [encodedTransferFrom, UniswapV2FunctionDataDAItoWETH,UniswapV2FunctionDataWETHtoUSDC],
                '0x0000000000000000000000000000000000000000000000000000000000000000',
            )

            gasUsedTable.addElementToRow(gasUsedTableRow, ProtocolKey.MATCHA2, (await tx.wait()).gasUsed);
        })

        it('uniswap', async function () {
            const {
                addr1,
                tokens,
                uniswapv2,
                settings: { gasUsedTableRow, amount },
            } = await loadFixture(initContractsWithCaseSettings);
            const tx = await uniswapv2.swapExactTokensForTokens(amount, '1', [tokens.DAI, tokens.WETH, tokens.USDC], addr1.address, '0xffffffffff');
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

        it('matcha2', async function () {
            const { addr1, tokens, matcha2, settlerActionsABI, matcha2PermitData, permitSignature, settings: { gasUsedTableRow, amount } } = await loadFixture(initContractsWithCaseSettings);

            const iface = new ethers.Interface(JSON.stringify(settlerActionsABI));

            const encodedTransferFrom = iface.encodeFunctionData('TRANSFER_FROM', [
                matcha2.target,
                matcha2PermitData.values,
                permitSignature
            ])

            const UniswapV2FunctionDataDAItoWETH = iface.encodeFunctionData('UNISWAPV2', [
                UniswapV2Pools.WETH_USDC,
                tokens.DAI.target, // sell token
                10000n, // bps
                UniswapV2Pools.WETH_DAI, // pool
                0x1e01n, // swapInfo
                0n, // amountOutMin
            ]);

            const UniswapV2FunctionDataWETHtoUSDC = iface.encodeFunctionData('UNISWAPV2', [
                UniswapV2Pools.USDC_USDT,
                tokens.WETH.target,
                1000n,
                UniswapV2Pools.WETH_USDC,
                0x1e00,
                0n,
            ]);

            const UniswapV2FunctionDataUSDCtoUSDT = iface.encodeFunctionData('UNISWAPV2', [
                addr1.address,
                tokens.USDC.target,
                10000n,
                UniswapV2Pools.USDC_USDT,
                0x1e01n,
                0n,
            ]);

            const tx = await matcha2.execute(
                {recipient: '0x0000000000000000000000000000000000000000', buyToken: '0x0000000000000000000000000000000000000000', minAmountOut: '0x00'},
                [encodedTransferFrom, UniswapV2FunctionDataDAItoWETH, UniswapV2FunctionDataWETHtoUSDC,UniswapV2FunctionDataUSDCtoUSDT],
                '0x0000000000000000000000000000000000000000000000000000000000000000',
            )
                

            gasUsedTable.addElementToRow(gasUsedTableRow, ProtocolKey.MATCHA2, (await tx.wait()).gasUsed);
        })

        it('uniswap', async function () {
            const {
                addr1,
                tokens,
                uniswapv2,
                settings: { gasUsedTableRow, amount },
            } = await loadFixture(initContractsWithCaseSettings);
            const tx = await uniswapv2.swapExactTokensForTokens(
                amount,
                '1',
                [tokens.DAI, tokens.WETH, tokens.USDC, tokens.USDT],
                addr1.address,
                '0xffffffffff',
            );
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
