
## ICowswapGPv2Settlement

### Types list
- [GPv2TradeData](#gpv2tradedata)
- [GPv2InteractionData](#gpv2interactiondata)

### Functions list
- [authenticator() external](#authenticator)
- [settle(tokens, clearingPrices, trades, interactions) external](#settle)

### Types
### GPv2TradeData

```solidity
struct GPv2TradeData {
  uint256 sellTokenIndex;
  uint256 buyTokenIndex;
  address receiver;
  uint256 sellAmount;
  uint256 buyAmount;
  uint32 validTo;
  bytes32 appData;
  uint256 feeAmount;
  uint256 flags;
  uint256 executedAmount;
  bytes signature;
}
```
### GPv2InteractionData

```solidity
struct GPv2InteractionData {
  address target;
  uint256 value;
  bytes callData;
}
```

### Functions
### authenticator

```solidity
function authenticator() external view returns (address)
```

### settle

```solidity
function settle(contract IERC20[] tokens, uint256[] clearingPrices, struct ICowswapGPv2Settlement.GPv2TradeData[] trades, struct ICowswapGPv2Settlement.GPv2InteractionData[][3] interactions) external
```

