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

module.exports = {
    percentageOf,
    ProtocolKey,
};
