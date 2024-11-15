
## OrderInfo

_Generic order information
 Should be included as the first field in any concrete order types_

```solidity
struct OrderInfo {
  address reactor;
  address swapper;
  uint256 nonce;
  uint256 deadline;
  address additionalValidationContract;
  bytes additionalValidationData;
}
```

## InputToken

_Tokens that need to be sent from the swapper in order to satisfy an order_

```solidity
struct InputToken {
  contract IERC20 token;
  uint256 amount;
  uint256 maxAmount;
}
```

## OutputToken

_Tokens that need to be received by the recipient in order to satisfy an order_

```solidity
struct OutputToken {
  address token;
  uint256 amount;
  address recipient;
}
```

## ResolvedOrder

_Generic concrete order that specifies exact tokens which need to be sent and received_

```solidity
struct ResolvedOrder {
  struct OrderInfo info;
  struct InputToken input;
  struct OutputToken[] outputs;
  bytes sig;
  bytes32 hash;
}
```

## SignedOrder

_External struct including a generic encoded order and swapper signature
 The order bytes will be parsed and mapped to a ResolvedOrder in the concrete reactor contract_

```solidity
struct SignedOrder {
  bytes order;
  bytes sig;
}
```

