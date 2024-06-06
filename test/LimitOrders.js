const hre = require('hardhat');
const { ethers, getChainId } = hre;
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');
const { NonceManager } = require('ethers');
const { ether, constants } = require('@1inch/solidity-utils');
const { fillWithMakingAmount, buildMakerTraits } = require('@1inch/limit-order-protocol-contract/test/helpers/orderUtils');
const { InchOrder, MatchaOrder, UniswapOrder, ParaswapOrder } = require('./helpers/orders');
const { expect } = require('chai');
const { ProtocolKey } = require('./helpers/utils');

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

    describe('ETH => DAI', async function () {
        async function initContractsWithCaseSettings () {
            const fixtureData = await initContracts();

            const GAS_USED_KEY = 'ETH => DAI';
            gasUsed[GAS_USED_KEY] = gasUsed[GAS_USED_KEY] || {};

            return {
                ...fixtureData,
                settings: {
                    GAS_USED_KEY,
                    makerToken: fixtureData.tokens.DAI,
                    takerToken: fixtureData.tokens.ETH,
                    makingAmount: ether('0.1'),
                    takingAmount: ether('0.01'),
                },
            };
        }

        it('1inch', async function () {
            const {
                maker, taker, tokens, inch,
                settings: { GAS_USED_KEY, makerToken, takerToken, makingAmount, takingAmount },
            } = await loadFixture(initContractsWithCaseSettings);

            // Create 1inch order, sign and fill it
            const inchOrder = new InchOrder({
                makerAsset: await makerToken.getAddress(),
                takerAsset: await takerToken.getAddress() !== await tokens.ETH.getAddress() ? await takerToken.getAddress() : await tokens.WETH.getAddress(),
                makingAmount,
                takingAmount,
                maker,
                verifyingContract: await inch.getAddress(),
                makerTraits: buildMakerTraits({ unwrapWeth: true }),
            });
            const { r, vs } = await inchOrder.sign(maker);
            const tx = await inch.connect(taker).fillOrder(
                inchOrder.order, r, vs, inchOrder.order.makingAmount, fillWithMakingAmount(inchOrder.order.makingAmount),
                { value: inchOrder.order.takingAmount },
            );
            await expect(tx).to.changeTokenBalances(makerToken, [maker, taker], [-inchOrder.order.makingAmount, inchOrder.order.makingAmount]);
            await expect(tx).to.changeEtherBalances([maker, taker], [inchOrder.order.takingAmount, -inchOrder.order.takingAmount], { includeFee: false });
            gasUsed[GAS_USED_KEY][ProtocolKey.INCH] = (await tx.wait()).gasUsed.toString();
        });

        it('uniswap', async function () {
            const {
                maker, taker, uniswap,
                settings: { GAS_USED_KEY, makerToken, takerToken, makingAmount, takingAmount },
            } = await loadFixture(initContractsWithCaseSettings);

            // Create Uniswap order, sign and fill it
            const uniswapOrder = new UniswapOrder({
                chainId: await getChainId(),
                verifyingContract: await uniswap.getAddress(),
                deadline: Math.floor(Date.now() / 1000) + 1000,
                maker,
                nonce: await (new NonceManager(maker)).getNonce(),
                inputTokenAddress: await makerToken.getAddress(),
                outputTokenAddress: await takerToken.getAddress(),
                inputAmount: makingAmount,
                outputAmount: takingAmount,
                permit2contractAddress: PERMIT2CONTRACT,
            });
            const signedOrder = await uniswapOrder.sign(maker);
            const tx = await uniswap.connect(taker).execute(signedOrder, { value: uniswapOrder.order.info.outputs[0].startAmount });
            await expect(tx).to.changeTokenBalances(makerToken, [maker, taker], [-uniswapOrder.order.info.input.startAmount, uniswapOrder.order.info.input.startAmount]);
            await expect(tx).to.changeEtherBalances([maker, taker], [uniswapOrder.order.info.outputs[0].startAmount, -uniswapOrder.order.info.outputs[0].startAmount], { includeFee: false });
            gasUsed[GAS_USED_KEY][ProtocolKey.UNISWAP] = (await tx.wait()).gasUsed.toString();
        });
    });

    describe('WETH => DAI', async function () {
        async function initContractsWithCaseSettings () {
            const fixtureData = await initContracts();

            const GAS_USED_KEY = 'WETH => DAI';
            gasUsed[GAS_USED_KEY] = gasUsed[GAS_USED_KEY] || {};

            return {
                ...fixtureData,
                settings: {
                    GAS_USED_KEY,
                    makerToken: fixtureData.tokens.DAI,
                    takerToken: fixtureData.tokens.WETH,
                    makingAmount: ether('0.1'),
                    takingAmount: ether('0.01'),
                },
            };
        }

        it('1inch', async function () {
            const {
                maker, taker, inch,
                settings: { GAS_USED_KEY, makerToken, takerToken, makingAmount, takingAmount },
            } = await loadFixture(initContractsWithCaseSettings);

            // Create 1inch order, sign and fill it
            const inchOrder = new InchOrder({
                makerAsset: await makerToken.getAddress(),
                takerAsset: await takerToken.getAddress(),
                makingAmount,
                takingAmount,
                maker,
                verifyingContract: await inch.getAddress(),
            });
            const { r, vs } = await inchOrder.sign(maker);
            const tx = await inch.connect(taker).fillOrder(inchOrder.order, r, vs, inchOrder.order.makingAmount, fillWithMakingAmount(inchOrder.order.makingAmount));
            await expect(tx).to.changeTokenBalances(makerToken, [maker, taker], [-inchOrder.order.makingAmount, inchOrder.order.makingAmount]);
            await expect(tx).to.changeTokenBalances(takerToken, [maker, taker], [inchOrder.order.takingAmount, -inchOrder.order.takingAmount]);
            gasUsed[GAS_USED_KEY][ProtocolKey.INCH] = (await tx.wait()).gasUsed.toString();
        });

        it('matcha', async function () {
            const {
                maker, taker, matcha,
                settings: { GAS_USED_KEY, makerToken, takerToken, makingAmount, takingAmount },
            } = await loadFixture(initContractsWithCaseSettings);

            // Create 0xProtocol order, sign and fill it
            const matchaOrder = new MatchaOrder({
                chainId: await getChainId(),
                verifyingContract: await matcha.getAddress(),
                maker: maker.address,
                taker: taker.address,
                makerToken: await makerToken.getAddress(),
                takerToken: await takerToken.getAddress(),
                makerAmount: makingAmount,
                takerAmount: takingAmount,
            });
            const signature = await matchaOrder.sign(maker);
            const tx = await matcha.connect(taker).fillLimitOrder(matchaOrder.order, signature, matchaOrder.order.takerAmount);
            await expect(tx).to.changeTokenBalances(makerToken, [maker, taker], [-matchaOrder.order.makerAmount, matchaOrder.order.makerAmount]);
            await expect(tx).to.changeTokenBalances(takerToken, [maker, taker], [matchaOrder.order.takerAmount, -matchaOrder.order.takerAmount]);
            gasUsed[GAS_USED_KEY][ProtocolKey.MATCHA] = (await tx.wait()).gasUsed.toString();
        });

        it('uniswap', async function () {
            const {
                maker, taker, uniswap,
                settings: { GAS_USED_KEY, makerToken, takerToken, makingAmount, takingAmount },
            } = await loadFixture(initContractsWithCaseSettings);

            // Create Uniswap order, sign and fill it
            const uniswapOrder = new UniswapOrder({
                chainId: await getChainId(),
                verifyingContract: await uniswap.getAddress(),
                deadline: Math.floor(Date.now() / 1000) + 1000,
                maker,
                nonce: await (new NonceManager(maker)).getNonce(),
                inputTokenAddress: await makerToken.getAddress(),
                outputTokenAddress: await takerToken.getAddress(),
                inputAmount: makingAmount,
                outputAmount: takingAmount,
                permit2contractAddress: PERMIT2CONTRACT,
            });
            const signedOrder = await uniswapOrder.sign(maker);
            const tx = await uniswap.connect(taker).execute(signedOrder);
            await expect(tx).to.changeTokenBalances(makerToken, [maker, taker], [-uniswapOrder.order.info.input.startAmount, uniswapOrder.order.info.input.startAmount]);
            await expect(tx).to.changeTokenBalances(takerToken, [maker, taker], [uniswapOrder.order.info.outputs[0].startAmount, -uniswapOrder.order.info.outputs[0].startAmount]);
            gasUsed[GAS_USED_KEY][ProtocolKey.UNISWAP] = (await tx.wait()).gasUsed.toString();
        });

        it('paraswap', async function () {
            const {
                maker, taker,
                settings: { GAS_USED_KEY, makerToken, takerToken, makingAmount, takingAmount },
            } = await loadFixture(initContractsWithCaseSettings);

            // Create Paraswap order, sign and fill it
            const paraswapOrder = new ParaswapOrder({
                maker,
                taker,
                makerAssetAddress: await makerToken.getAddress(),
                takerAssetAddress: await takerToken.getAddress(),
                makerAmount: makingAmount.toString(),
                takerAmount: takingAmount.toString(),
            });
            // First swap to clean up PARASWAP_TOKEN_TRANSFER_PROXY from extra amounts
            await taker.sendTransaction(await paraswapOrder.buildTxParams(await paraswapOrder.sign(maker), taker.address));
            // Main tx
            const tx = await taker.sendTransaction(await paraswapOrder.buildTxParams(await paraswapOrder.sign(maker), taker.address));
            await expect(tx).to.changeTokenBalances(makerToken, [maker, taker], [-BigInt(paraswapOrder.order.makerAmount), BigInt(paraswapOrder.order.makerAmount)]);
            await expect(tx).to.changeTokenBalances(takerToken, [maker, taker], [BigInt(paraswapOrder.order.takerAmount), -BigInt(paraswapOrder.order.takerAmount)]);
            gasUsed[GAS_USED_KEY][ProtocolKey.PARASWAP] = (await tx.wait()).gasUsed.toString();
        });
    });
});
