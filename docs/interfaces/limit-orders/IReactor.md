
## IReactor

Interface for order execution reactors

### Functions list
- [execute(order) external](#execute)
- [executeWithCallback(order, callbackData) external](#executewithcallback)
- [executeBatch(orders) external](#executebatch)
- [executeBatchWithCallback(orders, callbackData) external](#executebatchwithcallback)

### Functions
### execute

```solidity
function execute(struct SignedOrder order) external payable
```
Execute a single order

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| order | struct SignedOrder | The order definition and valid signature to execute |

### executeWithCallback

```solidity
function executeWithCallback(struct SignedOrder order, bytes callbackData) external payable
```
Execute a single order using the given callback data

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| order | struct SignedOrder | The order definition and valid signature to execute |
| callbackData | bytes | The callbackData to pass to the callback |

### executeBatch

```solidity
function executeBatch(struct SignedOrder[] orders) external payable
```
Execute the given orders at once

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| orders | struct SignedOrder[] | The order definitions and valid signatures to execute |

### executeBatchWithCallback

```solidity
function executeBatchWithCallback(struct SignedOrder[] orders, bytes callbackData) external payable
```
Execute the given orders at once using a callback with the given callback data

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| orders | struct SignedOrder[] | The order definitions and valid signatures to execute |
| callbackData | bytes | The callbackData to pass to the callback |

