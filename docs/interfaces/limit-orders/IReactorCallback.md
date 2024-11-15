
## IReactorCallback

Callback for executing orders through a reactor.

### Functions list
- [reactorCallback(resolvedOrders, callbackData) external](#reactorcallback)

### Functions
### reactorCallback

```solidity
function reactorCallback(struct ResolvedOrder[] resolvedOrders, bytes callbackData) external
```
Called by the reactor during the execution of an order

_Must have approved each token and amount in outputs to the msg.sender_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| resolvedOrders | struct ResolvedOrder[] | Array of filling orders, each order has inputs and outputs |
| callbackData | bytes | The callback data specified for an order execution |

