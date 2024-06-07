const hre = require('hardhat');
const { ethers } = hre;
// const axios = require('axios');
// const { constructFullSDK, constructAxiosFetcher, constructEthersContractCaller } = require('@paraswap/sdk');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');
const { ether, constants } = require('@1inch/solidity-utils');
const { ProtocolKey } = require('./helpers/utils');

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
        const paraswap = await ethers.getContractAt('IParaswapRouter', '0xDEF171Fe48CF0115B1d80b88dc8eAB59176FEe57');
        const paraswapTokenTransferProxy = '0x216B4B4Ba9F3e719726886d34a177484278Bfcae';
        // const paraswap = constructFullSDK({
        //     chainId: 1,
        //     fetcher: constructAxiosFetcher(axios),
        //     contractCaller: constructEthersContractCaller({
        //         ethersProviderOrSigner: ethers.provider,
        //         EthersContract: ethers.Contract,
        //     }, addr1),
        // });

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
        const pools = {
            uniV2: {
                WETH_DAI: '0xA478c2975Ab1Ea89e8196811F51A7B7Ade33eB11',
                WETH_USDC: '0xB4e16d0168e52d35CaCD2c6185b44281Ec28C9Dc',
                USDC_DAI: '0xAE461cA67B15dc8dc81CE7615e0320dA1A9aB8D5',
                USDC_USDT: '0x3041CbD36888bECc7bbCBc0045E3B1f144466f5f',
            },
        };

        await tokens.DAI.approve(inch, ether('1'));
        await tokens.DAI.approve(matcha, ether('1'));
        await tokens.DAI.approve(uniswap, ether('1'));
        await tokens.DAI.approve(paraswapTokenTransferProxy, ether('1'));

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

        return { addr1, tokens, pools, inch, matcha, paraswap, uniswap };
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
                    938967527125595836475317159035754667655090662161n,
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
                const { tokens, pools, paraswap, settings: { GAS_USED_KEY, amount } } = await loadFixture(initContractsWithCaseSettings);
                const tx = await paraswap.swapOnUniswapV2Fork(
                    tokens.EEE,
                    amount,
                    '1',
                    tokens.WETH,
                    [ethers.concat(['0x4de5', pools.uniV2.WETH_DAI])],
                    { value: amount },
                )
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
                    1032645502136839097869158895333537673945117411804n,
                    994927942081732774077955121581421418523584542933n,
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
                const { tokens, pools, paraswap, settings: { GAS_USED_KEY, amount } } = await loadFixture(initContractsWithCaseSettings);
                const tx = await paraswap.swapOnUniswapV2Fork(
                    tokens.EEE,
                    amount,
                    '1',
                    tokens.WETH,
                    [
                        ethers.concat(['0x4de5', pools.uniV2.WETH_USDC]),
                        ethers.concat(['0x4de5', pools.uniV2.USDC_DAI]),
                    ],
                    { value: amount },
                )
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
                        gasLimit: '300000',
                    },
                };
            }

            it('1inch', async function () {
                const { addr1, tokens, inch, settings: { GAS_USED_KEY, amount, gasLimit } } = await loadFixture(initContractsWithCaseSettings);
                const tx = await inch.unoswapTo(
                    addr1.address,
                    await tokens.DAI.getAddress(),
                    amount,
                    '1',
                    7463162001623895408159848644077055337980887816877931638141419261915116595985n,
                    { gasLimit },
                );
                gasUsed[GAS_USED_KEY][ProtocolKey.INCH] = (await tx.wait()).gasUsed.toString();
            });

            it('matcha', async function () {
                const { tokens, matcha, settings: { GAS_USED_KEY, amount, gasLimit } } = await loadFixture(initContractsWithCaseSettings);
                const tx = await matcha.sellToUniswap(
                    [tokens.DAI, tokens.EEE],
                    amount,
                    '1',
                    false,
                    { gasLimit },
                );
                gasUsed[GAS_USED_KEY][ProtocolKey.MATCHA] = (await tx.wait()).gasUsed.toString();
            });

            it('uniswap', async function () {
                const { addr1, tokens, uniswap, settings: { GAS_USED_KEY, amount, gasLimit } } = await loadFixture(initContractsWithCaseSettings);
                const tx = await uniswap.swapExactTokensForETH(
                    amount,
                    '1',
                    [tokens.DAI, tokens.WETH],
                    addr1.address,
                    '0xffffffffff',
                    { gasLimit },
                );
                gasUsed[GAS_USED_KEY][ProtocolKey.UNISWAP] = (await tx.wait()).gasUsed.toString();
            });

            it('paraswap', async function () {
                const { tokens, pools, paraswap, settings: { GAS_USED_KEY, amount, gasLimit } } = await loadFixture(initContractsWithCaseSettings);
                const tx = await paraswap.swapOnUniswapV2Fork(
                    tokens.DAI,
                    amount,
                    '1',
                    tokens.WETH,
                    [ethers.concat(['0x4de4', pools.uniV2.WETH_DAI])],
                    { gasLimit },
                )
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
                    226156424291633194186662081034061097151513775275396385675320261420545993489n,
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
                const { tokens, pools, paraswap, settings: { GAS_USED_KEY, amount } } = await loadFixture(initContractsWithCaseSettings);
                const tx = await paraswap.swapOnUniswapV2Fork(
                    tokens.DAI,
                    amount,
                    '1',
                    constants.ZERO_ADDRESS,
                    [ethers.concat(['0x4de4', pools.uniV2.WETH_DAI])],
                )
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
                    226156424291633194186662081034061097151513775275396385675320261420545993489n,
                    1032645502136839097869158895333537673945117411804n,
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
                const { tokens, pools, paraswap, settings: { GAS_USED_KEY, amount } } = await loadFixture(initContractsWithCaseSettings);
                const tx = await paraswap.swapOnUniswapV2Fork(
                    tokens.DAI,
                    amount,
                    '1',
                    constants.ZERO_ADDRESS,
                    [
                        ethers.concat(['0x4de4', pools.uniV2.WETH_DAI]),
                        ethers.concat(['0x4de5', pools.uniV2.WETH_USDC]),
                    ],
                )
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
                    226156424291633194186662081034061097151513775275396385675320261420545993489n,
                    1032645502136839097869158895333537673945117411804n,
                    226156424291633194186662080370592431195940027908611666024061324202391007071n,
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
                const { tokens, pools, paraswap, settings: { GAS_USED_KEY, amount } } = await loadFixture(initContractsWithCaseSettings);
                const tx = await paraswap.swapOnUniswapV2Fork(
                    tokens.DAI,
                    amount,
                    '1',
                    constants.ZERO_ADDRESS,
                    [
                        ethers.concat(['0x4de4', pools.uniV2.WETH_DAI]),
                        ethers.concat(['0x4de5', pools.uniV2.WETH_USDC]),
                        ethers.concat(['0x4de4', pools.uniV2.USDC_USDT]),
                    ],
                )
                gasUsed[GAS_USED_KEY][ProtocolKey.PARASWAP] = (await tx.wait()).gasUsed.toString();
            });
        });
    });
});
