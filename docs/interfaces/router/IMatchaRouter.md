
## IMatchaRouter

### Functions list
- [sellToUniswap(tokens, sellAmount, minBuyAmount, isSushi) external](#selltouniswap)
- [sellEthForTokenToUniswapV3(encodedPath, minBuyAmount, recipient) external](#sellethfortokentouniswapv3)
- [sellTokenForEthToUniswapV3(encodedPath, sellAmount, minBuyAmount, recipient) external](#selltokenforethtouniswapv3)
- [sellTokenForTokenToUniswapV3(encodedPath, sellAmount, minBuyAmount, recipient) external](#selltokenfortokentouniswapv3)

### Functions
### sellToUniswap

```solidity
function sellToUniswap(address[] tokens, uint256 sellAmount, uint256 minBuyAmount, bool isSushi) external payable
```

### sellEthForTokenToUniswapV3

```solidity
function sellEthForTokenToUniswapV3(bytes encodedPath, uint256 minBuyAmount, address recipient) external payable returns (uint256 buyAmount)
```

_Sell attached ETH directly against uniswap v3._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| encodedPath | bytes | Uniswap-encoded path, where the first token is WETH. |
| minBuyAmount | uint256 | Minimum amount of the last token in the path to buy. |
| recipient | address | The recipient of the bought tokens. Can be zero for sender. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
buyAmount | uint256 | Amount of the last token in the path bought. |

### sellTokenForEthToUniswapV3

```solidity
function sellTokenForEthToUniswapV3(bytes encodedPath, uint256 sellAmount, uint256 minBuyAmount, address payable recipient) external returns (uint256 buyAmount)
```

_Sell a token for ETH directly against uniswap v3._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| encodedPath | bytes | Uniswap-encoded path, where the last token is WETH. |
| sellAmount | uint256 | amount of the first token in the path to sell. |
| minBuyAmount | uint256 | Minimum amount of ETH to buy. |
| recipient | address payable | The recipient of the bought tokens. Can be zero for sender. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
buyAmount | uint256 | Amount of ETH bought. |

### sellTokenForTokenToUniswapV3

```solidity
function sellTokenForTokenToUniswapV3(bytes encodedPath, uint256 sellAmount, uint256 minBuyAmount, address recipient) external returns (uint256 buyAmount)
```

_Sell a token for another token directly against uniswap v3._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| encodedPath | bytes | Uniswap-encoded path. |
| sellAmount | uint256 | amount of the first token in the path to sell. |
| minBuyAmount | uint256 | Minimum amount of the last token in the path to buy. |
| recipient | address | The recipient of the bought tokens. Can be zero for sender. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
buyAmount | uint256 | Amount of the last token in the path bought. |

