const { ethers } = require("hardhat");

const PARASWAP_TOKEN_TRANSFER_PROXY = '0x216B4B4Ba9F3e719726886d34a177484278Bfcae';

const ProtocolKey = {
    INCH: '1inch',
    UNISWAP: 'uniswap',
    COWSWAP: 'cowswap',
    MATCHA: '0x',
    PARASWAP: 'paraswap',
}

function percentageOf(number, percentage) {
    return BigInt(number) * BigInt(percentage) / 100n;
}

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
}

module.exports = {
    percentageOf,
    ProtocolKey,
    makeAndBroadcastParaswapTx,
};
