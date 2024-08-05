const { ethers } = require('hardhat');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');
const { ether, constants } = require('@1inch/solidity-utils');
const { ProtocolKey } = require('./helpers/utils');
const { initRouterContracts } = require('./helpers/fixtures');
const { createGasUsedTable } = require('./helpers/table');
const { UniswapV3Pools } = require('./helpers/pools');

describe('Router [UniV3]', async function () {
    const gasUsedTable = createGasUsedTable("UniswapV3 pools", "path");

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
                BigInt(UniswapV3Pools.WETH_DAI.address) | (1n << 253n),
                { value: amount },
            );
            gasUsedTable.addElementToRow(gasUsedTableRow, ProtocolKey.INCH, (await tx.wait()).gasUsed);
        });

        it('matcha', async function () {
            const { addr1, tokens, matcha, settings: { gasUsedTableRow, amount } } = await loadFixture(initRouterContractsWithCaseSettings);
            const tx = await matcha.sellEthForTokenToUniswapV3(
                ethers.concat([tokens.WETH.target, ethers.toBeHex(UniswapV3Pools.WETH_DAI.fee, 3), tokens.DAI.target]),
                '1',
                addr1.address,
                { value: amount },
            );
            gasUsedTable.addElementToRow(gasUsedTableRow, ProtocolKey.MATCHA, (await tx.wait()).gasUsed);
        });

        it('matcha2', async function () {
            const {addr1, tokens, matcha2, permitSignature, matcha2PermitData, settings: {gasUsedTableRow, amount } } = await loadFixture(initRouterContractsWithCaseSettings);


            
        })

        it('uniswap', async function () {
            const { addr1, tokens, uniswapv3, settings: { gasUsedTableRow, amount } } = await loadFixture(initRouterContractsWithCaseSettings);
            const tx = await uniswapv3.exactInputSingle([
                    tokens.WETH,
                    tokens.DAI,
                    UniswapV3Pools.WETH_DAI.fee,
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
                    UniswapV3Pools.WETH_DAI.fee,
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
                        ethers.toBeHex(UniswapV3Pools.WETH_DAI.fee, 32),
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
                BigInt(UniswapV3Pools.WETH_USDC.address) | (1n << 253n),
                BigInt(UniswapV3Pools.USDC_DAI.address) | (1n << 253n),
                { value: amount },
            );
            gasUsedTable.addElementToRow(gasUsedTableRow, ProtocolKey.INCH, (await tx.wait()).gasUsed);
        });

        it('matcha', async function () {
            const { addr1, tokens, matcha, settings: { gasUsedTableRow, amount } } = await loadFixture(initRouterContractsWithCaseSettings);
            const tx = await matcha.sellEthForTokenToUniswapV3(
                ethers.concat([
                    tokens.WETH.target, ethers.toBeHex(UniswapV3Pools.WETH_USDC.fee, 3),
                    tokens.USDC.target, ethers.toBeHex(UniswapV3Pools.USDC_DAI.fee, 3),
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
                        tokens.WETH.target, ethers.toBeHex(UniswapV3Pools.WETH_USDC.fee, 3),
                        tokens.USDC.target, ethers.toBeHex(UniswapV3Pools.USDC_DAI.fee, 3),
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
                        tokens.WETH.target, ethers.toBeHex(UniswapV3Pools.WETH_USDC.fee, 3),
                        tokens.USDC.target, ethers.toBeHex(UniswapV3Pools.USDC_DAI.fee, 3),
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
                        ethers.toBeHex(UniswapV3Pools.WETH_USDC.fee, 32),
                        '0x00', // direction
                        ethers.zeroPadValue(tokens.DAI.target, 31),
                        ethers.zeroPadValue(tokens.USDC.target, 32),
                        ethers.toBeHex(UniswapV3Pools.USDC_DAI.fee, 32),
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
                BigInt(UniswapV3Pools.WETH_DAI.address) | (1n << 253n) | (1n << 252n) | (1n << 247n),
            );
            gasUsedTable.addElementToRow(gasUsedTableRow, ProtocolKey.INCH, (await tx.wait()).gasUsed);
        });

        it('matcha', async function () {
            const { addr1, tokens, matcha, settings: { gasUsedTableRow, amount } } = await loadFixture(initRouterContractsWithCaseSettings);
            const tx = await matcha.sellTokenForEthToUniswapV3(
                ethers.concat([tokens.DAI.target, ethers.toBeHex(UniswapV3Pools.WETH_DAI.fee, 3), tokens.WETH.target]),
                amount,
                '1',
                addr1.address,
            );
            gasUsedTable.addElementToRow(gasUsedTableRow, ProtocolKey.MATCHA, (await tx.wait()).gasUsed);
        });

        it('matcha2', async function () {
            const { addr1, tokens, matcha2, settlerActionsABI, matcha2PermitData, permitSignature, settings: { gasUsedTableRow, amount } } = await loadFixture(initRouterContractsWithCaseSettings);            

            const iface = new ethers.Interface(JSON.stringify(settlerActionsABI));

            const encodedUniswapV3VIP = iface.encodeFunctionData('UNISWAPV3_VIP', [
                addr1.address,
                '0x128acb08' + ethers.AbiCoder.defaultAbiCoder().encode([
                    'address', // recipient
                    'bool', // zeroForOne
                    'int256', // amount specified
                    'uint160', // sqrtPriceLimitX96
                    'bytes', // data
                ], [matcha2.target, false, amount, false ? 4295128740n : 1461446703485210103287273052203988822378723970341n, '0x00'])
                    .slice(2),
                matcha2PermitData.values,
                permitSignature,
                0n
            ])

            const tx = await matcha2.execute(
                {recipient: '0x0000000000000000000000000000000000000000', buyToken: '0x0000000000000000000000000000000000000000', minAmountOut: '0x00'},
                [encodedUniswapV3VIP],
                '0x0000000000000000000000000000000000000000000000000000000000000000',

            )

            console.log('Gas used:', (await tx.wait()).gasUsed.toString());


        })

        it('uniswap', async function () {
            const { addr1, tokens, uniswapv3, settings: { gasUsedTableRow, amount } } = await loadFixture(initRouterContractsWithCaseSettings);
            const swapData = uniswapv3.interface.encodeFunctionData('exactInputSingle', [[
                await tokens.DAI.getAddress(),
                await tokens.WETH.getAddress(),
                UniswapV3Pools.WETH_DAI.fee,
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
                UniswapV3Pools.WETH_DAI.fee,
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
                        ethers.toBeHex(UniswapV3Pools.WETH_DAI.fee, 32),
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
                BigInt(UniswapV3Pools.WETH_DAI.address) | (1n << 253n) | (1n << 247n),
            );
            gasUsedTable.addElementToRow(gasUsedTableRow, ProtocolKey.INCH, (await tx.wait()).gasUsed);
        });

        it('matcha', async function () {
            const { addr1, tokens, matcha, settings: { gasUsedTableRow, amount } } = await loadFixture(initRouterContractsWithCaseSettings);
            const tx = await matcha.sellTokenForTokenToUniswapV3(
                ethers.concat([tokens.DAI.target, ethers.toBeHex(UniswapV3Pools.WETH_DAI.fee, 3), tokens.WETH.target]),
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
                UniswapV3Pools.WETH_DAI.fee,
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
                UniswapV3Pools.WETH_DAI.fee,
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
                        ethers.toBeHex(UniswapV3Pools.WETH_DAI.fee, 32),
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
                BigInt(UniswapV3Pools.WETH_DAI.address) | (1n << 253n) | (1n << 247n),
                BigInt(UniswapV3Pools.WETH_USDC.address) | (1n << 253n),
            );
            gasUsedTable.addElementToRow(gasUsedTableRow, ProtocolKey.INCH, (await tx.wait()).gasUsed);
        });

        it('matcha', async function () {
            const { addr1, tokens, matcha, settings: { gasUsedTableRow, amount } } = await loadFixture(initRouterContractsWithCaseSettings);
            const tx = await matcha.sellTokenForTokenToUniswapV3(
                ethers.concat([
                    tokens.DAI.target, ethers.toBeHex(UniswapV3Pools.WETH_DAI.fee, 3),
                    tokens.WETH.target, ethers.toBeHex(UniswapV3Pools.WETH_USDC.fee, 3),
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
                    tokens.DAI.target, ethers.toBeHex(UniswapV3Pools.WETH_DAI.fee, 3),
                    tokens.WETH.target, ethers.toBeHex(UniswapV3Pools.WETH_USDC.fee, 3),
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
                    tokens.DAI.target, ethers.toBeHex(UniswapV3Pools.WETH_DAI.fee, 3),
                    tokens.WETH.target, ethers.toBeHex(UniswapV3Pools.WETH_USDC.fee, 3),
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
                        ethers.toBeHex(UniswapV3Pools.WETH_DAI.fee, 32),
                        '0x00', // direction
                        ethers.zeroPadValue(tokens.USDC.target, 31),
                        ethers.zeroPadValue(tokens.WETH.target, 32),
                        ethers.toBeHex(UniswapV3Pools.WETH_USDC.fee, 32),
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
                BigInt(UniswapV3Pools.WETH_DAI.address) | (1n << 253n) | (1n << 247n),
                BigInt(UniswapV3Pools.WETH_USDC.address) | (1n << 253n),
                BigInt(UniswapV3Pools.USDT_USDC.address) | (1n << 253n) | (1n << 247n),
            );
            gasUsedTable.addElementToRow(gasUsedTableRow, ProtocolKey.INCH, (await tx.wait()).gasUsed);
        });

        it('matcha', async function () {
            const { addr1, tokens, matcha, settings: { gasUsedTableRow, amount } } = await loadFixture(initRouterContractsWithCaseSettings);
            const tx = await matcha.sellTokenForTokenToUniswapV3(
                ethers.concat([
                    tokens.DAI.target, ethers.toBeHex(UniswapV3Pools.WETH_DAI.fee, 3),
                    tokens.WETH.target, ethers.toBeHex(UniswapV3Pools.WETH_USDC.fee, 3),
                    tokens.USDC.target, ethers.toBeHex(UniswapV3Pools.USDT_USDC.fee, 3),
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
                    tokens.DAI.target, ethers.toBeHex(UniswapV3Pools.WETH_DAI.fee, 3),
                    tokens.WETH.target, ethers.toBeHex(UniswapV3Pools.WETH_USDC.fee, 3),
                    tokens.USDC.target, ethers.toBeHex(UniswapV3Pools.USDT_USDC.fee, 3),
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
                    tokens.DAI.target, ethers.toBeHex(UniswapV3Pools.WETH_DAI.fee, 3),
                    tokens.WETH.target, ethers.toBeHex(UniswapV3Pools.WETH_USDC.fee, 3),
                    tokens.USDC.target, ethers.toBeHex(UniswapV3Pools.USDT_USDC.fee, 3),
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
                        ethers.toBeHex(UniswapV3Pools.WETH_DAI.fee, 32),
                        '0x00', // direction
                        ethers.zeroPadValue(tokens.USDC.target, 31),
                        ethers.zeroPadValue(tokens.WETH.target, 32),
                        ethers.toBeHex(UniswapV3Pools.WETH_USDC.fee, 32),
                        '0x80', // direction
                        ethers.zeroPadValue(tokens.USDC.target, 31),
                        ethers.zeroPadValue(tokens.USDT.target, 32),
                        ethers.toBeHex(UniswapV3Pools.USDT_USDC.fee, 32),
                    ]),
                ],
                0n,
                '0x',
            );
            gasUsedTable.addElementToRow(gasUsedTableRow, ProtocolKey.PARASWAP, (await tx.wait()).gasUsed);
        });
    });
});
