const axios = require('axios');
const { ethers, getChainId } = require('hardhat');
const { constants, trim0x } = require('@1inch/solidity-utils');
const { buildOrder } = require('@1inch/limit-order-protocol-contract/test/helpers/orderUtils');
const { LimitOrder, SignatureType } = require('@0x/protocol-utils');
const { DutchOrderBuilder } = require('@uniswap/uniswapx-sdk');
const {
    constructAxiosFetcher,
    constructBuildLimitOrder,
    constructEthersContractCaller,
    constructPartialSDK,
    constructSignLimitOrder,
    constructBuildLimitOrderTx,
} = require('@paraswap/sdk');

class InchOrder {
    order = {};
    verifyingContract = constants.ZERO_ADDRESS;

    OrderStruct = [
        { name: 'salt', type: 'uint256' },
        { name: 'maker', type: 'address' },
        { name: 'receiver', type: 'address' },
        { name: 'makerAsset', type: 'address' },
        { name: 'takerAsset', type: 'address' },
        { name: 'makingAmount', type: 'uint256' },
        { name: 'takingAmount', type: 'uint256' },
        { name: 'makerTraits', type: 'uint256' },
    ];

    constructor({
        makerAsset,
        takerAsset,
        makingAmount,
        takingAmount,
        maker,
        verifyingContract,
        makerTraits,
        makingAmountData,
        takingAmountData,
        postInteraction,
    }) {
        this.verifyingContract = verifyingContract;
        this.order = buildOrder(
            {
                makerAsset,
                takerAsset,
                makingAmount,
                takingAmount,
                maker: maker.address,
                makerTraits,
            },
            {
                makingAmountData,
                takingAmountData,
                postInteraction,
            },
        );
    }

    async sign(signer) {
        const signature = await signer.signTypedData(
            {
                name: '1inch Aggregation Router',
                version: '6',
                chainId: await getChainId(),
                verifyingContract: this.verifyingContract,
            },
            {
                Order: this.OrderStruct,
            },
            this.order,
        );
        const { r, yParityAndS: vs } = ethers.Signature.from(signature);
        return { r, vs };
    }
}

class MatchaOrder {
    order = {};
    verifyingContract = constants.ZERO_ADDRESS;

    OrderStruct = [
        { type: 'address', name: 'makerToken' },
        { type: 'address', name: 'takerToken' },
        { type: 'uint128', name: 'makerAmount' },
        { type: 'uint128', name: 'takerAmount' },
        { type: 'uint128', name: 'takerTokenFeeAmount' },
        { type: 'address', name: 'maker' },
        { type: 'address', name: 'taker' },
        { type: 'address', name: 'sender' },
        { type: 'address', name: 'feeRecipient' },
        { type: 'bytes32', name: 'pool' },
        { type: 'uint64', name: 'expiry' },
        { type: 'uint256', name: 'salt' },
    ];

    constructor({
        chainId,
        verifyingContract,
        maker,
        taker,
        makerToken,
        takerToken,
        makerAmount,
        takerAmount,
        takerTokenFeeAmount = 0n,
        expiry = '0xff000000',
        salt = BigInt(Date.now()),
    }) {
        this.verifyingContract = verifyingContract;
        this.order = new LimitOrder({
            chainId,
            verifyingContract,
            maker,
            taker,
            makerToken,
            takerToken,
            makerAmount,
            takerAmount,
            takerTokenFeeAmount,
            expiry,
            salt,
        });
    }

    async sign(signer) {
        const sig = await signer.signTypedData(
            {
                name: 'ZeroEx',
                version: '1.0.0',
                chainId: '1',
                verifyingContract: this.verifyingContract,
            },
            {
                LimitOrder: this.OrderStruct,
            },
            this.order,
        );

        const { r, s, yParity: v } = ethers.Signature.from(sig);
        return {
            r,
            s,
            v: v + 27,
            signatureType: SignatureType.EIP712,
        };
    }
}

class UniswapOrder {
    order = {};
    verifyingContract = constants.ZERO_ADDRESS;

