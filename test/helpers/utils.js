const ProtocolKey = {
    INCH: '1inch',
    UNISWAP: 'uniswap',
    COWSWAP: 'cowswap',
}

function percentageOf(number, percentage) {
    return BigInt(number) * BigInt(percentage) / 100n;
}

module.exports = {
    percentageOf,
    ProtocolKey,
};
