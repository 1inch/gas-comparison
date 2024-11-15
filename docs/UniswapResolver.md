
## UniswapResolver

### Functions list
- [constructor(reactor) public](#constructor)
- [settleUniswapXOrders(value, params) public](#settleuniswapxorders)
- [reactorCallback(resolvedOrders, callbackData) public](#reactorcallback)

### Errors list
- [OnlyReactor() ](#onlyreactor)
- [LengthMismatch() ](#lengthmismatch)

### Functions
### constructor

```solidity
constructor(address reactor) public
```

### settleUniswapXOrders

```solidity
function settleUniswapXOrders(uint256 value, bytes params) public payable virtual
```

### reactorCallback

```solidity
function reactorCallback(struct ResolvedOrder[] resolvedOrders, bytes callbackData) public virtual
```
Called by the reactor during the execution of an order

_Must have approved each token and amount in outputs to the msg.sender_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| resolvedOrders | struct ResolvedOrder[] | Array of filling orders, each order has inputs and outputs |
| callbackData | bytes | The callback data specified for an order execution |

### Errors
### OnlyReactor

```solidity
error OnlyReactor()
```

### LengthMismatch

```solidity
error LengthMismatch()
```

