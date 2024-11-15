
## Resolver

### Functions list
- [constructor(inch, reactor, cowswap) public](#constructor)
- [approve(token, to) external](#approve)
- [settleOrders(data) public](#settleorders)
- [settleUniswapXOrders(value, params) public](#settleuniswapxorders)
- [settleCowswapOrders(value, params) public](#settlecowswaporders)

### Errors list
- [OnlyOwner() ](#onlyowner)

### Functions
### constructor

```solidity
constructor(contract IOrderMixin inch, address reactor, address cowswap) public
```

### approve

```solidity
function approve(contract IERC20 token, address to) external
```

### settleOrders

```solidity
function settleOrders(bytes data) public
```

### settleUniswapXOrders

```solidity
function settleUniswapXOrders(uint256 value, bytes params) public payable
```

### settleCowswapOrders

```solidity
function settleCowswapOrders(uint256 value, bytes params) public payable
```

### Errors
### OnlyOwner

```solidity
error OnlyOwner()
```

