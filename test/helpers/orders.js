const axios = require('axios');
const { ethers, getChainId } = require('hardhat');
const { constants } = require('@1inch/solidity-utils');
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

    constructor ({ makerAsset, takerAsset, makingAmount, takingAmount, maker, verifyingContract }) {
        this.verifyingContract = verifyingContract;
        this.order = buildOrder({
            makerAsset,
            takerAsset,
            makingAmount,
            takingAmount,
            maker: maker.address,
        });
    }

    async sign (signer) {
        const signature = await signer.signTypedData({
            name: '1inch Aggregation Router',
            version: '6',
            chainId: await getChainId(),
            verifyingContract: this.verifyingContract,
        }, {
            Order: this.OrderStruct,
        }, this.order);
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

    constructor ({
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

    async sign (signer) {
        const sig = await signer.signTypedData({
            name: 'ZeroEx',
            version: '1.0.0',
            chainId: '1',
            verifyingContract: this.verifyingContract,
        }, {
            LimitOrder: this.OrderStruct,
        }, this.order);

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

    constructor ({
        chainId,
        verifyingContract,
        deadline,
        maker,
        nonce,
        inputTokenAddress,
        outputTokenAddress,
        inputAmount,
        outputAmount,
        permit2contractAddress,
    }) {
        this.verifyingContract = verifyingContract;
        const builder = new DutchOrderBuilder(chainId, verifyingContract, permit2contractAddress);

        { // eslint-disable-line no-lone-blocks
            // TODO: remove when @uniswap/uniswapx-sdk will move to ethers v6
            builder.output = function (output) {
                const tslib_1 = require('tslib'); // eslint-disable-line camelcase
                const tiny_invariant_1 = tslib_1.__importDefault(require('tiny-invariant')); // eslint-disable-line camelcase

                if (!builder.info.outputs) {
                    builder.info.outputs = [];
                }
                // eslint-disable-next-line camelcase
                (0, tiny_invariant_1.default)(output.startAmount >= output.endAmount, `startAmount must be greater than endAmount: ${output.startAmount.toString()}`);
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
                startAmount: inputAmount,
                endAmount: inputAmount,
            })
            .output({
                token: outputTokenAddress,
                startAmount: outputAmount,
                endAmount: outputAmount,
                recipient: maker.address,
            })
            .build();
    }

    async sign (signer) {
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

    constructor ({
        maker,
        taker,
        makerAssetAddress,
        takerAssetAddress,
        makerAmount,
        takerAmount,
    }) {
        this.maker = constructPartialSDK({
            chainId: 1,
            fetcher: constructAxiosFetcher(axios),
            contractCaller: constructEthersContractCaller({
                ethersProviderOrSigner: ethers.provider,
                EthersContract: ethers.Contract,
            }, maker),
        },
        constructBuildLimitOrder,
        constructSignLimitOrder,
        );
        this.taker = constructPartialSDK({
            chainId: 1,
            fetcher: constructAxiosFetcher(axios),
            contractCaller: constructEthersContractCaller({
                ethersProviderOrSigner: ethers.provider,
                EthersContract: ethers.Contract,
            }, taker),
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

    async sign (signer) {
        const signableOrderData = await this.maker.buildLimitOrder(this.order);
        signableOrderData.domain.chainId = await getChainId();
        return {
            ...signableOrderData.data,
            signature: await signer.signTypedData(signableOrderData.domain, signableOrderData.types, signableOrderData.data),
        };
    }

    async buildTxParams (orderWithSignature, userAddress) {
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

module.exports = {
    InchOrder,
    MatchaOrder,
    ParaswapOrder,
    UniswapOrder,
};
