const hre = require('hardhat');
const { ethers, getChainId } = hre;
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');
const { NonceManager } = require('ethers');
const { ether, constants } = require('@1inch/solidity-utils');
const { fillWithMakingAmount } = require('@1inch/limit-order-protocol-contract/test/helpers/orderUtils');
const { InchOrder, MatchaOrder, UniswapOrder, ParaswapOrder } = require('./helpers/orders');

const PARASWAP_TOKEN_TRANSFER_PROXY = '0x216B4B4Ba9F3e719726886d34a177484278Bfcae';
const PARASWAP_LIMIT_ORDERS = '0xe92b586627ccA7a83dC919cc7127196d70f55a06';
const PERMIT2CONTRACT = '0x000000000022D473030F116dDEE9F6B43aC78BA3';

describe('LimitOrders', async function () {
    const gasUsed = {};

    after(async function () {
        console.table(gasUsed);
    });

    async function initContracts () {
        const [maker, taker] = await ethers.getSigners();

        const inch = await ethers.getContractAt('LimitOrderProtocol', '0x111111125421ca6dc452d289314280a0f8842a65');
        const uniswap = await ethers.getContractAt('IReactor', '0x6000da47483062A0D734Ba3dc7576Ce6A0B645C4');
        const matcha = await ethers.getContractAt('IMatcha', '0xDef1C0ded9bec7F1a1670819833240f027b25EfF');

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

        for (const wallet of [maker, taker]) {
            // Buy some DAI
            await wallet.sendTransaction({ to: '0x2a1530c4c41db0b0b2bb646cb5eb1a67b7158667', value: ether('1') });
            // Buy some WETH
            await tokens.WETH.connect(wallet).deposit({ value: ether('1') });

            for (const token of [tokens.DAI, tokens.WETH]) {
                await token.connect(wallet).approve(inch, ether('1'));
                await token.connect(wallet).approve(matcha, ether('1'));
                await token.connect(wallet).approve(uniswap, ether('1'));
                await token.connect(wallet).approve(PARASWAP_TOKEN_TRANSFER_PROXY, ether('1'));
                await token.connect(wallet).approve(PARASWAP_LIMIT_ORDERS, ether('1'));
                await token.connect(wallet).approve(PERMIT2CONTRACT, ether('1'));
            }
        }

        return { maker, taker, tokens, inch, matcha, uniswap };
    }

    it('ETH => DAI', async function () {
        const { maker, taker, tokens, inch, matcha } = await loadFixture(initContracts);

        const inchOrder = new InchOrder({
            makerAsset: await tokens.DAI.getAddress(),
            takerAsset: await tokens.ETH.getAddress(),
            makingAmount: ether('0.1'),
            takingAmount: ether('0.01'),
            maker,
            verifyingContract: await inch.getAddress(),
        });
        const { r, vs } = await inchOrder.sign(maker);
        const inchTx = await inch.connect(taker).fillOrder(inchOrder.order, r, vs, inchOrder.order.takingAmount, fillWithMakingAmount(inchOrder.order.makingAmount));

        const matchaOrder = new MatchaOrder({
            chainId: await getChainId(),
            verifyingContract: await matcha.getAddress(),
            maker: maker.address,
            taker: taker.address,
            makerToken: await tokens.DAI.getAddress(),
            takerToken: await tokens.ETH.getAddress(),
            makerAmount: ether('0.1'),
            takerAmount: ether('0.01'),
        });
        const signature = await matchaOrder.sign(maker);
        const matchaTx = await matcha.connect(taker).fillLimitOrder(matchaOrder.order, signature, matchaOrder.order.takerAmount);

        gasUsed['ETH => DAI'] = {
            inch: (await inchTx.wait()).gasUsed.toString(),
            matcha: (await matchaTx.wait()).gasUsed.toString(),
            paraswap: 'not supported',
            uniswap: 'not supported',
        };
    });

    it('WETH => DAI', async function () {
        const { maker, taker, tokens, inch, matcha, uniswap } = await loadFixture(initContracts);

        const inchOrder = new InchOrder({
            makerAsset: await tokens.DAI.getAddress(),
            takerAsset: await tokens.WETH.getAddress(),
            makingAmount: ether('0.1'),
            takingAmount: ether('0.01'),
            maker,
            verifyingContract: await inch.getAddress(),
        });
        const { r, vs } = await inchOrder.sign(maker);
        const inchTx = await inch.connect(taker).fillOrder(inchOrder.order, r, vs, inchOrder.order.takingAmount, fillWithMakingAmount(inchOrder.order.makingAmount));

        const matchaOrder = new MatchaOrder({
            chainId: await getChainId(),
            verifyingContract: await matcha.getAddress(),
            maker: maker.address,
            taker: taker.address,
            makerToken: await tokens.DAI.getAddress(),
            takerToken: await tokens.WETH.getAddress(),
            makerAmount: ether('0.1'),
            takerAmount: ether('0.01'),
        });
        const signature = await matchaOrder.sign(maker);
        const matchaTx = await matcha.connect(taker).fillLimitOrder(matchaOrder.order, signature, matchaOrder.order.takerAmount);

        const uniswapOrder = new UniswapOrder({
            chainId: await getChainId(),
            verifyingContract: await uniswap.getAddress(),
            deadline: Math.floor(Date.now() / 1000) + 1000,
            maker,
            nonce: await (new NonceManager(maker)).getNonce(),
            inputTokenAddress: await tokens.DAI.getAddress(),
            outputTokenAddress: await tokens.WETH.getAddress(),
            inputAmount: ether('0.1'),
            outputAmount: ether('0.01'),
            permit2contractAddress: PERMIT2CONTRACT,
        });
        const signedOrder = await uniswapOrder.sign(maker);
        const uniTx = await uniswap.connect(taker).execute(signedOrder);

        const paraswapOrder = new ParaswapOrder({
            maker,
            taker,
            makerAssetAddress: await tokens.DAI.getAddress(),
            takerAssetAddress: await tokens.WETH.getAddress(),
            makerAmount: ether('0.1').toString(),
            takerAmount: ether('0.01').toString(),
        });
        const txParams = await paraswapOrder.buildTxParams(await paraswapOrder.sign(maker), taker.address);
        const paraTx = await taker.sendTransaction(txParams);

        gasUsed['WETH => DAI'] = {
            inch: (await inchTx.wait()).gasUsed.toString(),
            matcha: (await matchaTx.wait()).gasUsed.toString(),
            paraswap: (await paraTx.wait()).gasUsed.toString(),
            uniswap: (await uniTx.wait()).gasUsed.toString(),
        };
    });
});