    constructor({
        chainId,
        verifyingContract,
        deadline,
        maker,
        nonce,
        inputTokenAddress,
        outputTokenAddress,
        inputAmount,
        inputStartAmount = inputAmount,
        inputEndAmount = inputAmount,
        outputAmount,
        outputStartAmount = outputAmount,
        outputEndAmount = outputAmount,
        permit2contractAddress,
    }) {
        this.verifyingContract = verifyingContract;
        const builder = new DutchOrderBuilder(chainId, verifyingContract, permit2contractAddress);

        {
            // TODO: remove when @uniswap/uniswapx-sdk will move to ethers v6
            builder.output = function (output) {
                const tslib_1 = require('tslib');
                const tiny_invariant_1 = tslib_1.__importDefault(require('tiny-invariant'));

                if (!builder.info.outputs) {
                    builder.info.outputs = [];
                }
                (0, tiny_invariant_1.default)(
                    output.startAmount >= output.endAmount,
                    `startAmount must be greater than endAmount: ${output.startAmount.toString()}`,
                );
                builder.info.outputs.push(output);
                return builder;
            };
            builder.info.exclusivityOverrideBps = BigInt(builder.info.exclusivityOverrideBps);
        }

        this.order = builder
            .deadline(deadline)
            .decayEndTime(deadline)
            .decayStartTime(deadline - 100)
            .swapper(maker.address)
            .nonce(nonce)
            .input({
                token: inputTokenAddress,
                startAmount: inputStartAmount,
                endAmount: inputEndAmount,
            })
            .output({
                token: outputTokenAddress,
                startAmount: outputStartAmount,
                endAmount: outputEndAmount,
                recipient: maker.address,
            })
            .build();
    }

    async sign(signer) {
        const { domain, types, values } = this.order.permitData();
        return {
            order: this.order.serialize(),
            sig: await signer.signTypedData(domain, types, values),
        };
    }
}

class ParaswapOrder {
    order = {};
    maker = {};
    taker = {};

    constructor({ maker, taker, makerAssetAddress, takerAssetAddress, makerAmount, takerAmount }) {
        this.maker = constructPartialSDK(
            {
                chainId: 1,
                fetcher: constructAxiosFetcher(axios),
                contractCaller: constructEthersContractCaller(
                    {
                        ethersProviderOrSigner: ethers.provider,
                        EthersContract: ethers.Contract,
                    },
                    maker,
                ),
            },
            constructBuildLimitOrder,
            constructSignLimitOrder,
        );
        this.taker = constructPartialSDK(
            {
                chainId: 1,
                fetcher: constructAxiosFetcher(axios),
                contractCaller: constructEthersContractCaller(
                    {
                        ethersProviderOrSigner: ethers.provider,
                        EthersContract: ethers.Contract,
                    },
                    taker,
                ),
            },
            constructBuildLimitOrderTx,
        );

        this.order = {
            maker: maker.address,
            taker: constants.ZERO_ADDRESS,
            expiry: 0,
            makerAsset: makerAssetAddress,
            takerAsset: takerAssetAddress,
            makerAmount,
            takerAmount,
        };
    }

    async sign(signer) {
        const signableOrderData = await this.maker.buildLimitOrder(this.order);
        signableOrderData.domain.chainId = await getChainId();
        return {
            ...signableOrderData.data,
            signature: await signer.signTypedData(signableOrderData.domain, signableOrderData.types, signableOrderData.data),
        };
    }

    async buildTxParams(orderWithSignature, userAddress) {
        const txParams = await this.taker.buildLimitOrderTx({
            srcDecimals: 18,
            destDecimals: 18,
            userAddress,
            orders: [orderWithSignature],
            ignoreChecks: true,
        });
        const filteredTxParams = ['from', 'to', 'value', 'data'].reduce((acc, key) => {
            acc[key] = txParams[key];
            return acc;
        }, {});
        return filteredTxParams;
    }
}

class CowswapOrder {
    order = {};
    verifyingContract = constants.ZERO_ADDRESS;

    ORDER_SRTUCT = [
        { name: 'sellToken', type: 'address' },
        { name: 'buyToken', type: 'address' },
        { name: 'receiver', type: 'address' },
        { name: 'sellAmount', type: 'uint256' },
        { name: 'buyAmount', type: 'uint256' },
        { name: 'validTo', type: 'uint32' },
        { name: 'appData', type: 'bytes32' },
        { name: 'feeAmount', type: 'uint256' },
        { name: 'kind', type: 'string' },
        { name: 'partiallyFillable', type: 'bool' },
        { name: 'sellTokenBalance', type: 'string' },
        { name: 'buyTokenBalance', type: 'string' },
    ];

    OrderKind = {
        SELL: 'sell',
        BUY: 'buy',
    };

    OrderBalance = {
        ERC20: 'erc20',
        EXTERNAL: 'external',
        INTERNAL: 'internal',
    };

    SigningScheme = {
        EIP712: 0b00,
        ETHSIGN: 0b01,
        EIP1271: 0b10,
        PRESIGN: 0b11,
    };

