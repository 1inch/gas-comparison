const hre = require('hardhat');
const { ethers } = hre;
const axios = require('axios');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');
const { ether, constants } = require('@1inch/solidity-utils');
const { constructFullSDK, constructAxiosFetcher, constructEthersContractCaller } = require('@paraswap/sdk');

const PARASWAP_TOKEN_TRANSFER_PROXY = '0x216B4B4Ba9F3e719726886d34a177484278Bfcae';

const makeAndBroadcastParaswapTx = async ({
    paraswap,
    srcTokenSymbol,
    dstTokenSymbol,
    amount,
    user,
}) => {
    const paraTokens = (await paraswap.swap.getTokens())
        .filter(t => [srcTokenSymbol, dstTokenSymbol].indexOf(t.symbol) !== -1)
        .reduce((acc, token) => {
            acc[token.symbol] = token;
            return acc;
        }, {});
    const priceRoute = await paraswap.swap.getRate({
        srcToken: paraTokens[srcTokenSymbol].address,
        destToken: paraTokens[dstTokenSymbol].address,
        amount,
    });
    const txParams = await paraswap.swap.buildTx({
        srcToken: paraTokens[srcTokenSymbol].address,
        destToken: paraTokens[dstTokenSymbol].address,
        srcAmount: amount.toString(),
        slippage: 1,
        priceRoute,
        userAddress: user.address,
        receiver: user.address,
        ignoreChecks: true,
    });
    const filteredTxParams = ['from', 'to', 'value', 'data'].reduce((acc, key) => {
        acc[key] = txParams[key];
        return acc;
    }, {});

    if (srcTokenSymbol !== 'ETH') {
        const srcToken = await ethers.getContractAt('IERC20', paraTokens[srcTokenSymbol].address);
        await srcToken.approve(PARASWAP_TOKEN_TRANSFER_PROXY, amount);
    }
    return await user.sendTransaction(filteredTxParams);
};

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
        const paraswap = constructFullSDK({
            chainId: 1,
            fetcher: constructAxiosFetcher(axios),
            contractCaller: constructEthersContractCaller({
                ethersProviderOrSigner: ethers.provider,
                EthersContract: ethers.Contract,
            }, addr1),
        });

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

        return { addr1, tokens, inch, matcha, paraswap, uniswap };
    }

    it('ETH => DAI', async function () {
        const { addr1, tokens, inch, matcha, paraswap, uniswap } = await loadFixture(initContracts);
        const inchTx = await inch.ethUnoswapTo(
            addr1.address,
            '10000000000',
            938967527125595836475317159035754667655090662161n,
            { value: ether('1') },
        );
        const matchaTx = await matcha.sellToUniswap(
            [tokens.EEE, tokens.DAI],
            ether('1'),
            '1',
            false,
            { value: ether('1') },
        );
        const uniTx = await uniswap.swapExactETHForTokens(
            ether('1'),
            [tokens.WETH, tokens.DAI],
            addr1.address,
            '10000000000',
            { value: ether('1') },
        );
        const paraTx = await makeAndBroadcastParaswapTx({
            paraswap,
            srcTokenSymbol: 'ETH',
            dstTokenSymbol: 'DAI',
            amount: ether('0.01'),
            user: addr1,
        });

        gasUsed['ETH => DAI'] = {
            inch: (await inchTx.wait()).gasUsed.toString(),
            matcha: (await matchaTx.wait()).gasUsed.toString(),
            paraswap: (await paraTx.wait()).gasUsed.toString(),
            uni: (await uniTx.wait()).gasUsed.toString(),
        };
    });

    it('ETH => USDC => DAI', async function () {
        const { addr1, tokens, inch, matcha, uniswap } = await loadFixture(initContracts);
        const inchTx = await inch.ethUnoswapTo2(
            addr1.address,
            ether('0'),
            1032645502136839097869158895333537673945117411804n,
            994927942081732774077955121581421418523584542933n,
            { value: ether('1') },
        );
        const matchaTx = await matcha.sellToUniswap(
            [tokens.EEE, tokens.USDC, tokens.DAI],
            ether('1'),
            '1',
            false,
            { value: ether('1') },
        );
        const uniTx = await uniswap.swapExactETHForTokens(
            ether('1'),
            [tokens.WETH, tokens.USDC, tokens.DAI],
            addr1.address,
            '10000000000',
            { value: ether('1') },
        );

        gasUsed['ETH => USDC => DAI'] = {
            inch: (await inchTx.wait()).gasUsed.toString(),
            matcha: (await matchaTx.wait()).gasUsed.toString(),
            uni: (await uniTx.wait()).gasUsed.toString(),
        };
    });

    it('DAI => ETH', async function () {
        const { addr1, tokens, inch, matcha, paraswap, uniswap } = await loadFixture(initContracts);
        const inchTx = await inch.unoswapTo(
            addr1.address,
            await tokens.DAI.getAddress(),
            ether('1'),
            ether('0'),
            7463162001623895408159848644077055337980887816877931638141419261915116595985n,
            { gasLimit: '300000' },
        );
        const matchaTx = await matcha.sellToUniswap(
            [tokens.DAI, tokens.EEE],
            ether('1'),
            '1',
            false,
            { gasLimit: '300000' },
        );
        const uniTx = await uniswap.swapExactTokensForETH(
            ether('1'),
            ether('0'),
            [tokens.DAI, tokens.WETH],
            addr1.address,
            '10000000000',
            { gasLimit: '300000' },
        );
        const paraTx = await makeAndBroadcastParaswapTx({
            paraswap,
            srcTokenSymbol: 'DAI',
            dstTokenSymbol: 'ETH',
            amount: ether('0.1'),
            user: addr1,
        });

        gasUsed['DAI => ETH'] = {
            inch: (await inchTx.wait()).gasUsed.toString(),
            matcha: (await matchaTx.wait()).gasUsed.toString(),
            paraswap: (await paraTx.wait()).gasUsed.toString(),
            uni: (await uniTx.wait()).gasUsed.toString(),
        };
    });

    it('DAI => WETH', async function () {
        const { addr1, tokens, inch, matcha, paraswap, uniswap } = await loadFixture(initContracts);
        const inchTx = await inch.unoswapTo(
            addr1.address,
            await tokens.DAI.getAddress(),
            ether('1'),
            ether('0'),
            226156424291633194186662081034061097151513775275396385675320261420545993489n,
        );
        const matchaTx = await matcha.sellToUniswap(
            [tokens.DAI, tokens.WETH],
            ether('1'),
            '1',
            false,
        );
        const uniTx = await uniswap.swapExactTokensForTokens(
            ether('1'),
            ether('0'),
            [tokens.DAI, tokens.WETH],
            addr1.address,
            '10000000000',
        );
        const paraTx = await makeAndBroadcastParaswapTx({
            paraswap,
            srcTokenSymbol: 'DAI',
            dstTokenSymbol: 'WETH',
            amount: ether('0.1'),
            user: addr1,
        });

        gasUsed['DAI => WETH'] = {
            inch: (await inchTx.wait()).gasUsed.toString(),
            matcha: (await matchaTx.wait()).gasUsed.toString(),
            paraswap: (await paraTx.wait()).gasUsed.toString(),
            uni: (await uniTx.wait()).gasUsed.toString(),
        };
    });

    it('DAI => WETH => USDC', async function () {
        const { addr1, tokens, inch, matcha, uniswap } = await loadFixture(initContracts);
        const inchTx = await inch.unoswapTo2(
            addr1.address,
            await tokens.DAI.getAddress(),
            ether('1'),
            ether('0'),
            226156424291633194186662081034061097151513775275396385675320261420545993489n,
            1032645502136839097869158895333537673945117411804n,
        );
        const matchaTx = await matcha.sellToUniswap(
            [tokens.DAI, tokens.WETH, tokens.USDC],
            ether('1'),
            '1',
            false,
        );
        const uniTx = await uniswap.swapExactTokensForTokens(
            ether('1'),
            ether('0'),
            [tokens.DAI, tokens.WETH, tokens.USDC],
            addr1.address,
            '10000000000',
        );

        gasUsed['DAI => WETH => USDC'] = {
            inch: (await inchTx.wait()).gasUsed.toString(),
            matcha: (await matchaTx.wait()).gasUsed.toString(),
            uni: (await uniTx.wait()).gasUsed.toString(),
        };
    });

    it('DAI => WETH => USDC => USDT', async function () {
        const { addr1, tokens, inch, matcha, uniswap } = await loadFixture(initContracts);
        const inchTx = await inch.unoswapTo3(
            addr1.address,
            await tokens.DAI.getAddress(),
            ether('1'),
            ether('0'),
            226156424291633194186662081034061097151513775275396385675320261420545993489n,
            1032645502136839097869158895333537673945117411804n,
            226156424291633194186662080370592431195940027908611666024061324202391007071n,
        );
        const matchaTx = await matcha.sellToUniswap(
            [tokens.DAI, tokens.WETH, tokens.USDC, tokens.USDT],
            ether('1'),
            '1',
            false,
        );
        const uniTx = await uniswap.swapExactTokensForTokens(
            ether('1'),
            ether('0'),
            [tokens.DAI, tokens.WETH, tokens.USDC, tokens.USDT],
            addr1.address,
            '10000000000',
        );

        gasUsed['DAI => WETH => USDC => USDT'] = {
            inch: (await inchTx.wait()).gasUsed.toString(),
            matcha: (await matchaTx.wait()).gasUsed.toString(),
            uni: (await uniTx.wait()).gasUsed.toString(),
        };
    });
});
