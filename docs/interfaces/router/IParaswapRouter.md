
## IParaswapRouter

### Types list
- [UniswapV2Data](#uniswapv2data)
- [UniswapV3Data](#uniswapv3data)

### Functions list
- [swapExactAmountInOnUniswapV2(uniData, partnerAndFee, permit) external](#swapexactamountinonuniswapv2)
- [swapExactAmountInOnUniswapV3(uniData, partnerAndFee, permit) external](#swapexactamountinonuniswapv3)

### Types
### UniswapV2Data

Struct for UniswapV2 swapExactAmountIn/swapExactAmountOut data

```solidity
struct UniswapV2Data {
  contract IERC20 srcToken;
  contract IERC20 destToken;
  uint256 fromAmount;
  uint256 toAmount;
  uint256 quotedAmount;
  bytes32 metadata;
  address payable beneficiary;
  bytes pools;
}
```
### UniswapV3Data

Struct for UniswapV3 swapExactAmountIn/swapExactAmountOut data

```solidity
struct UniswapV3Data {
  contract IERC20 srcToken;
  contract IERC20 destToken;
  uint256 fromAmount;
  uint256 toAmount;
  uint256 quotedAmount;
  bytes32 metadata;
  address payable beneficiary;
  bytes pools;
}
```

### Functions
### swapExactAmountInOnUniswapV2

```solidity
function swapExactAmountInOnUniswapV2(struct IParaswapRouter.UniswapV2Data uniData, uint256 partnerAndFee, bytes permit) external payable returns (uint256 receivedAmount, uint256 paraswapShare, uint256 partnerShare)
```
Executes a swapExactAmountIn on Uniswap V2 pools

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| uniData | struct IParaswapRouter.UniswapV2Data | struct containing data for the swap |
| partnerAndFee | uint256 | packed partner address and fee percentage, the first 12 bytes is the feeData and the last 20 bytes is the partner address |
| permit | bytes | The permit data |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
receivedAmount | uint256 | The amount of destToken received after fees |
paraswapShare | uint256 | The share of the fees for Paraswap |
partnerShare | uint256 | The share of the fees for the partner |

### swapExactAmountInOnUniswapV3

```solidity
function swapExactAmountInOnUniswapV3(struct IParaswapRouter.UniswapV3Data uniData, uint256 partnerAndFee, bytes permit) external payable returns (uint256 receivedAmount, uint256 paraswapShare, uint256 partnerShare)
```
Executes a swapExactAmountIn on Uniswap V3 pools

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| uniData | struct IParaswapRouter.UniswapV3Data | struct containing data for the swap |
| partnerAndFee | uint256 | packed partner address and fee percentage, the first 12 bytes is the feeData and the last 20 bytes is the partner address |
| permit | bytes | The permit data |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
receivedAmount | uint256 | The amount of destToken received after fees |
paraswapShare | uint256 | The share of the fees for Paraswap |
partnerShare | uint256 | The share of the fees for the partner |

