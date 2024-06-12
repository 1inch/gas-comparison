const { ether, getEthPrice } = require("@1inch/solidity-utils");
const { ethers } = require("hardhat");

async function initRouterContracts () {
    const [addr1] = await ethers.getSigners();

    const inch = await ethers.getContractAt('IAggregationRouter', '0x111111125421ca6dc452d289314280a0f8842a65');
    const matcha = await ethers.getContractAt('IMatchaRouter', '0xdef1c0ded9bec7f1a1670819833240f027b25eff');
    const uniswapv2 = await ethers.getContractAt('IUniswapV2Router', '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D');
    const paraswap = await ethers.getContractAt('IParaswapRouter', '0x000dB803A70511E09dA650D4C0506d0000100000');

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
    await tokens.DAI.approve(uniswapv2, ether('1'));
    await tokens.DAI.approve(paraswap, ether('1'));

    // Buy some tokens for warmup address and exchanges
    await addr1.sendTransaction({ to: '0x2a1530c4c41db0b0b2bb646cb5eb1a67b7158667', value: ether('1') }); // DAI
    await addr1.sendTransaction({ to: '0x97deC872013f6B5fB443861090ad931542878126', value: ether('1') }); // USDC
    await uniswapv2.swapExactETHForTokens(
        ether('0'),
        [tokens.WETH, tokens.USDT],
        addr1,
        ether('1'),
        { value: ether('1') },
    ); // USDT
    await tokens.WETH.deposit({ value: ether('1') }); // WETH

    const ethPrice = await getEthPrice();

    return { addr1, tokens, inch, matcha, paraswap, uniswapv2, ethPrice };
}

module.exports = {
    initRouterContracts,
}