    FLAG_MASKS = {
        kind: {
            offset: 0,
            options: [this.OrderKind.SELL, this.OrderKind.BUY],
        },
        partiallyFillable: {
            offset: 1,
            options: [false, true],
        },
        sellTokenBalance: {
            offset: 2,
            options: [
                this.OrderBalance.ERC20,
                undefined, // unused
                this.OrderBalance.EXTERNAL,
                this.OrderBalance.INTERNAL,
            ],
        },
        buyTokenBalance: {
            offset: 4,
            options: [this.OrderBalance.ERC20, this.OrderBalance.INTERNAL],
        },
        signingScheme: {
            offset: 5,
            options: [this.SigningScheme.EIP712, this.SigningScheme.ETHSIGN, this.SigningScheme.EIP1271, this.SigningScheme.PRESIGN],
        },
    };

    constructor({ makingAmount, takingAmount, maker, makerAsset, takerAsset, destination = maker.address, verifyingContract }) {
        if (makerAsset == null || takerAsset == null || destination == null || makingAmount == null || takingAmount == null) {
            throw new Error('Missing required fields.');
        }
        this.order = {
            sellToken: makerAsset,
            buyToken: takerAsset,
            receiver: destination,
            sellAmount: makingAmount,
            buyAmount: takingAmount,
            validTo: '0xffffffff', // uint32
            appData: '0x', // bytes32
            feeAmount: 0n, // uint256
            kind: 'sell', // bytes32 ("sell" or "buy")
            partiallyFillable: false, // bool (false - OrderKind.SELL)
            sellTokenBalance: 'erc20', // bytes32 ("erc20", "external", "internal")
            buyTokenBalance: 'erc20', // bytes32 ("erc20", "external", "internal")
        };
        this.verifyingContract = verifyingContract;
    }

    async sign(signer) {
        return await signer.signTypedData(
            {
                name: 'Gnosis Protocol',
                version: 'v2',
                chainId: '1',
                verifyingContract: this.verifyingContract,
            },
            {
                Order: this.ORDER_SRTUCT,
            },
            {
                ...this.order,
                appData: trim0x(this.order.appData).length > 0 ? this.order.appData : '0x0000000000000000000000000000000000000000000000000000000000000000',
            },
        );
    }

    async buildTrade(signature, tokens = [this.order.sellToken, this.order.buyToken], executedAmount = this.order.buyAmount) {
        return {
            sellTokenIndex: tokens.indexOf(this.order.sellToken),
            buyTokenIndex: tokens.indexOf(this.order.buyToken),
            receiver: this.order.receiver,
            sellAmount: this.order.sellAmount,
            buyAmount: this.order.buyAmount,
            validTo: this.order.validTo,
            appData: trim0x(this.order.appData).length > 0 ? this.order.appData : '0x0000000000000000000000000000000000000000000000000000000000000000',
            feeAmount: this.order.feeAmount,
            flags: this.encodeTradeFlags(this.order),
            executedAmount,
            signature,
        };
    }

    encodeFlag(key, flag) {
        const index = this.FLAG_MASKS[key].options.findIndex((search) => search === flag);
        if (index === undefined) {
            throw new Error(`Bad key/value pair to encode: ${key}/${flag}`);
        }
        return index << this.FLAG_MASKS[key].offset;
    }

    encodeOrderFlags(flags) {
        return (
            this.encodeFlag('kind', flags.kind) |
            this.encodeFlag('partiallyFillable', flags.partiallyFillable) |
            this.encodeFlag('sellTokenBalance', flags.sellTokenBalance ?? 'erc20') |
            this.encodeFlag('buyTokenBalance', this.normalizeBuyTokenBalance(flags.buyTokenBalance))
        );
    }

    encodeTradeFlags(flags) {
        return this.encodeOrderFlags(flags) | this.encodeFlag('signingScheme', this.SigningScheme.EIP712);
    }

    normalizeBuyTokenBalance(balance) {
        switch (balance) {
            case undefined:
            case this.OrderBalance.ERC20:
            case this.OrderBalance.EXTERNAL:
                return this.OrderBalance.ERC20;
            case this.OrderBalance.INTERNAL:
                return this.OrderBalance.INTERNAL;
            default:
                throw new Error(`invalid order balance ${balance}`);
        }
    }
}

module.exports = {
    InchOrder,
    CowswapOrder,
    MatchaOrder,
    ParaswapOrder,
    UniswapOrder,
};
