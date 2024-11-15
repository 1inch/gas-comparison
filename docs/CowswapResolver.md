
## CowswapResolver

### Functions list
- [constructor(cowswapSettlement) public](#constructor)
- [settleCowswapOrders(value, params) public](#settlecowswaporders)
- [cowswapResolve(blob) external](#cowswapresolve)

### Errors list
- [OnlyCowswapSettlement() ](#onlycowswapsettlement)

### Functions
### constructor

```solidity
constructor(address cowswapSettlement) public
```

### settleCowswapOrders

```solidity
function settleCowswapOrders(uint256 value, bytes params) public payable virtual
```

### cowswapResolve

```solidity
function cowswapResolve(bytes blob) external
```

### Errors
### OnlyCowswapSettlement

```solidity
error OnlyCowswapSettlement()
```

