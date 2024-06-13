const { ethers } = require('hardhat');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');
const { ether, constants } = require('@1inch/solidity-utils');
const { ProtocolKey, paraswapUniV2PoolData } = require('./helpers/utils');
const { initRouterContracts } = require('./helpers/fixtures');

describe('Router [UniV2]', async function () {
    const gasUsed = {};

    const pools = {
        WETH_DAI: '0xa478c2975ab1ea89e8196811f51a7b7ade33eb11',
        WETH_USDC: '0xb4e16d0168e52d35cacd2c6185b44281ec28c9dc',
        USDC_DAI: '0xae461ca67b15dc8dc81ce7615e0320da1a9ab8d5',
        USDC_USDT: '0x3041cbd36888becc7bbcbc0045e3b1f144466f5f',
    };

    async function initContracts () {
        const fixtureData = await initRouterContracts();

        // Set `blockTimestampLast` in uniswapv2 pools and next block timestamp to avoid oracle slot updates
        const latestBlockTimestamp = (await ethers.provider.getBlock('latest')).timestamp;
        const nextBlockTimestamp = latestBlockTimestamp + 3600*1000;

        for (const pool of Object.values(pools)) {
            const slotData = await ethers.provider.getStorage(pool, '0x8');
            await ethers.provider.send("hardhat_setStorageAt", [
                pool,
                '0x8',
                ethers.toBeHex(nextBlockTimestamp, 4) + slotData.slice(10),
            ]);
        }
        await ethers.provider.send('evm_setNextBlockTimestamp', [nextBlockTimestamp]);

        return fixtureData;
    }

    after(async function () {
        console.table(gasUsed);
    });

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
                pools.WETH_DAI,
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
            const { addr1, tokens, uniswapv2, settings: { GAS_USED_KEY, amount } } = await loadFixture(initContractsWithCaseSettings);
            const tx = await uniswapv2.swapExactETHForTokens(
                amount,
                [tokens.WETH, tokens.DAI],
                addr1.address,
                '0xffffffffff',
                { value: amount },
            );
            gasUsed[GAS_USED_KEY][ProtocolKey.UNISWAP] = (await tx.wait()).gasUsed.toString();
        });

        it('paraswap', async function () {
            const { addr1, tokens, uniswapv2, paraswap, settings: { GAS_USED_KEY, amount } } = await loadFixture(initContractsWithCaseSettings);
            // Get `quotedAmount` to avoid positive slippage which makes the transaction significantly more expensive
            const [,quotedAmount] = await uniswapv2.swapExactETHForTokens.staticCall(
                amount,
                [tokens.WETH, tokens.DAI],
                addr1.address,
                '0xffffffffff',
                { value: amount },
            );
            const tx = await paraswap.swapExactAmountInOnUniswapV2([
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
                pools.WETH_USDC,
                pools.USDC_DAI,
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
            const { addr1, tokens, uniswapv2, settings: { GAS_USED_KEY, amount } } = await loadFixture(initContractsWithCaseSettings);
            const tx = await uniswapv2.swapExactETHForTokens(
                amount,
                [tokens.WETH, tokens.USDC, tokens.DAI],
                addr1.address,
                '0xffffffffff',
                { value: amount },
            );
            gasUsed[GAS_USED_KEY][ProtocolKey.UNISWAP] = (await tx.wait()).gasUsed.toString();
        });

        it('paraswap', async function () {
            const { addr1, tokens, uniswapv2, paraswap, settings: { GAS_USED_KEY, amount } } = await loadFixture(initContractsWithCaseSettings);
            // Get `quotedAmount` to avoid positive slippage which makes the transaction significantly more expensive
            const [,,quotedAmount] = await uniswapv2.swapExactETHForTokens.staticCall(
                amount,
                [tokens.WETH, tokens.USDC, tokens.DAI],
                addr1.address,
                '0xffffffffff',
                { value: amount },
            );
            const tx = await paraswap.swapExactAmountInOnUniswapV2([
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
                BigInt(pools.WETH_DAI) | (1n << 252n) | (1n << 247n),
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
            const { addr1, tokens, uniswapv2, settings: { GAS_USED_KEY, amount } } = await loadFixture(initContractsWithCaseSettings);
            const tx = await uniswapv2.swapExactTokensForETH(
                amount,
                '1',
                [tokens.DAI, tokens.WETH],
                addr1.address,
                '0xffffffffff',
            );
            gasUsed[GAS_USED_KEY][ProtocolKey.UNISWAP] = (await tx.wait()).gasUsed.toString();
        });

        it('paraswap', async function () {
            const { addr1, tokens, uniswapv2, paraswap, settings: { GAS_USED_KEY, amount } } = await loadFixture(initContractsWithCaseSettings);
            // Get `quotedAmount` to avoid positive slippage which makes the transaction significantly more expensive
            const [,quotedAmount] = await uniswapv2.swapExactTokensForETH.staticCall(
                amount,
                '1',
                [tokens.DAI, tokens.WETH],
                addr1.address,
                '0xffffffffff',
            );
            const tx = await paraswap.swapExactAmountInOnUniswapV2([
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
                BigInt(pools.WETH_DAI) | (1n << 247n),
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
            const { addr1, tokens, uniswapv2, settings: { GAS_USED_KEY, amount } } = await loadFixture(initContractsWithCaseSettings);
            const tx = await uniswapv2.swapExactTokensForTokens(
                amount,
                '1',
                [tokens.DAI, tokens.WETH],
                addr1.address,
                '0xffffffffff',
            );
            gasUsed[GAS_USED_KEY][ProtocolKey.UNISWAP] = (await tx.wait()).gasUsed.toString();
        });

        it('paraswap', async function () {
            const { addr1, tokens, uniswapv2, paraswap, settings: { GAS_USED_KEY, amount } } = await loadFixture(initContractsWithCaseSettings);
            // Get `quotedAmount` to avoid positive slippage which makes the transaction significantly more expensive
            const [,quotedAmount] = await uniswapv2.swapExactTokensForTokens.staticCall(
                amount,
                '1',
                [tokens.DAI, tokens.WETH],
                addr1.address,
                '0xffffffffff',
            );
            const tx = await paraswap.swapExactAmountInOnUniswapV2([
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
                BigInt(pools.WETH_DAI) | (1n << 247n),
                pools.WETH_USDC,
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
            const { addr1, tokens, uniswapv2, settings: { GAS_USED_KEY, amount } } = await loadFixture(initContractsWithCaseSettings);
            const tx = await uniswapv2.swapExactTokensForTokens(
                amount,
                '1',
                [tokens.DAI, tokens.WETH, tokens.USDC],
                addr1.address,
                '0xffffffffff',
            );
            gasUsed[GAS_USED_KEY][ProtocolKey.UNISWAP] = (await tx.wait()).gasUsed.toString();
        });

        it('paraswap', async function () {
            const { addr1, tokens, uniswapv2, paraswap, settings: { GAS_USED_KEY, amount } } = await loadFixture(initContractsWithCaseSettings);
            // Get `quotedAmount` to avoid positive slippage which makes the transaction significantly more expensive
            const [,,quotedAmount] = await uniswapv2.swapExactTokensForTokens.staticCall(
                amount,
                '1',
                [tokens.DAI, tokens.WETH, tokens.USDC],
                addr1.address,
                '0xffffffffff',
            );
            const tx = await paraswap.swapExactAmountInOnUniswapV2([
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
                BigInt(pools.WETH_DAI) | (1n << 247n),
                pools.WETH_USDC,
                BigInt(pools.USDC_USDT) | (1n << 247n),
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
            const { addr1, tokens, uniswapv2, settings: { GAS_USED_KEY, amount } } = await loadFixture(initContractsWithCaseSettings);
            const tx = await uniswapv2.swapExactTokensForTokens(
                amount,
                '1',
                [tokens.DAI, tokens.WETH, tokens.USDC, tokens.USDT],
                addr1.address,
                '0xffffffffff',
            );
            gasUsed[GAS_USED_KEY][ProtocolKey.UNISWAP] = (await tx.wait()).gasUsed.toString();
        });

        it('paraswap', async function () {
            const { addr1, tokens, uniswapv2, paraswap, settings: { GAS_USED_KEY, amount } } = await loadFixture(initContractsWithCaseSettings);
            // Get `quotedAmount` to avoid positive slippage which makes the transaction significantly more expensive
            const [,,,quotedAmount] = await uniswapv2.swapExactTokensForTokens.staticCall(
                amount,
                '1',
                [tokens.DAI, tokens.WETH, tokens.USDC, tokens.USDT],
                addr1.address,
                '0xffffffffff',
            );
            const tx = await paraswap.swapExactAmountInOnUniswapV2([
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
            gasUsed[GAS_USED_KEY][ProtocolKey.PARASWAP] = (await tx.wait()).gasUsed.toString();
        });
    });
});
