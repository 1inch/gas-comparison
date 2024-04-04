const hre = require('hardhat');
const { ethers, getChainId } = hre;
const { NonceManager } = require('ethers');
const { loadFixture, time } = require('@nomicfoundation/hardhat-network-helpers');
const { ether, constants, deployContract, trim0x } = require('@1inch/solidity-utils');
const { buildAuctionDetails, buildExtensionsBitmapData } = require('@1inch/limit-order-settlement/test/helpers/fusionUtils');
const { buildMakerTraits, buildTakerTraits } = require('@1inch/limit-order-protocol-contract/test/helpers/orderUtils');
const { InchOrder, UniswapOrder, CowswapOrder } = require('./helpers/orders');

const COWSWAP_VAULT_RELAYER_MAINNET_ADDRESS = '0xC92E8bdf79f0507f65a392b0ab4667716BFE0110';
const PERMIT2CONTRACT = '0x000000000022D473030F116dDEE9F6B43aC78BA3';
const abiCoder = ethers.AbiCoder.defaultAbiCoder();

describe('Fusion', async function () {
    const gasUsed = {};

    after(async function () {
        console.table(gasUsed);
    });

    async function initContracts () {
        const [maker, taker] = await ethers.getSigners();

        const tokens = {
            ETH: {
                async getAddress () { return constants.ZERO_ADDRESS; },
            },
            EEE: {
                async getAddress () { return '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'; },
            },
            '1INCH': await ethers.getContractAt('IERC20', '0x111111111117dC0aa78b770fA6A738034120C302'),
            WETH: await ethers.getContractAt('IWETH', '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'),
            DAI: await ethers.getContractAt('IERC20', '0x6B175474E89094C44Da98b954EedeAC495271d0F'),
        };

        // Init fusion contracts
        const inch = await ethers.getContractAt('LimitOrderProtocol', '0x111111125421ca6dc452d289314280a0f8842a65');
        const settlement = await deployContract('Settlement', [inch, tokens['1INCH']]);
        const uniswap = await ethers.getContractAt('IReactor', '0x6000da47483062A0D734Ba3dc7576Ce6A0B645C4');
        const cowswap = await ethers.getContractAt('ICowswapGPv2Settlement', '0x9008D19f58AAbD9eD0D60971565AA8510560ab41');

        // Init and warmup wallets
        for (const wallet of [maker, taker]) {
            // Buy some DAI
            await wallet.sendTransaction({ to: '0x2a1530c4c41db0b0b2bb646cb5eb1a67b7158667', value: ether('1') });
            // Buy some WETH
            await tokens.WETH.connect(wallet).deposit({ value: ether('1') });

            for (const token of [tokens.DAI, tokens.WETH]) {
                await token.connect(wallet).approve(inch, ether('1'));
                await token.connect(wallet).approve(uniswap, ether('1'));
                await token.connect(wallet).approve(PERMIT2CONTRACT, ether('1'));
                await token.connect(wallet).approve(COWSWAP_VAULT_RELAYER_MAINNET_ADDRESS, ether('1'));
            }
        }

        // Init resolver
        const Resolver = await ethers.getContractFactory('Resolver');
        const resolver = await Resolver.connect(taker).deploy(inch, uniswap, cowswap);
        // for case when resolver use its own funds
        await tokens.WETH.connect(taker).deposit({ value: ether('1') });
        await tokens.WETH.connect(taker).transfer(resolver, ether('1'));
        // for case when resolver use taker funds
        await tokens.WETH.connect(taker).approve(resolver, ether('1'));
        // warmup resolver
        await tokens.DAI.connect(taker).transfer(resolver, ether('1'));

        // Set our resolver for cowswap protocol
        const authenticator = await cowswap.authenticator();
        const authenticatorContract = await ethers.getContractAt('ICowswapGPv2Authentication', authenticator);
        const managerAddress = await authenticatorContract.manager();
        await ethers.provider.send('hardhat_impersonateAccount', [managerAddress]);
        const manager = await ethers.getSigner(managerAddress);
        // set our solvers for cowswap protocol
        await authenticatorContract.connect(manager).addSolver(taker);
        await authenticatorContract.connect(manager).addSolver(resolver);

        for (const token of [tokens.DAI, tokens.WETH]) {
            await resolver.connect(taker).approve(token, inch);
            await resolver.connect(taker).approve(token, uniswap);
            await resolver.connect(taker).approve(token, COWSWAP_VAULT_RELAYER_MAINNET_ADDRESS);
        }

        const maxPriorityFeePerGas = (await ethers.provider.getBlock('latest')).baseFeePerGas / 2n;

        return { maker, taker, tokens, inch, settlement, resolver, uniswap, cowswap, maxPriorityFeePerGas };
    }

    it('WETH => DAI by EOA', async function () {
        const { maker, taker, tokens, inch, settlement, uniswap, cowswap, maxPriorityFeePerGas } = await loadFixture(initContracts);

        // Create 1inch settlement order, sign and fill it
        const auctionStartTime = await time.latest();
        const { details: auctionDetails } = await buildAuctionDetails({ startTime: auctionStartTime, duration: time.duration.hours(1), initialRateBump: 1000000 });
        const inchOrder = new InchOrder({
            makerAsset: await tokens.DAI.getAddress(),
            takerAsset: await tokens.WETH.getAddress(),
            makingAmount: ether('0.1'),
            takingAmount: ether('0.01'),
            maker,
            verifyingContract: await inch.getAddress(),
            makerTraits: buildMakerTraits(),
            makingAmountData: await settlement.getAddress() + trim0x(auctionDetails),
            takingAmountData: await settlement.getAddress() + trim0x(auctionDetails),
            postInteraction: await settlement.getAddress() + trim0x(ethers.solidityPacked(
                ['uint32', 'bytes10', 'uint16', 'bytes1'],
                [auctionStartTime, '0x' + taker.address.substring(22), 0, buildExtensionsBitmapData()],
            )),
        });
        const { r, vs } = await inchOrder.sign(maker);
        const takerTraits = buildTakerTraits({
            makingAmount: true,
            minReturn: ether('0.09'),
            extension: inchOrder.order.extension,
        });
        const inchTx = await inch.connect(taker).fillOrderArgs(
            inchOrder.order,
            r,
            vs,
            ether('0.01'),
            takerTraits.traits,
            takerTraits.args,
            {
                maxPriorityFeePerGas,
            },
        );

        // Create Uniswap settlement order, sign and fill it
        const uniswapOrder = new UniswapOrder({
            chainId: await getChainId(),
            verifyingContract: await uniswap.getAddress(),
            deadline: Math.floor(Date.now() / 1000) + 1000,
            maker,
            nonce: await (new NonceManager(maker)).getNonce(),
            inputTokenAddress: await tokens.DAI.getAddress(),
            outputTokenAddress: await tokens.WETH.getAddress(),
            inputAmount: ether('0.1'),
            outputStartAmount: ether('0.01'),
            outputEndAmount: ether('0.009'),
            permit2contractAddress: PERMIT2CONTRACT,
        });
        const signedOrder = await uniswapOrder.sign(maker);
        const uniTx = await uniswap.connect(taker).execute(signedOrder, {
            maxPriorityFeePerGas,
        });

        // Create Cowswap settlement order, sign and fill it
        const cowswapOrder = new CowswapOrder({
            makingAmount: ether('0.1'),
            takingAmount: ether('0.01'),
            maker,
            makerAsset: await tokens.DAI.getAddress(),
            takerAsset: await tokens.WETH.getAddress(),
            destination: taker.address,
            verifyingContract: await cowswap.getAddress(),
        });
        const cowTx = await cowswap.connect(taker).settle(
            [cowswapOrder.order.sellToken, cowswapOrder.order.buyToken],
            [cowswapOrder.order.buyAmount, cowswapOrder.order.sellAmount],
            [await cowswapOrder.buildTrade(await cowswapOrder.sign(maker))],
            [
                [],
                [
                    {
                        value: 0,
                        target: cowswapOrder.order.sellToken,
                        callData: tokens.DAI.interface.encodeFunctionData('transfer', [
                            taker.address,
                            cowswapOrder.order.sellAmount,
                        ]),
                    },
                ],
                [],
            ],
            {
                maxPriorityFeePerGas,
            },
        );

        gasUsed['WETH => DAI w/o callback by EOA'] = {
            '1inch': (await inchTx.wait()).gasUsed.toString(),
            uniswap: (await uniTx.wait()).gasUsed.toString(),
            cowswap: (await cowTx.wait()).gasUsed.toString(),
        };
    });

    it('WETH => DAI without callback by resolver contract', async function () {
        const { maker, tokens, inch, settlement, resolver, uniswap, cowswap, maxPriorityFeePerGas } = await loadFixture(initContracts);

        // Create 1inch settlement order, sign and fill it
        const auctionStartTime = await time.latest();
        const { details: auctionDetails } = await buildAuctionDetails({ startTime: auctionStartTime, duration: time.duration.hours(1), initialRateBump: 1000000 });
        const inchOrder = new InchOrder({
            makerAsset: await tokens.DAI.getAddress(),
            takerAsset: await tokens.WETH.getAddress(),
            makingAmount: ether('0.1'),
            takingAmount: ether('0.01'),
            maker,
            verifyingContract: await inch.getAddress(),
            makerTraits: buildMakerTraits(),
            makingAmountData: await settlement.getAddress() + trim0x(auctionDetails),
            takingAmountData: await settlement.getAddress() + trim0x(auctionDetails),
            postInteraction: await settlement.getAddress() + trim0x(ethers.solidityPacked(
                ['uint32', 'bytes10', 'uint16', 'bytes1'], [auctionStartTime, '0x' + resolver.target.substring(22), 0, buildExtensionsBitmapData()],
            )),
        });
        const { r, vs } = await inchOrder.sign(maker);
        const takerTraits = buildTakerTraits({
            makingAmount: true,
            minReturn: inchOrder.order.makingAmount * 9n / 10n,
            extension: inchOrder.order.extension,
        });
        const inchTx = await resolver.settleOrders(
            inch.interface.encodeFunctionData('fillOrderArgs', [
                inchOrder.order,
                r,
                vs,
                ether('0.01'),
                takerTraits.traits,
                takerTraits.args,
            ]),
            {
                maxPriorityFeePerGas,
            },
        );

        // Create Uniswap settlement order, sign and fill it
        const uniswapOrder = new UniswapOrder({
            chainId: await getChainId(),
            verifyingContract: await uniswap.getAddress(),
            deadline: Math.floor(Date.now() / 1000) + 1000,
            maker,
            nonce: await (new NonceManager(maker)).getNonce(),
            inputTokenAddress: await tokens.DAI.getAddress(),
            outputTokenAddress: await tokens.WETH.getAddress(),
            inputAmount: ether('0.1'),
            outputStartAmount: ether('0.01'),
            outputEndAmount: ether('0.009'),
            permit2contractAddress: PERMIT2CONTRACT,
        });
        const signedOrder = await uniswapOrder.sign(maker);
        const uniTx = await resolver.settleUniswapXOrders(
            0,
            uniswap.interface.encodeFunctionData('execute', [
                signedOrder,
            ]),
            {
                maxPriorityFeePerGas,
            },
        );

        // Create Cowswap settlement order, sign and fill it
        const cowswapOrder = new CowswapOrder({
            makingAmount: ether('0.1'),
            takingAmount: ether('0.01'),
            maker,
            makerAsset: await tokens.DAI.getAddress(),
            takerAsset: await tokens.WETH.getAddress(),
            destination: await resolver.getAddress(),
            verifyingContract: await cowswap.getAddress(),
        });
        const cowTx = await resolver.settleCowswapOrders(
            0,
            cowswap.interface.encodeFunctionData('settle', [
                [cowswapOrder.order.sellToken, cowswapOrder.order.buyToken],
                [cowswapOrder.order.buyAmount, cowswapOrder.order.sellAmount],
                [await cowswapOrder.buildTrade(await cowswapOrder.sign(maker))],
                [
                    [],
                    [
                        {
                            value: 0,
                            target: cowswapOrder.order.sellToken,
                            callData: tokens.DAI.interface.encodeFunctionData('transfer', [
                                await resolver.getAddress(),
                                cowswapOrder.order.sellAmount,
                            ]),
                        },
                    ],
                    [],
                ],
            ]),
            {
                maxPriorityFeePerGas,
            },
        );

        gasUsed['WETH => DAI w/o callback by contract'] = {
            '1inch': (await inchTx.wait()).gasUsed.toString(),
            uniswap: (await uniTx.wait()).gasUsed.toString(),
            cowswap: (await cowTx.wait()).gasUsed.toString(),
        };
    });

    it('WETH => DAI with callback when resolver use taker funds', async function () {
        const { maker, taker, tokens, inch, settlement, resolver, uniswap, cowswap, maxPriorityFeePerGas } = await loadFixture(initContracts);

        // Create 1inch settlement order, sign and fill it
        const auctionStartTime = await time.latest();
        const { details: auctionDetails } = await buildAuctionDetails({ startTime: auctionStartTime, duration: time.duration.hours(1) });
        const inchOrder = new InchOrder({
            makerAsset: await tokens.DAI.getAddress(),
            takerAsset: await tokens.WETH.getAddress(),
            makingAmount: ether('0.1'),
            takingAmount: ether('0.01'),
            maker,
            verifyingContract: await inch.getAddress(),
            makerTraits: buildMakerTraits(),
            makingAmountData: await settlement.getAddress() + trim0x(auctionDetails),
            takingAmountData: await settlement.getAddress() + trim0x(auctionDetails),
            postInteraction: await settlement.getAddress() + trim0x(ethers.solidityPacked(
                ['uint32', 'bytes10', 'uint16', 'bytes1'], [auctionStartTime, '0x' + resolver.target.substring(22), 0, buildExtensionsBitmapData()],
            )),
        });
        const { r, vs } = await inchOrder.sign(maker);
        const resolverArgs = abiCoder.encode(
            ['address[]', 'bytes[]'],
            [
                [await tokens.WETH.getAddress()],
                [
                    tokens.WETH.interface.encodeFunctionData('transferFrom', [
                        taker.address,
                        await resolver.getAddress(),
                        inchOrder.order.takingAmount,
                    ]),
                ],
            ],
        );
        const takerTraits = buildTakerTraits({
            makingAmount: true,
            minReturn: inchOrder.order.makingAmount * 9n / 10n,
            extension: inchOrder.order.extension,
            interaction: await resolver.getAddress() + '01' + trim0x(resolverArgs),
        });
        const inchTx = await resolver.connect(taker).settleOrders(
            inch.interface.encodeFunctionData('fillOrderArgs', [
                inchOrder.order,
                r,
                vs,
                ether('0.01'),
                takerTraits.traits,
                takerTraits.args,
            ]),
            {
                maxPriorityFeePerGas,
            },
        );

        // Create Uniswap settlement order, sign and fill it
        const uniswapOrder = new UniswapOrder({
            chainId: await getChainId(),
            verifyingContract: await uniswap.getAddress(),
            deadline: Math.floor(Date.now() / 1000) + 1000,
            maker,
            nonce: await (new NonceManager(maker)).getNonce(),
            inputTokenAddress: await tokens.DAI.getAddress(),
            outputTokenAddress: await tokens.WETH.getAddress(),
            inputAmount: ether('0.1'),
            outputStartAmount: ether('0.01'),
            outputEndAmount: ether('0.009'),
            permit2contractAddress: PERMIT2CONTRACT,
        });
        const signedOrder = await uniswapOrder.sign(maker);
        const resolverCalldata = abiCoder.encode(
            ['bytes[]'],
            [
                [await tokens.WETH.getAddress() + trim0x(tokens.WETH.interface.encodeFunctionData('transferFrom', [
                    taker.address, await resolver.getAddress(), uniswapOrder.order.info.outputs[0].startAmount,
                ]))],
            ],
        );
        const uniTx = await resolver.settleUniswapXOrders(
            0,
            uniswap.interface.encodeFunctionData('executeWithCallback', [
                signedOrder,
                '0x' + abiCoder.encode(['bytes[]'], [[resolverCalldata]]).slice(66), // skip 0x and 32 bytes of location
            ]),
            {
                maxPriorityFeePerGas,
            },
        );

        // Create Cowswap settlement order, sign and fill it
        const cowswapOrder = new CowswapOrder({
            makingAmount: ether('0.1'),
            takingAmount: ether('0.01'),
            maker,
            makerAsset: await tokens.DAI.getAddress(),
            takerAsset: await tokens.WETH.getAddress(),
            destination: await resolver.getAddress(),
            verifyingContract: await cowswap.getAddress(),
        });
        const cowTx = await resolver.settleCowswapOrders(
            0,
            cowswap.interface.encodeFunctionData('settle', [
                [cowswapOrder.order.sellToken, cowswapOrder.order.buyToken],
                [cowswapOrder.order.buyAmount, cowswapOrder.order.sellAmount],
                [await cowswapOrder.buildTrade(await cowswapOrder.sign(maker))],
                [
                    [],
                    [
                        {
                            value: 0,
                            target: cowswapOrder.order.sellToken,
                            callData: tokens.DAI.interface.encodeFunctionData('transfer', [
                                await resolver.getAddress(),
                                cowswapOrder.order.sellAmount,
                            ]),
                        },
                        {
                            value: 0,
                            target: await resolver.getAddress(),
                            callData: resolver.interface.encodeFunctionData('cowswapResolve', [
                                abiCoder.encode(
                                    ['bytes[]'],
                                    [
                                        [
                                            await tokens.WETH.getAddress() + trim0x(tokens.WETH.interface.encodeFunctionData('transferFrom', [
                                                taker.address, await cowswap.getAddress(), cowswapOrder.order.buyAmount,
                                            ])),
                                        ],
                                    ],
                                ),
                            ]),
                        },
                    ],
                    [],
                ],
            ]),
            {
                maxPriorityFeePerGas,
            },
        );

        gasUsed['WETH => DAI with callback, taker funds'] = {
            '1inch': (await inchTx.wait()).gasUsed.toString(),
            uniswap: (await uniTx.wait()).gasUsed.toString(),
            cowswap: (await cowTx.wait()).gasUsed.toString(),
        };
    });
});
