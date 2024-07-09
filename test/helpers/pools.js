const UniswapV2Pools = {
    WETH_DAI: '0xa478c2975ab1ea89e8196811f51a7b7ade33eb11',
    WETH_USDC: '0xb4e16d0168e52d35cacd2c6185b44281ec28c9dc',
    USDC_DAI: '0xae461ca67b15dc8dc81ce7615e0320da1a9ab8d5',
    USDC_USDT: '0x3041cbd36888becc7bbcbc0045e3b1f144466f5f',
};

const UniswapV3Pools = {
    WETH_DAI: { address: '0xc2e9f25be6257c210d7adf0d4cd6e3e881ba25f8', fee: 3000 },
    WETH_USDC: { address: '0x8ad599c3a0ff1de082011efddc58f1908eb6e6d8', fee: 3000 },
    USDC_DAI: { address: '0x6c6bc977e13df9b0de53b251522280bb72383700', fee: 500 },
    USDT_USDC: { address: '0x7858e59e0c01ea06df3af3d20ac7b0003275d4bf', fee: 500 },
};

module.exports = {
    UniswapV2Pools,
    UniswapV3Pools,
};
