
## ISettler

### Types list
- [AllowedSlippage](#allowedslippage)

### Functions list
- [execute(slippage, actions, affiliate) external](#execute)

### Types
### AllowedSlippage

```solidity
struct AllowedSlippage {
  address recipient;
  contract IERC20 buyToken;
  uint256 minAmountOut;
}
```

### Functions
### execute

```solidity
function execute(struct ISettler.AllowedSlippage slippage, bytes[] actions, bytes32 affiliate) external payable returns (bool)
```

