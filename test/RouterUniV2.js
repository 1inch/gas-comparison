const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');
const { ether, trim0x, constants } = require('@1inch/solidity-utils');
const { ProtocolKey, paraswapUniV2PoolData, getPermit2Data } = require('./helpers/utils');
const { initRouterContracts } = require('./helpers/fixtures');
const { createGasUsedTable } = require('./helpers/table');
const { UniswapV2Pools } = require('./helpers/pools');
const { RoutePlanner, CommandType } = require('@uniswap/universal-router-sdk');

describe('Router [UniV2]', async function () {
    const amount = ether('0.001');

    describe('Allowances', async function () {
        const gasUsedTable = createGasUsedTable('UniswapV2 pools', 'path');

        after(async function () {
            console.log(gasUsedTable.toString());
        });

        describe('ETH => DAI', async function () {
            const gasUsedTableRow = gasUsedTable.addRow(['ETH => DAI']);

            it('1inch', async function () {
                const { addr1, inch } = await loadFixture(initRouterContracts);
                const tx = await inch.ethUnoswapTo(addr1.address, '1', UniswapV2Pools.WETH_DAI, { value: amount });
                gasUsedTable.addElementToRow(gasUsedTableRow, ProtocolKey.INCH, (await tx.wait()).gasUsed);
            });

            it('matcha', async function () {
                const { tokens, matcha } = await loadFixture(initRouterContracts);
                const tx = await matcha.sellToUniswap([tokens.EEE, tokens.DAI], amount, '1', false, { value: amount });
                gasUsedTable.addElementToRow(gasUsedTableRow, ProtocolKey.MATCHA, (await tx.wait()).gasUsed);
            });

            it('settler', async function () {
                const { addr1, tokens, settler, iSettlerActions } = await loadFixture(initRouterContracts);

                // For some reason settler doesn't have a built in way to wrap ETH so their web app uses
                // the BASIC function. See https://www.tdly.co/shared/simulation/08e0f052-d2c0-4890-ba0b-440f20fb0ee9
                const encodedWrapETHfunction = iSettlerActions.encodeFunctionData('BASIC', [
                    await tokens.EEE.getAddress(),
                    10000n, // bps
                    tokens.WETH.target, // pool
                    4n, // offset
                    tokens.WETH.interface.getFunction('deposit').selector + trim0x(constants.ZERO_BYTES32), // tx data
                ]);

                const encodedUniswapV2FunctionData = iSettlerActions.encodeFunctionData('UNISWAPV2', [
                    addr1.address, // recipient,
                    tokens.WETH.target,
                    10000n,
                    UniswapV2Pools.WETH_DAI,
                    0x1e00n, // uint24 swapInfo, lowest 2 bits are FoT and zeroForOne, the highest bits are the pool fee in bps
                    0n, // amountOutMin
                ]);

                // Attempt to execute the transaction
                const tx = await settler.execute(
                    { recipient: constants.ZERO_ADDRESS, buyToken: constants.ZERO_ADDRESS, minAmountOut: '0x00' },
                    [encodedWrapETHfunction, encodedUniswapV2FunctionData],
                    constants.ZERO_BYTES32,
                    { value: amount },
                );

                gasUsedTable.addElementToRow(gasUsedTableRow, ProtocolKey.SETTLER, (await tx.wait()).gasUsed);
            });

            it('uniswap universal router', async function () {
                const { addr1, tokens, uniswapUniversal } = await loadFixture(initRouterContracts);

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

                const tx = await uniswapUniversal['execute(bytes,bytes[])'](commands, inputs, { value: amount });

                gasUsedTable.addElementToRow(gasUsedTableRow, ProtocolKey.UNISWAP_UNIVERSAL, (await tx.wait()).gasUsed);
            });

            it('uniswap v2 router', async function () {
                const { addr1, tokens, uniswapv2 } = await loadFixture(initRouterContracts);
                const tx = await uniswapv2.swapExactETHForTokens(amount, [tokens.WETH, tokens.DAI], addr1.address, '0xffffffffff', { value: amount });
                gasUsedTable.addElementToRow(gasUsedTableRow, ProtocolKey.UNISWAP_V2, (await tx.wait()).gasUsed);
            });

            it('paraswap', async function () {
                const { addr1, tokens, uniswapv2, paraswap } = await loadFixture(initRouterContracts);
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
            const gasUsedTableRow = gasUsedTable.addRow(['ETH => USDC => DAI']);

            it('1inch', async function () {
                const { addr1, inch } = await loadFixture(initRouterContracts);
                const tx = await inch.ethUnoswapTo2(addr1.address, '1', UniswapV2Pools.WETH_USDC, UniswapV2Pools.USDC_DAI, { value: amount });
                gasUsedTable.addElementToRow(gasUsedTableRow, ProtocolKey.INCH, (await tx.wait()).gasUsed);
            });

            it('matcha', async function () {
                const { tokens, matcha } = await loadFixture(initRouterContracts);
                const tx = await matcha.sellToUniswap([tokens.EEE, tokens.USDC, tokens.DAI], amount, '1', false, { value: amount });
                gasUsedTable.addElementToRow(gasUsedTableRow, ProtocolKey.MATCHA, (await tx.wait()).gasUsed);
            });

            it('settler', async function () {
                const { addr1, tokens, settler, iSettlerActions } = await loadFixture(initRouterContracts);

                const encodedBasicFunctionData = iSettlerActions.encodeFunctionData('BASIC', [
                    await tokens.EEE.getAddress(),
                    10000n, // bps
                    tokens.WETH.target, // pool
                    4n, // offset
                    tokens.WETH.interface.getFunction('deposit').selector + trim0x(constants.ZERO_BYTES32), // tx data
                ]);

                const encodedUniswapV2FunctionDataWETHtoUSDC = iSettlerActions.encodeFunctionData('UNISWAPV2', [
                    UniswapV2Pools.USDC_DAI, // gas savings to direct output to next pool
                    tokens.WETH.target,
                    10000n,
                    UniswapV2Pools.WETH_USDC,
                    0x1e00n,
                    0n,
                ]);

                const encodedUniswapV2FunctionDataUSDCtoDAI = iSettlerActions.encodeFunctionData('UNISWAPV2', [
                    addr1.address, // recipient,
                    tokens.USDC.target,
                    0n,
                    UniswapV2Pools.USDC_DAI,
                    0x1e00n, // uint24 swapInfo, lowest 2 bits are FoT and zeroForOne, the highest bits are the pool fee in bps
                    0n, // amountOutMin
                ]);

                const tx = await settler.execute(
                    { recipient: constants.ZERO_ADDRESS, buyToken: constants.ZERO_ADDRESS, minAmountOut: '0x00' },
                    [encodedBasicFunctionData, encodedUniswapV2FunctionDataWETHtoUSDC, encodedUniswapV2FunctionDataUSDCtoDAI],
                    constants.ZERO_BYTES32,
                    { value: amount },
                );

                gasUsedTable.addElementToRow(gasUsedTableRow, ProtocolKey.SETTLER, (await tx.wait()).gasUsed);
            });

            it('uniswap universal router', async function () {
                const { addr1, tokens, uniswapUniversal } = await loadFixture(initRouterContracts);

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

                const tx = await uniswapUniversal['execute(bytes,bytes[])'](commands, inputs, { value: amount });
                gasUsedTable.addElementToRow(gasUsedTableRow, ProtocolKey.UNISWAP_UNIVERSAL, (await tx.wait()).gasUsed);
            });

            it('uniswap v2 router', async function () {
                const { addr1, tokens, uniswapv2 } = await loadFixture(initRouterContracts);
                const tx = await uniswapv2.swapExactETHForTokens(amount, [tokens.WETH, tokens.USDC, tokens.DAI], addr1.address, '0xffffffffff', { value: amount });
                gasUsedTable.addElementToRow(gasUsedTableRow, ProtocolKey.UNISWAP_V2, (await tx.wait()).gasUsed);
            });

            it('paraswap', async function () {
                const { addr1, tokens, uniswapv2, paraswap } = await loadFixture(initRouterContracts);
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
            const gasUsedTableRow = gasUsedTable.addRow(['DAI => ETH']);

            it('1inch', async function () {
                const { addr1, tokens, inch } = await loadFixture(initRouterContracts);
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
                const { tokens, matcha } = await loadFixture(initRouterContracts);
                const tx = await matcha.sellToUniswap([tokens.DAI, tokens.EEE], amount, '1', false);
                gasUsedTable.addElementToRow(gasUsedTableRow, ProtocolKey.MATCHA, (await tx.wait()).gasUsed);
            });

            it('uniswap universal router', async function () {
                const { addr1, tokens, uniswapUniversal } = await loadFixture(initRouterContracts);

                const planner = new RoutePlanner();

                planner.addCommand(CommandType.V2_SWAP_EXACT_IN, [addr1.address, amount, 1, [tokens.DAI.target, tokens.WETH.target], true]);

                planner.addCommand(CommandType.UNWRAP_WETH, [addr1.address, 0]);

                const { commands, inputs } = planner;

                const tx = await uniswapUniversal['execute(bytes,bytes[])'](commands, inputs);

                gasUsedTable.addElementToRow(gasUsedTableRow, ProtocolKey.UNISWAP_UNIVERSAL, (await tx.wait()).gasUsed);
            });

            it('uniswap v2 router', async function () {
                const { addr1, tokens, uniswapv2 } = await loadFixture(initRouterContracts);
                const tx = await uniswapv2.swapExactTokensForETH(amount, '1', [tokens.DAI, tokens.WETH], addr1.address, '0xffffffffff');
                gasUsedTable.addElementToRow(gasUsedTableRow, ProtocolKey.UNISWAP_V2, (await tx.wait()).gasUsed);
            });

            it('paraswap', async function () {
                const { addr1, tokens, uniswapv2, paraswap } = await loadFixture(initRouterContracts);
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
            const gasUsedTableRow = gasUsedTable.addRow(['DAI => WETH']);

            it('1inch', async function () {
                const { addr1, tokens, inch } = await loadFixture(initRouterContracts);
                const tx = await inch.unoswapTo(addr1.address, await tokens.DAI.getAddress(), amount, '1', BigInt(UniswapV2Pools.WETH_DAI) | (1n << 247n));
                gasUsedTable.addElementToRow(gasUsedTableRow, ProtocolKey.INCH, (await tx.wait()).gasUsed);
            });

            it('matcha', async function () {
                const { tokens, matcha } = await loadFixture(initRouterContracts);
                const tx = await matcha.sellToUniswap([tokens.DAI, tokens.WETH], amount, '1', false);
                gasUsedTable.addElementToRow(gasUsedTableRow, ProtocolKey.MATCHA, (await tx.wait()).gasUsed);
            });

            it('uniswap universal router', async function () {
                const { addr1, tokens, uniswapUniversal } = await loadFixture(initRouterContracts);

                const planner = new RoutePlanner();

                planner.addCommand(CommandType.V2_SWAP_EXACT_IN, [addr1.address, amount, 1, [tokens.DAI.target, tokens.WETH.target], true]);

                const { commands, inputs } = planner;

                const tx = await uniswapUniversal['execute(bytes,bytes[])'](commands, inputs);

                gasUsedTable.addElementToRow(gasUsedTableRow, ProtocolKey.UNISWAP_UNIVERSAL, (await tx.wait()).gasUsed);
            });

            it('uniswap v2 router', async function () {
                const { addr1, tokens, uniswapv2 } = await loadFixture(initRouterContracts);
                const tx = await uniswapv2.swapExactTokensForTokens(amount, '1', [tokens.DAI, tokens.WETH], addr1.address, '0xffffffffff');
                gasUsedTable.addElementToRow(gasUsedTableRow, ProtocolKey.UNISWAP_V2, (await tx.wait()).gasUsed);
            });

            it('paraswap', async function () {
                const { addr1, tokens, uniswapv2, paraswap } = await loadFixture(initRouterContracts);
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
            const gasUsedTableRow = gasUsedTable.addRow(['DAI => WETH => USDC']);

            it('1inch', async function () {
                const { addr1, tokens, inch } = await loadFixture(initRouterContracts);
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
                const { tokens, matcha } = await loadFixture(initRouterContracts);
                const tx = await matcha.sellToUniswap([tokens.DAI, tokens.WETH, tokens.USDC], amount, '1', false);
                gasUsedTable.addElementToRow(gasUsedTableRow, ProtocolKey.MATCHA, (await tx.wait()).gasUsed);
            });

            it('uniswap universal router', async function () {
                const { addr1, tokens, uniswapUniversal } = await loadFixture(initRouterContracts);

                const planner = new RoutePlanner();

                planner.addCommand(CommandType.V2_SWAP_EXACT_IN, [addr1.address, amount, 1, [tokens.DAI.target, tokens.WETH.target, tokens.USDC.target], true]);

                const { commands, inputs } = planner;

                const tx = await uniswapUniversal['execute(bytes,bytes[])'](commands, inputs);

                gasUsedTable.addElementToRow(gasUsedTableRow, ProtocolKey.UNISWAP_UNIVERSAL, (await tx.wait()).gasUsed);
            });

            it('uniswap v2 router', async function () {
                const { addr1, tokens, uniswapv2 } = await loadFixture(initRouterContracts);
                const tx = await uniswapv2.swapExactTokensForTokens(amount, '1', [tokens.DAI, tokens.WETH, tokens.USDC], addr1.address, '0xffffffffff');
                gasUsedTable.addElementToRow(gasUsedTableRow, ProtocolKey.UNISWAP_V2, (await tx.wait()).gasUsed);
            });

            it('paraswap', async function () {
                const { addr1, tokens, uniswapv2, paraswap } = await loadFixture(initRouterContracts);
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
            const gasUsedTableRow = gasUsedTable.addRow(['DAI => WETH => USDC => USDT']);

            it('1inch', async function () {
                const { addr1, tokens, inch } = await loadFixture(initRouterContracts);
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
                const { tokens, matcha } = await loadFixture(initRouterContracts);
                const tx = await matcha.sellToUniswap([tokens.DAI, tokens.WETH, tokens.USDC, tokens.USDT], amount, '1', false);
                gasUsedTable.addElementToRow(gasUsedTableRow, ProtocolKey.MATCHA, (await tx.wait()).gasUsed);
            });

            it('uniswap universal router', async function () {
                const { addr1, tokens, uniswapUniversal } = await loadFixture(initRouterContracts);

                const planner = new RoutePlanner();

                planner.addCommand(CommandType.V2_SWAP_EXACT_IN, [
                    addr1.address,
                    amount,
                    1,
                    [tokens.DAI.target, tokens.WETH.target, tokens.USDC.target, tokens.USDT.target],
                    true,
                ]);

                const { commands, inputs } = planner;

                const tx = await uniswapUniversal['execute(bytes,bytes[])'](commands, inputs);

                gasUsedTable.addElementToRow(gasUsedTableRow, ProtocolKey.UNISWAP_UNIVERSAL, (await tx.wait()).gasUsed);
            });

            it('uniswap v2 router', async function () {
                const { addr1, tokens, uniswapv2 } = await loadFixture(initRouterContracts);
                const tx = await uniswapv2.swapExactTokensForTokens(
                    amount,
                    '1',
                    [tokens.DAI, tokens.WETH, tokens.USDC, tokens.USDT],
                    addr1.address,
                    '0xffffffffff',
                );
                gasUsedTable.addElementToRow(gasUsedTableRow, ProtocolKey.UNISWAP_V2, (await tx.wait()).gasUsed);
            });

            it('paraswap', async function () {
                const { addr1, tokens, uniswapv2, paraswap } = await loadFixture(initRouterContracts);
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

    describe('Permit2', async function () {
        const gasUsedTable = createGasUsedTable('UniswapV2 pools (Permit2)', 'path');

        after(async function () {
            console.log(gasUsedTable.toString());
        });

        describe('DAI => ETH', async function () {
            const gasUsedTableRow = gasUsedTable.addRow(['DAI => ETH']);

            it('settler', async function () {
                const { addr1, tokens, settler, iSettlerActions } = await loadFixture(initRouterContracts);

                const { permit2Data, permitSignature } = await getPermit2Data({ token: tokens.DAI.target, spender: settler.target, signer: addr1 });

                const encodedTransferFrom = iSettlerActions.encodeFunctionData('TRANSFER_FROM', [settler.target, permit2Data.values, permitSignature]);

                const encodedUniswapV2FunctionDataDAItoWETH = iSettlerActions.encodeFunctionData('UNISWAPV2', [
                    settler.target, // since we'll need to unwrap it
                    tokens.DAI.target, // sell token
                    10000n, // bps
                    UniswapV2Pools.WETH_DAI, // pool
                    0x1e01n, // swapInfo
                    0n, // amountOutMin
                ]);

                const encodedBasicFunctionData = iSettlerActions.encodeFunctionData('BASIC', [
                    tokens.WETH.target,
                    10000n, // bps
                    tokens.WETH.target, // pool
                    4n, // offset
                    tokens.WETH.interface.getFunction('withdraw').selector + trim0x(constants.ZERO_BYTES32),
                ]);

                const tx = await settler.execute(
                    { recipient: addr1.address, buyToken: await tokens.EEE.getAddress(), minAmountOut: '0x00' },
                    [encodedTransferFrom, encodedUniswapV2FunctionDataDAItoWETH, encodedBasicFunctionData],
                    constants.ZERO_BYTES32,
                );

                gasUsedTable.addElementToRow(gasUsedTableRow, ProtocolKey.SETTLER, (await tx.wait()).gasUsed);
            });
        });

        describe('DAI => WETH', async function () {
            const gasUsedTableRow = gasUsedTable.addRow(['DAI => WETH']);

            it('settler', async function () {
                const { addr1, tokens, settler, iSettlerActions } = await loadFixture(initRouterContracts);

                const { permit2Data, permitSignature } = await getPermit2Data({ token: tokens.DAI.target, spender: settler.target, signer: addr1 });

                const encodedTransferFrom = iSettlerActions.encodeFunctionData('TRANSFER_FROM', [settler.target, permit2Data.values, permitSignature]);

                const encodedUniswapV2FunctionDataDAItoWETH = iSettlerActions.encodeFunctionData('UNISWAPV2', [
                    addr1.address, // recipient
                    tokens.DAI.target, // sell token
                    10000n, // bps
                    UniswapV2Pools.WETH_DAI, // pool
                    0x1e01n, // swapInfo
                    0n, // amountOutMin
                ]);

                const tx = await settler.execute(
                    { recipient: constants.ZERO_ADDRESS, buyToken: constants.ZERO_ADDRESS, minAmountOut: '0x00' },
                    [encodedTransferFrom, encodedUniswapV2FunctionDataDAItoWETH],
                    constants.ZERO_BYTES32,
                );

                gasUsedTable.addElementToRow(gasUsedTableRow, ProtocolKey.SETTLER, (await tx.wait()).gasUsed);
            });
        });

        describe('DAI => WETH => USDC', async function () {
            const gasUsedTableRow = gasUsedTable.addRow(['DAI => WETH => USDC']);

            it('settler', async function () {
                const { addr1, tokens, settler, iSettlerActions } = await loadFixture(initRouterContracts);

                const { permit2Data, permitSignature } = await getPermit2Data({ token: tokens.DAI.target, spender: settler.target, signer: addr1 });

                const encodedTransferFrom = iSettlerActions.encodeFunctionData('TRANSFER_FROM', [settler.target, permit2Data.values, permitSignature]);

                const UniswapV2FunctionDataDAItoWETH = iSettlerActions.encodeFunctionData('UNISWAPV2', [
                    UniswapV2Pools.WETH_USDC,
                    tokens.DAI.target, // sell token
                    10000n, // bps
                    UniswapV2Pools.WETH_DAI, // pool
                    0x1e01n, // swapInfo
                    0n, // amountOutMin
                ]);

                const UniswapV2FunctionDataWETHtoUSDC = iSettlerActions.encodeFunctionData('UNISWAPV2', [
                    addr1.address,
                    tokens.WETH.target,
                    0n,
                    UniswapV2Pools.WETH_USDC,
                    0x1e00,
                    0n,
                ]);

                const tx = await settler.execute(
                    { recipient: constants.ZERO_ADDRESS, buyToken: constants.ZERO_ADDRESS, minAmountOut: '0x00' },
                    [encodedTransferFrom, UniswapV2FunctionDataDAItoWETH, UniswapV2FunctionDataWETHtoUSDC],
                    constants.ZERO_BYTES32,
                );

                gasUsedTable.addElementToRow(gasUsedTableRow, ProtocolKey.SETTLER, (await tx.wait()).gasUsed);
            });
        });

        describe('DAI => WETH => USDC => USDT', async function () {
            const gasUsedTableRow = gasUsedTable.addRow(['DAI => WETH => USDC => USDT']);

            it('settler', async function () {
                const { addr1, tokens, settler, iSettlerActions } = await loadFixture(initRouterContracts);

                const { permit2Data, permitSignature } = await getPermit2Data({ token: tokens.DAI.target, spender: settler.target, signer: addr1 });

                const encodedTransferFrom = iSettlerActions.encodeFunctionData('TRANSFER_FROM', [settler.target, permit2Data.values, permitSignature]);

                const UniswapV2FunctionDataDAItoWETH = iSettlerActions.encodeFunctionData('UNISWAPV2', [
                    UniswapV2Pools.WETH_USDC,
                    tokens.DAI.target, // sell token
                    10000n, // bps
                    UniswapV2Pools.WETH_DAI, // pool
                    0x1e01n, // swapInfo
                    0n, // amountOutMin
                ]);

                const UniswapV2FunctionDataWETHtoUSDC = iSettlerActions.encodeFunctionData('UNISWAPV2', [
                    UniswapV2Pools.USDC_USDT,
                    tokens.WETH.target,
                    0n,
                    UniswapV2Pools.WETH_USDC,
                    0x1e00n,
                    0n,
                ]);

                const UniswapV2FunctionDataUSDCtoUSDT = iSettlerActions.encodeFunctionData('UNISWAPV2', [
                    addr1.address,
                    tokens.USDC.target,
                    0n,
                    UniswapV2Pools.USDC_USDT,
                    0x1e01n,
                    0n,
                ]);

                const tx = await settler.execute(
                    { recipient: constants.ZERO_ADDRESS, buyToken: constants.ZERO_ADDRESS, minAmountOut: '0x00' },
                    [encodedTransferFrom, UniswapV2FunctionDataDAItoWETH, UniswapV2FunctionDataWETHtoUSDC, UniswapV2FunctionDataUSDCtoUSDT],
                    constants.ZERO_BYTES32,
                );

                gasUsedTable.addElementToRow(gasUsedTableRow, ProtocolKey.SETTLER, (await tx.wait()).gasUsed);
            });
        });
    });
});
