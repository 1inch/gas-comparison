const { ether, constants } = require("@1inch/solidity-utils");
const { ethers } = require("hardhat");
const { PERMIT2_ADDRESS, SignatureTransfer } = require('@uniswap/permit2-sdk');
const fs = require('fs');

async function initRouterContracts () {
    const [addr1] = await ethers.getSigners();
    const inch = await ethers.getContractAt('IAggregationRouter', '0x111111125421ca6dc452d289314280a0f8842a65');
    const matcha = await ethers.getContractAt('IMatchaRouter', '0xdef1c0ded9bec7f1a1670819833240f027b25eff');
    const uniswapv2 = await ethers.getContractAt('IUniswapV2Router', '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D');
    const uniswapv3 = await ethers.getContractAt('IUniswapV3Router', '0xE592427A0AEce92De3Edee1F18E0157C05861564');
    const uniswapUniversalRouter = await ethers.getContractAt('IUniversalRouter', '0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD') // uniswap's latest router
    const paraswap = await ethers.getContractAt('IParaswapRouter', '0x000dB803A70511E09dA650D4C0506d0000100000');
    const settlerDeployer = await ethers.getContractAt([
        "function ownerOf(uint256) external view returns (address)",
        "function next(uint128) external view returns (address)",
      ], '0x00000000000004533Fe15556B1E086BB1A72cEae');
    const takerSubmitted = 2; 
    // the below line should be the following but fails because the chainId is wrong await ethers.getContractAt('ISettler', await settlerDeployer.ownerOf(takerSubmitted));
    const matcha2 =   await ethers.getContractAt('ISettler', '0x07e594aa718bb872b526e93eed830a8d2a6a1071'); 
    const settlerActionsABI = await JSON.parse(fs.readFileSync('./artifacts/contracts/interfaces/router/ISettlerActions.sol/ISettlerActions.json')).abi;
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
    await tokens.DAI.approve(uniswapv3, ether('1'));
    await tokens.DAI.approve(paraswap, ether('1'));
    await tokens.DAI.approve(uniswapUniversalRouter, ether('1'));
    await tokens.DAI.approve(PERMIT2_ADDRESS, ether('1'))

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

    let matcha2PermitData = await SignatureTransfer.getPermitData({
        permitted: {
            token: tokens.DAI.target,
            amount: ether('1')
        }, 
        spender: matcha2.target,
        nonce: 0n,
        deadline: Date.now() + 1000,
    }, PERMIT2_ADDRESS, 31337, undefined); // 31337 is the chain ID, used to validate the signer

    const permitSignature = await addr1.signTypedData(matcha2PermitData.domain, matcha2PermitData.types, matcha2PermitData.values);

    return { addr1, tokens, inch, matcha, matcha2, settlerActionsABI, paraswap, 
            uniswapv2, uniswapv3, uniswapUniversalRouter, matcha2PermitData, permitSignature };
}

/**
 * Set `blockTimestampLast` in uniswapv2 pools and next block timestamp to avoid oracle slot updates
 * @param {Object} ethers - An initialized ethers.js object with provider.
 * @param {Object} poolsV2 - A key:value mapping where each key represents a logical identifier and the value is the corresponding pool address.
 */
async function adjustV2PoolTimestamps(ethers, poolsV2) {
    const latestBlockTimestamp = (await ethers.provider.getBlock('latest')).timestamp;
    const nextBlockTimestamp = latestBlockTimestamp + 3600 * 1000;

    for (const pool of Object.values(poolsV2)) {
        const slotData = await ethers.provider.getStorage(pool, '0x8');
        await ethers.provider.send("hardhat_setStorageAt", [
            pool,
            '0x8',
            ethers.toBeHex(nextBlockTimestamp, 4) + slotData.slice(10),
        ]);
    }
    await ethers.provider.send('evm_setNextBlockTimestamp', [nextBlockTimestamp]);
}


module.exports = {
    initRouterContracts,
    adjustV2PoolTimestamps,
}
