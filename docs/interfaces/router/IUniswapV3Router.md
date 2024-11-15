
## IUniswapV3Router

### Types list
- [ExactInputSingleParams](#exactinputsingleparams)
- [ExactInputParams](#exactinputparams)

### Functions list
- [exactInputSingle(params) external](#exactinputsingle)
- [exactInput(params) external](#exactinput)
- [multicall(data) external](#multicall)
- [unwrapWETH9(amountMinimum, recipient) external](#unwrapweth9)

### Types
### ExactInputSingleParams

```solidity
struct ExactInputSingleParams {
  address tokenIn;
  address tokenOut;
  uint24 fee;
  address recipient;
  uint256 deadline;
  uint256 amountIn;
  uint256 amountOutMinimum;
  uint160 sqrtPriceLimitX96;
}
```
### ExactInputParams

```solidity
struct ExactInputParams {
  bytes path;
  address recipient;
  uint256 deadline;
  uint256 amountIn;
  uint256 amountOutMinimum;
}
```

### Functions
### exactInputSingle

```solidity
function exactInputSingle(struct IUniswapV3Router.ExactInputSingleParams params) external payable returns (uint256 amountOut)
```
Swaps `amountIn` of one token for as much as possible of another token

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| params | struct IUniswapV3Router.ExactInputSingleParams | The parameters necessary for the swap, encoded as `ExactInputSingleParams` in calldata |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
amountOut | uint256 | The amount of the received token |

### exactInput

```solidity
function exactInput(struct IUniswapV3Router.ExactInputParams params) external payable returns (uint256 amountOut)
```
Swaps `amountIn` of one token for as much as possible of another along the specified path

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| params | struct IUniswapV3Router.ExactInputParams | The parameters necessary for the multi-hop swap, encoded as `ExactInputParams` in calldata |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
amountOut | uint256 | The amount of the received token |

### multicall

```solidity
function multicall(bytes[] data) external payable returns (bytes[] results)
```
Call multiple functions in the current contract and return the data from all of them if they all succeed

_The `msg.value` should not be trusted for any method callable from multicall._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| data | bytes[] | The encoded function data for each of the calls to make to this contract |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
results | bytes[] | The results from each of the calls passed in via data |

### unwrapWETH9

```solidity
function unwrapWETH9(uint256 amountMinimum, address recipient) external payable
```
Unwraps the contract's WETH9 balance and sends it to recipient as ETH.

_The amountMinimum parameter prevents malicious contracts from stealing WETH9 from users._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| amountMinimum | uint256 | The minimum amount of WETH9 to unwrap |
| recipient | address | The address receiving ETH |

