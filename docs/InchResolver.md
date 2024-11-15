
## InchResolver

### Functions list
- [constructor(limitOrderProtocol) public](#constructor)
- [settleOrders(data) public](#settleorders)
- [takerInteraction(, , , taker, , , , extraData) public](#takerinteraction)

### Errors list
- [NotTaker() ](#nottaker)
- [OnlyLOP() ](#onlylop)
- [FailedExternalCall(index, reason) ](#failedexternalcall)

### Functions
### constructor

```solidity
constructor(contract IOrderMixin limitOrderProtocol) public
```

### settleOrders

```solidity
function settleOrders(bytes data) public virtual
```

### takerInteraction

```solidity
function takerInteraction(struct IOrderMixin.Order, bytes, bytes32, address taker, uint256, uint256, uint256, bytes extraData) public
```

### Errors
### NotTaker

```solidity
error NotTaker()
```

### OnlyLOP

```solidity
error OnlyLOP()
```

### FailedExternalCall

```solidity
error FailedExternalCall(uint256 index, bytes reason)
```

