const { ether, constants, permit2Contract } = require('@1inch/solidity-utils');
const { ethers, artifacts } = require('hardhat');
const { UniswapV2Pools } = require('./pools');

async function initRouterContracts() {
    const [addr1] = await ethers.getSigners();
    const inch = await ethers.getContractAt('IAggregationRouter', '0x111111125421ca6dc452d289314280a0f8842a65');
    const matcha = await ethers.getContractAt('IMatchaRouter', '0xdef1c0ded9bec7f1a1670819833240f027b25eff');
    const uniswapv2 = await ethers.getContractAt('IUniswapV2Router', '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D');
    const uniswapv3 = await ethers.getContractAt('IUniswapV3Router', '0xE592427A0AEce92De3Edee1F18E0157C05861564');
    const uniswapUniversal = await ethers.getContractAt('IUniswapUniversalRouter', '0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD');
    const permit2 = await permit2Contract();
    const paraswap = await ethers.getContractAt('IParaswapRouter', '0x000dB803A70511E09dA650D4C0506d0000100000');
    const settler = await ethers.getContractAt('ISettler', '0x70bf6634eE8Cb27D04478f184b9b8BB13E5f4710');
    const allowanceHolder = await ethers.getContractAt('IAllowanceHolder', '0x0000000000001fF3684f28c67538d4D072C22734');
    const iSettlerActions = new ethers.Interface((await artifacts.readArtifact('ISettlerActions')).abi);

    const tokens = {
        ETH: {
            async getAddress() {
                return constants.ZERO_ADDRESS;
            },
        },
        EEE: {
            async getAddress() {
                return '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';
            },
        },
        WETH: await ethers.getContractAt('IWETH', '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'),
        DAI: await ethers.getContractAt('IERC20', '0x6B175474E89094C44Da98b954EedeAC495271d0F'),
        USDC: await ethers.getContractAt('IERC20', '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'),
        USDT: await ethers.getContractAt('IERC20', '0xdAC17F958D2ee523a2206206994597C13D831ec7'),
    };

    ethers.provider.send('hardhat_setNextBlockBaseFeePerGas', ['0x0']);

    await tokens.DAI.approve(inch, ether('1'));
    await tokens.DAI.approve(matcha, ether('1'));
    await tokens.DAI.approve(uniswapv2, ether('1'));
    await tokens.DAI.approve(uniswapv3, ether('1'));
    await tokens.DAI.approve(paraswap, ether('1'));
    await tokens.DAI.approve(permit2, ether('1'));
    await tokens.DAI.approve(allowanceHolder, ether('1'));
    await permit2.approve(tokens.DAI, uniswapUniversal, ether('1'), Date.now());

    // Buy some tokens for warmup address and exchanges
    await addr1.sendTransaction({ to: '0x2a1530c4c41db0b0b2bb646cb5eb1a67b7158667', value: ether('1') }); // DAI
    await addr1.sendTransaction({ to: '0x97deC872013f6B5fB443861090ad931542878126', value: ether('1') }); // USDC
    await uniswapv2.swapExactETHForTokens(ether('0'), [tokens.WETH, tokens.USDT], addr1, ether('1'), { value: ether('1') }); // USDT
    await tokens.WETH.deposit({ value: ether('1') }); // WETH

    // Adjust UniswapV2 pools timestamps to avoid gas diff due to oracle updates
    const latestBlockTimestamp = (await ethers.provider.getBlock('latest')).timestamp;
    const nextBlockTimestamp = latestBlockTimestamp + 3600 * 1000;

    for (const pool of Object.values(UniswapV2Pools)) {
        const slotData = await ethers.provider.getStorage(pool, '0x8');
        await ethers.provider.send('hardhat_setStorageAt', [pool, '0x8', ethers.toBeHex(nextBlockTimestamp, 4) + slotData.slice(10)]);
    }
    await ethers.provider.send('evm_setNextBlockTimestamp', [nextBlockTimestamp]);

    function fakePermit({ nonce = 0n, deadline = '0xffffffff', permitted = { token: tokens.DAI.target, amount: ether('1') } } = {}) {
        return {
            nonce,
            deadline,
            permitted,
        };
    }

    return {
        addr1,
        tokens,
        inch,
        matcha,
        settler,
        allowanceHolder,
        fakePermit,
        iSettlerActions,
        paraswap,
        uniswapv2,
        uniswapv3,
        uniswapUniversal,
    };
}

module.exports = {
    initRouterContracts,
};
