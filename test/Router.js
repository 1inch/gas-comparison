const hre = require('hardhat');
const { ethers } = hre;
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');
const { ether, constants, getEthPrice } = require('@1inch/solidity-utils');
const { ProtocolKey, paraswapUniV2PoolData, percentageOf } = require('./helpers/utils');

describe('Router', async function () {
    const gasUsed = {};

    after(async function () {
        console.table(gasUsed);
    });

    async function initContracts () {
        const [addr1] = await ethers.getSigners();

        const inch = await ethers.getContractAt('IAggregationRouter', '0x111111125421ca6dc452d289314280a0f8842a65');
        const matcha = await ethers.getContractAt('IMatchaRouter', '0xdef1c0ded9bec7f1a1670819833240f027b25eff');
        const uniswap = await ethers.getContractAt('IUniswapV2Router', '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D');
        const paraswap = await ethers.getContractAt('IParaswapRouter', '0x000dB803A70511E09dA650D4C0506d0000100000');

        const tokens = {
            ETH: {
                async getAddress () { return constants.ZERO_ADDRESS; },
            },
            EEE: {
                async getAddress () { return '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'; },
            },
            WETH: await ethers.getContractAt('IWETH', '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'),
            DAI: await ethers.getContractAt('IERC20', '0x6B175474E89094C44Da98b954EedeAC495271d0F'),
            USDC: await ethers.getContractAt('IERC20', '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'),
            USDT: await ethers.getContractAt('IERC20', '0xdAC17F958D2ee523a2206206994597C13D831ec7'),
        };

        await tokens.DAI.approve(inch, ether('1'));
        await tokens.DAI.approve(matcha, ether('1'));
        await tokens.DAI.approve(uniswap, ether('1'));
        await tokens.DAI.approve(paraswap, ether('1'));

        // Buy some tokens for warmup address and exchanges
        await addr1.sendTransaction({ to: '0x2a1530c4c41db0b0b2bb646cb5eb1a67b7158667', value: ether('1') }); // DAI
        await addr1.sendTransaction({ to: '0x97deC872013f6B5fB443861090ad931542878126', value: ether('1') }); // USDC
        await uniswap.swapExactETHForTokens(
            ether('0'),
            [tokens.WETH, tokens.USDT],
            addr1,
            ether('1'),
            { value: ether('1') },
        ); // USDT
        await tokens.WETH.deposit({ value: ether('1') }); // WETH

        const ethPrice = await getEthPrice();

        return { addr1, tokens, inch, matcha, paraswap, uniswap, ethPrice };
    }

    describe('UniV2', async function () {
        describe('ETH => DAI', async function () {
            async function initContractsWithCaseSettings () {
                const fixtureData = await initContracts();

                const GAS_USED_KEY = 'ETH => DAI';
                gasUsed[GAS_USED_KEY] = gasUsed[GAS_USED_KEY] || {};

                return {
                    ...fixtureData,
                    settings: {
                        GAS_USED_KEY,
                        amount: ether('1'),
                    },
                };
            }

            it('1inch', async function () {
                const { addr1, inch, settings: { GAS_USED_KEY, amount } } = await loadFixture(initContractsWithCaseSettings);
                const tx = await inch.ethUnoswapTo(
                    addr1.address,
                    '1',
                    '0xa478c2975ab1ea89e8196811f51a7b7ade33eb11',
                    { value: amount },
                );
                gasUsed[GAS_USED_KEY][ProtocolKey.INCH] = (await tx.wait()).gasUsed.toString();
            });

            it('matcha', async function () {
                const { tokens, matcha, settings: { GAS_USED_KEY, amount } } = await loadFixture(initContractsWithCaseSettings);
                const tx = await matcha.sellToUniswap(
                    [tokens.EEE, tokens.DAI],
                    amount,
                    '1',
                    false,
                    { value: amount },
                );
                gasUsed[GAS_USED_KEY][ProtocolKey.MATCHA] = (await tx.wait()).gasUsed.toString();
            });

            it('uniswap', async function () {
                const { addr1, tokens, uniswap, settings: { GAS_USED_KEY, amount } } = await loadFixture(initContractsWithCaseSettings);
                const tx = await uniswap.swapExactETHForTokens(
                    amount,
                    [tokens.WETH, tokens.DAI],
                    addr1.address,
                    '0xffffffffff',
                    { value: amount },
                );
                gasUsed[GAS_USED_KEY][ProtocolKey.UNISWAP] = (await tx.wait()).gasUsed.toString();
            });

            it('paraswap', async function () {
                const { tokens, paraswap, ethPrice, settings: { GAS_USED_KEY, amount } } = await loadFixture(initContractsWithCaseSettings);
                const tx = await paraswap.swapExactAmountInOnUniswapV2([
                        tokens.EEE,
                        tokens.DAI,
                        amount,
                        percentageOf(amount * ethPrice / BigInt(1e18), 95),
                        percentageOf(amount * ethPrice / BigInt(1e18), 95),
                        constants.ZERO_BYTES32,
                        constants.ZERO_ADDRESS,
                        paraswapUniV2PoolData([[tokens.WETH.target, tokens.DAI.target]]),
                    ],
                    0n,
                    '0x',
                    { value: amount },
                );
                gasUsed[GAS_USED_KEY][ProtocolKey.PARASWAP] = (await tx.wait()).gasUsed.toString();
            });
        });

        describe('ETH => USDC => DAI', async function () {
            async function initContractsWithCaseSettings () {
                const fixtureData = await initContracts();

                const GAS_USED_KEY = 'ETH => USDC => DAI';
                gasUsed[GAS_USED_KEY] = gasUsed[GAS_USED_KEY] || {};

                return {
                    ...fixtureData,
                    settings: {
                        GAS_USED_KEY,
                        amount: ether('1'),
                    },
                };
            }

            it('1inch', async function () {
                const { addr1, inch, settings: { GAS_USED_KEY, amount } } = await loadFixture(initContractsWithCaseSettings);
                const tx = await inch.ethUnoswapTo2(
                    addr1.address,
                    '1',
                    '0xb4e16d0168e52d35cacd2c6185b44281ec28c9dc',
                    '0xae461ca67b15dc8dc81ce7615e0320da1a9ab8d5',
                    { value: amount },
                );
                gasUsed[GAS_USED_KEY][ProtocolKey.INCH] = (await tx.wait()).gasUsed.toString();
            });

            it('matcha', async function () {
                const { tokens, matcha, settings: { GAS_USED_KEY, amount } } = await loadFixture(initContractsWithCaseSettings);
                const tx = await matcha.sellToUniswap(
                    [tokens.EEE, tokens.USDC, tokens.DAI],
                    amount,
                    '1',
                    false,
                    { value: amount },
                );
                gasUsed[GAS_USED_KEY][ProtocolKey.MATCHA] = (await tx.wait()).gasUsed.toString();
            });

            it('uniswap', async function () {
                const { addr1, tokens, uniswap, settings: { GAS_USED_KEY, amount } } = await loadFixture(initContractsWithCaseSettings);
                const tx = await uniswap.swapExactETHForTokens(
                    amount,
                    [tokens.WETH, tokens.USDC, tokens.DAI],
                    addr1.address,
                    '0xffffffffff',
                    { value: amount },
                );
                gasUsed[GAS_USED_KEY][ProtocolKey.UNISWAP] = (await tx.wait()).gasUsed.toString();
            });

            it('paraswap', async function () {
                const { tokens, paraswap, ethPrice, settings: { GAS_USED_KEY, amount } } = await loadFixture(initContractsWithCaseSettings);
                const tx = await paraswap.swapExactAmountInOnUniswapV2([
                        tokens.EEE,
                        tokens.DAI,
                        amount,
                        percentageOf(amount * ethPrice / BigInt(1e18), 95),
                        percentageOf(amount * ethPrice / BigInt(1e18), 95),
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
                gasUsed[GAS_USED_KEY][ProtocolKey.PARASWAP] = (await tx.wait()).gasUsed.toString();
            });
        });

        describe('DAI => ETH', async function () {
            async function initContractsWithCaseSettings () {
                const fixtureData = await initContracts();

                const GAS_USED_KEY = 'DAI => ETH';
                gasUsed[GAS_USED_KEY] = gasUsed[GAS_USED_KEY] || {};

                return {
                    ...fixtureData,
                    settings: {
                        GAS_USED_KEY,
                        amount: ether('1'),
                    },
                };
            }

            it('1inch', async function () {
                const { addr1, tokens, inch, settings: { GAS_USED_KEY, amount } } = await loadFixture(initContractsWithCaseSettings);
                const tx = await inch.unoswapTo(
                    addr1.address,
                    await tokens.DAI.getAddress(),
                    amount,
                    '1',
                    BigInt('0xa478c2975ab1ea89e8196811f51a7b7ade33eb11') | (1n << 252n) | (1n << 247n),
                );
                gasUsed[GAS_USED_KEY][ProtocolKey.INCH] = (await tx.wait()).gasUsed.toString();
            });

            it('matcha', async function () {
                const { tokens, matcha, settings: { GAS_USED_KEY, amount } } = await loadFixture(initContractsWithCaseSettings);
                const tx = await matcha.sellToUniswap(
                    [tokens.DAI, tokens.EEE],
                    amount,
                    '1',
                    false,
                );
                gasUsed[GAS_USED_KEY][ProtocolKey.MATCHA] = (await tx.wait()).gasUsed.toString();
            });

            it('uniswap', async function () {
                const { addr1, tokens, uniswap, settings: { GAS_USED_KEY, amount } } = await loadFixture(initContractsWithCaseSettings);
                const tx = await uniswap.swapExactTokensForETH(
                    amount,
                    '1',
                    [tokens.DAI, tokens.WETH],
                    addr1.address,
                    '0xffffffffff',
                );
                gasUsed[GAS_USED_KEY][ProtocolKey.UNISWAP] = (await tx.wait()).gasUsed.toString();
            });

            it('paraswap', async function () {
                const { tokens, paraswap, ethPrice, settings: { GAS_USED_KEY, amount } } = await loadFixture(initContractsWithCaseSettings);
                const tx = await paraswap.swapExactAmountInOnUniswapV2([
                        tokens.DAI,
                        tokens.EEE,
                        amount,
                        percentageOf(amount * BigInt(1e18) / ethPrice, 95),
                        percentageOf(amount * BigInt(1e18) / ethPrice, 95),
                        constants.ZERO_BYTES32,
                        constants.ZERO_ADDRESS,
                        paraswapUniV2PoolData([[tokens.DAI.target, tokens.WETH.target]]),
                    ],
                    0n,
                    '0x',
                );
                gasUsed[GAS_USED_KEY][ProtocolKey.PARASWAP] = (await tx.wait()).gasUsed.toString();
            });
        });

        describe('DAI => WETH', async function () {
            async function initContractsWithCaseSettings () {
                const fixtureData = await initContracts();

                const GAS_USED_KEY = 'DAI => WETH';
                gasUsed[GAS_USED_KEY] = gasUsed[GAS_USED_KEY] || {};

                return {
                    ...fixtureData,
                    settings: {
                        GAS_USED_KEY,
                        amount: ether('1'),
                    },
                };
            }

            it('1inch', async function () {
                const { addr1, tokens, inch, settings: { GAS_USED_KEY, amount } } = await loadFixture(initContractsWithCaseSettings);
                const tx = await inch.unoswapTo(
                    addr1.address,
                    await tokens.DAI.getAddress(),
                    amount,
                    '1',
                    BigInt('0xa478c2975ab1ea89e8196811f51a7b7ade33eb11') | (1n << 247n),
                );
                gasUsed[GAS_USED_KEY][ProtocolKey.INCH] = (await tx.wait()).gasUsed.toString();
            });

            it('matcha', async function () {
                const { tokens, matcha, settings: { GAS_USED_KEY, amount } } = await loadFixture(initContractsWithCaseSettings);
                const tx = await matcha.sellToUniswap(
                    [tokens.DAI, tokens.WETH],
                    amount,
                    '1',
                    false,
                );
                gasUsed[GAS_USED_KEY][ProtocolKey.MATCHA] = (await tx.wait()).gasUsed.toString();
            });

            it('uniswap', async function () {
                const { addr1, tokens, uniswap, settings: { GAS_USED_KEY, amount } } = await loadFixture(initContractsWithCaseSettings);
                const tx = await uniswap.swapExactTokensForTokens(
                    amount,
                    '1',
                    [tokens.DAI, tokens.WETH],
                    addr1.address,
                    '0xffffffffff',
                );
                gasUsed[GAS_USED_KEY][ProtocolKey.UNISWAP] = (await tx.wait()).gasUsed.toString();
            });

            it('paraswap', async function () {
                const { tokens, paraswap, ethPrice, settings: { GAS_USED_KEY, amount } } = await loadFixture(initContractsWithCaseSettings);
                const tx = await paraswap.swapExactAmountInOnUniswapV2([
                        tokens.DAI,
                        tokens.WETH,
                        amount,
                        percentageOf(amount * BigInt(1e18) / ethPrice, 95),
                        percentageOf(amount * BigInt(1e18) / ethPrice, 95),
                        constants.ZERO_BYTES32,
                        constants.ZERO_ADDRESS,
                        paraswapUniV2PoolData([[tokens.DAI.target, tokens.WETH.target]]),
                    ],
                    0n,
                    '0x',
                );
                gasUsed[GAS_USED_KEY][ProtocolKey.PARASWAP] = (await tx.wait()).gasUsed.toString();
            });
        });

        describe('DAI => WETH => USDC', async function () {
            async function initContractsWithCaseSettings () {
                const fixtureData = await initContracts();

                const GAS_USED_KEY = 'DAI => WETH => USDC';
                gasUsed[GAS_USED_KEY] = gasUsed[GAS_USED_KEY] || {};

                return {
                    ...fixtureData,
                    settings: {
                        GAS_USED_KEY,
                        amount: ether('1'),
                    },
                };
            }

            it('1inch', async function () {
                const { addr1, tokens, inch, settings: { GAS_USED_KEY, amount } } = await loadFixture(initContractsWithCaseSettings);
                const tx = await inch.unoswapTo2(
                    addr1.address,
                    await tokens.DAI.getAddress(),
                    amount,
                    '1',
                    BigInt('0xa478c2975ab1ea89e8196811f51a7b7ade33eb11') | (1n << 247n),
                    '0xb4e16d0168e52d35cacd2c6185b44281ec28c9dc',
                );
                gasUsed[GAS_USED_KEY][ProtocolKey.INCH] = (await tx.wait()).gasUsed.toString();
            });

            it('matcha', async function () {
                const { tokens, matcha, settings: { GAS_USED_KEY, amount } } = await loadFixture(initContractsWithCaseSettings);
                const tx = await matcha.sellToUniswap(
                    [tokens.DAI, tokens.WETH, tokens.USDC],
                    amount,
                    '1',
                    false,
                );
                gasUsed[GAS_USED_KEY][ProtocolKey.MATCHA] = (await tx.wait()).gasUsed.toString();
            });

            it('uniswap', async function () {
                const { addr1, tokens, uniswap, settings: { GAS_USED_KEY, amount } } = await loadFixture(initContractsWithCaseSettings);
                const tx = await uniswap.swapExactTokensForTokens(
                    amount,
                    '1',
                    [tokens.DAI, tokens.WETH, tokens.USDC],
                    addr1.address,
                    '0xffffffffff',
                )
                gasUsed[GAS_USED_KEY][ProtocolKey.UNISWAP] = (await tx.wait()).gasUsed.toString();
            });

            it('paraswap', async function () {
                const { tokens, paraswap, settings: { GAS_USED_KEY, amount } } = await loadFixture(initContractsWithCaseSettings);
                const tx = await paraswap.swapExactAmountInOnUniswapV2([
                        tokens.DAI,
                        tokens.USDC,
                        amount,
                        percentageOf(amount / BigInt(1e12), 95),
                        percentageOf(amount / BigInt(1e12), 95),
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
                gasUsed[GAS_USED_KEY][ProtocolKey.PARASWAP] = (await tx.wait()).gasUsed.toString();
            });
        });

        describe('DAI => WETH => USDC => USDT', async function () {
            async function initContractsWithCaseSettings () {
                const fixtureData = await initContracts();

                const GAS_USED_KEY = 'DAI => WETH => USDC => USDT';
                gasUsed[GAS_USED_KEY] = gasUsed[GAS_USED_KEY] || {};

                return {
                    ...fixtureData,
                    settings: {
                        GAS_USED_KEY,
                        amount: ether('1'),
                    },
                };
            }

            it('1inch', async function () {
                const { addr1, tokens, inch, settings: { GAS_USED_KEY, amount } } = await loadFixture(initContractsWithCaseSettings);
                const tx = await inch.unoswapTo3(
                    addr1.address,
                    await tokens.DAI.getAddress(),
                    amount,
                    '1',
                    BigInt('0xa478c2975ab1ea89e8196811f51a7b7ade33eb11') | (1n << 247n),
                    '0xb4e16d0168e52d35cacd2c6185b44281ec28c9dc',
                    BigInt('0x3041cbd36888becc7bbcbc0045e3b1f144466f5f') | (1n << 247n),
                );
                gasUsed[GAS_USED_KEY][ProtocolKey.INCH] = (await tx.wait()).gasUsed.toString();
            });

            it('matcha', async function () {
                const { tokens, matcha, settings: { GAS_USED_KEY, amount } } = await loadFixture(initContractsWithCaseSettings);
                const tx = await matcha.sellToUniswap(
                    [tokens.DAI, tokens.WETH, tokens.USDC, tokens.USDT],
                    amount,
                    '1',
                    false,
                );
                gasUsed[GAS_USED_KEY][ProtocolKey.MATCHA] = (await tx.wait()).gasUsed.toString();
            });

            it('uniswap', async function () {
                const { addr1, tokens, uniswap, settings: { GAS_USED_KEY, amount } } = await loadFixture(initContractsWithCaseSettings);
                const tx = await uniswap.swapExactTokensForTokens(
                    amount,
                    '1',
                    [tokens.DAI, tokens.WETH, tokens.USDC, tokens.USDT],
                    addr1.address,
                    '0xffffffffff',
                );
                gasUsed[GAS_USED_KEY][ProtocolKey.UNISWAP] = (await tx.wait()).gasUsed.toString();
            });

            it('paraswap', async function () {
                const { tokens, paraswap, settings: { GAS_USED_KEY, amount } } = await loadFixture(initContractsWithCaseSettings);
                const tx = await paraswap.swapExactAmountInOnUniswapV2([
                        tokens.DAI,
                        tokens.USDT,
                        amount,
                        percentageOf(amount / BigInt(1e12), 95),
                        percentageOf(amount / BigInt(1e12), 95),
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
                gasUsed[GAS_USED_KEY][ProtocolKey.PARASWAP] = (await tx.wait()).gasUsed.toString();
            });
        });
    });
});
