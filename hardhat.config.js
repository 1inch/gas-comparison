require('@nomicfoundation/hardhat-chai-matchers');
require('@nomicfoundation/hardhat-ethers');
require('@nomicfoundation/hardhat-verify');
require('dotenv').config();
require('hardhat-dependency-compiler');
require('hardhat-deploy');
require('hardhat-gas-reporter');
require('hardhat-tracer');
require('solidity-coverage');

const { Networks, getNetwork } = require('@1inch/solidity-utils/hardhat-setup');

const { networks, etherscan } = (new Networks(true, 'mainnet', true)).registerAll();

module.exports = {
    solidity: {
        compilers: [
            {
                version: '0.8.23',
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 1000000,
                    },
                    evmVersion: (networks[getNetwork()])?.hardfork || 'shanghai',
                    viaIR: true,
                },
            },
        ],
    },
    namedAccounts: {
        deployer: {
            default: 0,
        },
    },
    networks,
    etherscan,
    tracer: {
        enableAllOpcodes: true,
    },
    dependencyCompiler: {
        paths: [
            '@1inch/limit-order-protocol-contract/contracts/LimitOrderProtocol.sol',
            '@1inch/limit-order-settlement/contracts/Settlement.sol',
            '@1inch/solidity-utils/contracts/interfaces/IWETH.sol',
            '@openzeppelin/contracts/token/ERC20/IERC20.sol',
            '@uniswap/universal-router/contracts/interfaces/IUniversalRouter.sol',
            '@uniswap/v2-core/contracts/interfaces/IUniswapV2Pair.sol',
            '@uniswap/v3-core/contracts/interfaces/IUniswapV3Pool.sol',
        ],
    },
};
