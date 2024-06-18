const { ethers } = require('hardhat');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');
const { ether, constants } = require('@1inch/solidity-utils');
const { ProtocolKey } = require('./helpers/utils');
const { initRouterContracts } = require('./helpers/fixtures');
const { createGasUsedTable } = require('./helpers/table');

describe('Router [UniV3]', async function () {
    const gasUsedTable = createGasUsedTable("UniswapV3 pools", "path");

    const pools = {
        WETH_DAI: { address: '0xc2e9f25be6257c210d7adf0d4cd6e3e881ba25f8', fee: 3000 },
        WETH_USDC: { address: '0x8ad599c3a0ff1de082011efddc58f1908eb6e6d8', fee: 3000 },
        USDC_DAI: { address: '0x6c6bc977e13df9b0de53b251522280bb72383700', fee: 500 },
        USDT_USDC: { address: '0x7858e59e0c01ea06df3af3d20ac7b0003275d4bf', fee: 500 },
    }

    after(async function () {
        console.log(gasUsedTable.toString());
    });

    describe('ETH => DAI', async function () {
        async function initRouterContractsWithCaseSettings () {
            return {
                ...(await initRouterContracts()),
                settings: {
                    gasUsedTableRow: gasUsedTable.addRow(['ETH => DAI']),
                    amount: ether('1'),
                },
            };
        }

        it('1inch', async function () {
            const { addr1, inch, settings: { gasUsedTableRow, amount } } = await loadFixture(initRouterContractsWithCaseSettings);
            const tx = await inch.ethUnoswapTo(
                addr1.address,
                '1',
                BigInt(pools.WETH_DAI.address) | (1n << 253n),
                { value: amount },
            );
            gasUsedTable.addElementToRow(gasUsedTableRow, ProtocolKey.INCH, (await tx.wait()).gasUsed);
        });

        it('matcha', async function () {
            const { addr1, tokens, matcha, settings: { gasUsedTableRow, amount } } = await loadFixture(initRouterContractsWithCaseSettings);
            const tx = await matcha.sellEthForTokenToUniswapV3(
                ethers.concat([tokens.WETH.target, ethers.toBeHex(pools.WETH_DAI.fee, 3), tokens.DAI.target]),
                '1',
                addr1.address,
                { value: amount },
            );
            gasUsedTable.addElementToRow(gasUsedTableRow, ProtocolKey.MATCHA, (await tx.wait()).gasUsed);
        });

        it('uniswap', async function () {
            const { addr1, tokens, uniswapv3, settings: { gasUsedTableRow, amount } } = await loadFixture(initRouterContractsWithCaseSettings);
            const tx = await uniswapv3.exactInputSingle([
                    tokens.WETH,
                    tokens.DAI,
                    pools.WETH_DAI.fee,
                    addr1.address,
                    '0xffffffff',
                    amount,
                    '1',
                    '0',
                ],
                { value: amount },
            );
            gasUsedTable.addElementToRow(gasUsedTableRow, ProtocolKey.UNISWAP, (await tx.wait()).gasUsed);
        });

        it('paraswap', async function () {
            const { addr1, tokens, uniswapv3, paraswap, settings: { gasUsedTableRow, amount } } = await loadFixture(initRouterContractsWithCaseSettings);
            // Get `quotedAmount` to avoid positive slippage which makes the transaction significantly more expensive
            const quotedAmount = await uniswapv3.exactInputSingle.staticCall([
                    tokens.WETH,
                    tokens.DAI,
                    pools.WETH_DAI.fee,
                    addr1.address,
                    '0xffffffff',
                    amount,
                    '1',
                    '0',
                ],
                { value: amount },
            );
            const tx = await paraswap.swapExactAmountInOnUniswapV3([
                    tokens.EEE,
                    tokens.DAI,
                    amount,
                    '1',
                    quotedAmount,
                    constants.ZERO_BYTES32,
                    constants.ZERO_ADDRESS,
                    ethers.concat([
                        '0x00', // direction
                        ethers.zeroPadValue(tokens.DAI.target, 31),
                        ethers.zeroPadValue(tokens.WETH.target, 32),
                        ethers.toBeHex(pools.WETH_DAI.fee, 32),
                    ]),
                ],
                0n,
                '0x',
                { value: amount },
            );
            gasUsedTable.addElementToRow(gasUsedTableRow, ProtocolKey.PARASWAP, (await tx.wait()).gasUsed);
        });
    });

    describe('ETH => USDC => DAI', async function () {
        async function initRouterContractsWithCaseSettings () {
            return {
                ...(await initRouterContracts()),
                settings: {
                    gasUsedTableRow: gasUsedTable.addRow(['ETH => USDC => DAI']),
                    amount: ether('1'),
                },
            };
        }

        it('1inch', async function () {
            const { addr1, inch, settings: { gasUsedTableRow, amount } } = await loadFixture(initRouterContractsWithCaseSettings);
            const tx = await inch.ethUnoswapTo2(
                addr1.address,
                '1',
                BigInt(pools.WETH_USDC.address) | (1n << 253n),
                BigInt(pools.USDC_DAI.address) | (1n << 253n),
                { value: amount },
            );
            gasUsedTable.addElementToRow(gasUsedTableRow, ProtocolKey.INCH, (await tx.wait()).gasUsed);
        });

        it('matcha', async function () {
            const { addr1, tokens, matcha, settings: { gasUsedTableRow, amount } } = await loadFixture(initRouterContractsWithCaseSettings);
            const tx = await matcha.sellEthForTokenToUniswapV3(
                ethers.concat([
                    tokens.WETH.target, ethers.toBeHex(pools.WETH_USDC.fee, 3),
                    tokens.USDC.target, ethers.toBeHex(pools.USDC_DAI.fee, 3),
                    tokens.DAI.target,
                ]),
                '1',
                addr1.address,
                { value: amount },
            );
            gasUsedTable.addElementToRow(gasUsedTableRow, ProtocolKey.MATCHA, (await tx.wait()).gasUsed);
        });

        it('uniswap', async function () {
            const { addr1, tokens, uniswapv3, settings: { gasUsedTableRow, amount } } = await loadFixture(initRouterContractsWithCaseSettings);
            const tx = await uniswapv3.exactInput([
                    ethers.concat([
                        tokens.WETH.target, ethers.toBeHex(pools.WETH_USDC.fee, 3),
                        tokens.USDC.target, ethers.toBeHex(pools.USDC_DAI.fee, 3),
                        tokens.DAI.target,
                    ]),
                    addr1.address,
                    '0xffffffff',
                    amount,
                    '1',
                ],
                { value: amount },
            );
            gasUsedTable.addElementToRow(gasUsedTableRow, ProtocolKey.UNISWAP, (await tx.wait()).gasUsed);
        });

        it('paraswap', async function () {
            const { addr1, tokens, uniswapv3, paraswap, settings: { gasUsedTableRow, amount } } = await loadFixture(initRouterContractsWithCaseSettings);
            // Get `quotedAmount` to avoid positive slippage which makes the transaction significantly more expensive
            const quotedAmount = await uniswapv3.exactInput.staticCall([
                    ethers.concat([
                        tokens.WETH.target, ethers.toBeHex(pools.WETH_USDC.fee, 3),
                        tokens.USDC.target, ethers.toBeHex(pools.USDC_DAI.fee, 3),
                        tokens.DAI.target,
                    ]),
                    addr1.address,
                    '0xffffffff',
                    amount,
                    '1',
                ],
                { value: amount },
            );
            const tx = await paraswap.swapExactAmountInOnUniswapV3([
                    tokens.EEE,
                    tokens.DAI,
                    amount,
                    '1',
                    quotedAmount,
                    constants.ZERO_BYTES32,
                    constants.ZERO_ADDRESS,
                    ethers.concat([
                        '0x00', // direction
                        ethers.zeroPadValue(tokens.USDC.target, 31),
                        ethers.zeroPadValue(tokens.WETH.target, 32),
                        ethers.toBeHex(pools.WETH_USDC.fee, 32),
                        '0x00', // direction
                        ethers.zeroPadValue(tokens.DAI.target, 31),
                        ethers.zeroPadValue(tokens.USDC.target, 32),
                        ethers.toBeHex(pools.USDC_DAI.fee, 32),
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
        async function initRouterContractsWithCaseSettings () {
            return {
                ...(await initRouterContracts()),
                settings: {
                    gasUsedTableRow: gasUsedTable.addRow(['DAI => ETH']),
                    amount: ether('1'),
                },
            };
        }

        it('1inch', async function () {
            const { addr1, tokens, inch, settings: { gasUsedTableRow, amount } } = await loadFixture(initRouterContractsWithCaseSettings);
            const tx = await inch.unoswapTo(
                addr1.address,
                await tokens.DAI.getAddress(),
                amount,
                '1',
                BigInt(pools.WETH_DAI.address) | (1n << 253n) | (1n << 252n) | (1n << 247n),
            );
            gasUsedTable.addElementToRow(gasUsedTableRow, ProtocolKey.INCH, (await tx.wait()).gasUsed);
        });

        it('matcha', async function () {
            const { addr1, tokens, matcha, settings: { gasUsedTableRow, amount } } = await loadFixture(initRouterContractsWithCaseSettings);
            const tx = await matcha.sellTokenForEthToUniswapV3(
                ethers.concat([tokens.DAI.target, ethers.toBeHex(pools.WETH_DAI.fee, 3), tokens.WETH.target]),
                amount,
                '1',
                addr1.address,
            );
            gasUsedTable.addElementToRow(gasUsedTableRow, ProtocolKey.MATCHA, (await tx.wait()).gasUsed);
        });

        it('uniswap', async function () {
            const { addr1, tokens, uniswapv3, settings: { gasUsedTableRow, amount } } = await loadFixture(initRouterContractsWithCaseSettings);
            const swapData = uniswapv3.interface.encodeFunctionData('exactInputSingle', [[
                await tokens.DAI.getAddress(),
                await tokens.WETH.getAddress(),
                pools.WETH_DAI.fee,
                constants.ZERO_ADDRESS,
                '0xffffffff',
                amount,
                '1',
                '0',
            ]]);
            const unwrapData = uniswapv3.interface.encodeFunctionData('unwrapWETH9', ['1', addr1.address]);
            const tx = await uniswapv3.multicall([swapData, unwrapData]);
            gasUsedTable.addElementToRow(gasUsedTableRow, ProtocolKey.UNISWAP, (await tx.wait()).gasUsed);
        });

        it('paraswap', async function () {
            const { addr1, tokens, uniswapv3, paraswap, settings: { gasUsedTableRow, amount } } = await loadFixture(initRouterContractsWithCaseSettings);
            // Get `quotedAmount` to avoid positive slippage which makes the transaction significantly more expensive
            const quotedAmount = await uniswapv3.exactInputSingle.staticCall([
                tokens.DAI,
                tokens.WETH,
                pools.WETH_DAI.fee,
                addr1.address,
                '0xffffffff',
                amount,
                '1',
                '0',
            ]);
            const tx = await paraswap.swapExactAmountInOnUniswapV3([
                    tokens.DAI,
                    tokens.EEE,
                    amount,
                    '1',
                    quotedAmount,
                    constants.ZERO_BYTES32,
                    constants.ZERO_ADDRESS,
                    ethers.concat([
                        '0x80', // direction
                        ethers.zeroPadValue(tokens.DAI.target, 31),
                        ethers.zeroPadValue(tokens.WETH.target, 32),
                        ethers.toBeHex(pools.WETH_DAI.fee, 32),
                    ]),
                ],
                0n,
                '0x',
            );
            gasUsedTable.addElementToRow(gasUsedTableRow, ProtocolKey.PARASWAP, (await tx.wait()).gasUsed);
        });
    });

    describe('DAI => WETH', async function () {
        async function initRouterContractsWithCaseSettings () {
            return {
                ...(await initRouterContracts()),
                settings: {
                    gasUsedTableRow: gasUsedTable.addRow(['DAI => WETH']),
                    amount: ether('1'),
                },
            };
        }

        it('1inch', async function () {
            const { addr1, tokens, inch, settings: { gasUsedTableRow, amount } } = await loadFixture(initRouterContractsWithCaseSettings);
            const tx = await inch.unoswapTo(
                addr1.address,
                await tokens.DAI.getAddress(),
                amount,
                '1',
                BigInt(pools.WETH_DAI.address) | (1n << 253n) | (1n << 247n),
            );
            gasUsedTable.addElementToRow(gasUsedTableRow, ProtocolKey.INCH, (await tx.wait()).gasUsed);
        });

        it('matcha', async function () {
            const { addr1, tokens, matcha, settings: { gasUsedTableRow, amount } } = await loadFixture(initRouterContractsWithCaseSettings);
            const tx = await matcha.sellTokenForTokenToUniswapV3(
                ethers.concat([tokens.DAI.target, ethers.toBeHex(pools.WETH_DAI.fee, 3), tokens.WETH.target]),
                amount,
                '1',
                addr1.address,
            );
            gasUsedTable.addElementToRow(gasUsedTableRow, ProtocolKey.MATCHA, (await tx.wait()).gasUsed);
        });

        it('uniswap', async function () {
            const { addr1, tokens, uniswapv3, settings: { gasUsedTableRow, amount } } = await loadFixture(initRouterContractsWithCaseSettings);
            const tx = await uniswapv3.exactInputSingle([
                tokens.DAI,
                tokens.WETH,
                pools.WETH_DAI.fee,
                addr1.address,
                '0xffffffff',
                amount,
                '1',
                '0',
            ]);
            gasUsedTable.addElementToRow(gasUsedTableRow, ProtocolKey.UNISWAP, (await tx.wait()).gasUsed);
        });

        it('paraswap', async function () {
            const { addr1, tokens, uniswapv3, paraswap, settings: { gasUsedTableRow, amount } } = await loadFixture(initRouterContractsWithCaseSettings);
            // Get `quotedAmount` to avoid positive slippage which makes the transaction significantly more expensive
            const quotedAmount = await uniswapv3.exactInputSingle.staticCall([
                tokens.DAI,
                tokens.WETH,
                pools.WETH_DAI.fee,
                addr1.address,
                '0xffffffff',
                amount,
                '1',
                '0',
            ]);
            const tx = await paraswap.swapExactAmountInOnUniswapV3([
                    tokens.DAI,
                    tokens.WETH,
                    amount,
                    '1',
                    quotedAmount,
                    constants.ZERO_BYTES32,
                    constants.ZERO_ADDRESS,
                    ethers.concat([
                        '0x80', // direction
                        ethers.zeroPadValue(tokens.DAI.target, 31),
                        ethers.zeroPadValue(tokens.WETH.target, 32),
                        ethers.toBeHex(pools.WETH_DAI.fee, 32),
                    ]),
                ],
                0n,
                '0x',
            );
            gasUsedTable.addElementToRow(gasUsedTableRow, ProtocolKey.PARASWAP, (await tx.wait()).gasUsed);
        });
    });

    describe('DAI => WETH => USDC', async function () {
        async function initRouterContractsWithCaseSettings () {
            return {
                ...(await initRouterContracts()),
                settings: {
                    gasUsedTableRow: gasUsedTable.addRow(['DAI => WETH => USDC']),
                    amount: ether('1'),
                },
            };
        }

        it('1inch', async function () {
            const { addr1, tokens, inch, settings: { gasUsedTableRow, amount } } = await loadFixture(initRouterContractsWithCaseSettings);
            const tx = await inch.unoswapTo2(
                addr1.address,
                await tokens.DAI.getAddress(),
                amount,
                '1',
                BigInt(pools.WETH_DAI.address) | (1n << 253n) | (1n << 247n),
                BigInt(pools.WETH_USDC.address) | (1n << 253n),
            );
            gasUsedTable.addElementToRow(gasUsedTableRow, ProtocolKey.INCH, (await tx.wait()).gasUsed);
        });

        it('matcha', async function () {
            const { addr1, tokens, matcha, settings: { gasUsedTableRow, amount } } = await loadFixture(initRouterContractsWithCaseSettings);
            const tx = await matcha.sellTokenForTokenToUniswapV3(
                ethers.concat([
                    tokens.DAI.target, ethers.toBeHex(pools.WETH_DAI.fee, 3),
                    tokens.WETH.target, ethers.toBeHex(pools.WETH_USDC.fee, 3),
                    tokens.USDC.target,
                ]),
                amount,
                '1',
                addr1.address,
            );
            gasUsedTable.addElementToRow(gasUsedTableRow, ProtocolKey.MATCHA, (await tx.wait()).gasUsed);
        });

        it('uniswap', async function () {
            const { addr1, tokens, uniswapv3, settings: { gasUsedTableRow, amount } } = await loadFixture(initRouterContractsWithCaseSettings);
            const tx = await uniswapv3.exactInput({
                path: ethers.concat([
                    tokens.DAI.target, ethers.toBeHex(pools.WETH_DAI.fee, 3),
                    tokens.WETH.target, ethers.toBeHex(pools.WETH_USDC.fee, 3),
                    tokens.USDC.target,
                ]),
                recipient: addr1.address,
                deadline: '0xffffffff',
                amountIn: amount,
                amountOutMinimum: '1',
            });
            gasUsedTable.addElementToRow(gasUsedTableRow, ProtocolKey.UNISWAP, (await tx.wait()).gasUsed);
        });

        it('paraswap', async function () {
            const { addr1, tokens, uniswapv3, paraswap, settings: { gasUsedTableRow, amount } } = await loadFixture(initRouterContractsWithCaseSettings);
            // Get `quotedAmount` to avoid positive slippage which makes the transaction significantly more expensive
            const quotedAmount = await uniswapv3.exactInput.staticCall({
                path: ethers.concat([
                    tokens.DAI.target, ethers.toBeHex(pools.WETH_DAI.fee, 3),
                    tokens.WETH.target, ethers.toBeHex(pools.WETH_USDC.fee, 3),
                    tokens.USDC.target,
                ]),
                recipient: addr1.address,
                deadline: '0xffffffff',
                amountIn: amount,
                amountOutMinimum: '1',
            });
            const tx = await paraswap.swapExactAmountInOnUniswapV3([
                    tokens.DAI,
                    tokens.USDC,
                    amount,
                    '1',
                    quotedAmount,
                    constants.ZERO_BYTES32,
                    constants.ZERO_ADDRESS,
                    ethers.concat([
                        '0x80', // direction
                        ethers.zeroPadValue(tokens.DAI.target, 31),
                        ethers.zeroPadValue(tokens.WETH.target, 32),
                        ethers.toBeHex(pools.WETH_DAI.fee, 32),
                        '0x00', // direction
                        ethers.zeroPadValue(tokens.USDC.target, 31),
                        ethers.zeroPadValue(tokens.WETH.target, 32),
                        ethers.toBeHex(pools.WETH_USDC.fee, 32),
                    ]),
                ],
                0n,
                '0x',
            );
            gasUsedTable.addElementToRow(gasUsedTableRow, ProtocolKey.PARASWAP, (await tx.wait()).gasUsed);
        });
    });

    describe('DAI => WETH => USDC => USDT', async function () {
        async function initRouterContractsWithCaseSettings () {
            return {
                ...(await initRouterContracts()),
                settings: {
                    gasUsedTableRow: gasUsedTable.addRow(['DAI => WETH => USDC => USDT']),
                    amount: ether('1'),
                },
            };
        }

        it('1inch', async function () {
            const { addr1, tokens, inch, settings: { gasUsedTableRow, amount } } = await loadFixture(initRouterContractsWithCaseSettings);
            const tx = await inch.unoswapTo3(
                addr1.address,
                await tokens.DAI.getAddress(),
                amount,
                '1',
                BigInt(pools.WETH_DAI.address) | (1n << 253n) | (1n << 247n),
                BigInt(pools.WETH_USDC.address) | (1n << 253n),
                BigInt(pools.USDT_USDC.address) | (1n << 253n) | (1n << 247n),
            );
            gasUsedTable.addElementToRow(gasUsedTableRow, ProtocolKey.INCH, (await tx.wait()).gasUsed);
        });

        it('matcha', async function () {
            const { addr1, tokens, matcha, settings: { gasUsedTableRow, amount } } = await loadFixture(initRouterContractsWithCaseSettings);
            const tx = await matcha.sellTokenForTokenToUniswapV3(
                ethers.concat([
                    tokens.DAI.target, ethers.toBeHex(pools.WETH_DAI.fee, 3),
                    tokens.WETH.target, ethers.toBeHex(pools.WETH_USDC.fee, 3),
                    tokens.USDC.target, ethers.toBeHex(pools.USDT_USDC.fee, 3),
                    tokens.USDT.target,
                ]),
                amount,
                '1',
                addr1.address,
            );
            gasUsedTable.addElementToRow(gasUsedTableRow, ProtocolKey.MATCHA, (await tx.wait()).gasUsed);
        });

        it('uniswap', async function () {
            const { addr1, tokens, uniswapv3, settings: { gasUsedTableRow, amount } } = await loadFixture(initRouterContractsWithCaseSettings);
            const tx = await uniswapv3.exactInput({
                path: ethers.concat([
                    tokens.DAI.target, ethers.toBeHex(pools.WETH_DAI.fee, 3),
                    tokens.WETH.target, ethers.toBeHex(pools.WETH_USDC.fee, 3),
                    tokens.USDC.target, ethers.toBeHex(pools.USDT_USDC.fee, 3),
                    tokens.USDT.target,
                ]),
                recipient: addr1.address,
                deadline: '0xffffffff',
                amountIn: amount,
                amountOutMinimum: '1',
            });
            gasUsedTable.addElementToRow(gasUsedTableRow, ProtocolKey.UNISWAP, (await tx.wait()).gasUsed);
        });

        it('paraswap', async function () {
            const { addr1, tokens, uniswapv3, paraswap, settings: { gasUsedTableRow, amount } } = await loadFixture(initRouterContractsWithCaseSettings);
            // Get `quotedAmount` to avoid positive slippage which makes the transaction significantly more expensive
            const quotedAmount = await uniswapv3.exactInput.staticCall({
                path: ethers.concat([
                    tokens.DAI.target, ethers.toBeHex(pools.WETH_DAI.fee, 3),
                    tokens.WETH.target, ethers.toBeHex(pools.WETH_USDC.fee, 3),
                    tokens.USDC.target, ethers.toBeHex(pools.USDT_USDC.fee, 3),
                    tokens.USDT.target,
                ]),
                recipient: addr1.address,
                deadline: '0xffffffff',
                amountIn: amount,
                amountOutMinimum: '1',
            });
            const tx = await paraswap.swapExactAmountInOnUniswapV3([
                    tokens.DAI,
                    tokens.USDT,
                    amount,
                    '1',
                    quotedAmount,
                    constants.ZERO_BYTES32,
                    constants.ZERO_ADDRESS,
                    ethers.concat([
                        '0x80', // direction
                        ethers.zeroPadValue(tokens.DAI.target, 31),
                        ethers.zeroPadValue(tokens.WETH.target, 32),
                        ethers.toBeHex(pools.WETH_DAI.fee, 32),
                        '0x00', // direction
                        ethers.zeroPadValue(tokens.USDC.target, 31),
                        ethers.zeroPadValue(tokens.WETH.target, 32),
                        ethers.toBeHex(pools.WETH_USDC.fee, 32),
                        '0x80', // direction
                        ethers.zeroPadValue(tokens.USDC.target, 31),
                        ethers.zeroPadValue(tokens.USDT.target, 32),
                        ethers.toBeHex(pools.USDT_USDC.fee, 32),
                    ]),
                ],
                0n,
                '0x',
            );
            gasUsedTable.addElementToRow(gasUsedTableRow, ProtocolKey.PARASWAP, (await tx.wait()).gasUsed);
        });
    });
});
