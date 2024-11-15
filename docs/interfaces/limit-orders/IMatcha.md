
## IMatcha

### Types list
- [LimitOrder](#limitorder)
- [SignatureType](#signaturetype)
- [Signature](#signature)

### Functions list
- [fillLimitOrder(order, signature, takerTokenFillAmount) external](#filllimitorder)

### Types
### LimitOrder

_A standard OTC or OO limit order._

```solidity
struct LimitOrder {
  address makerToken;
  address takerToken;
  uint128 makerAmount;
  uint128 takerAmount;
  uint128 takerTokenFeeAmount;
  address maker;
  address taker;
  address sender;
  address feeRecipient;
  bytes32 pool;
  uint64 expiry;
  uint256 salt;
}
```
### SignatureType

_Allowed signature types._

```solidity
enum SignatureType {
  ILLEGAL,
  INVALID,
  EIP712,
  ETHSIGN,
  PRESIGNED
}
```
### Signature

_Encoded EC signature._

```solidity
struct Signature {
  enum IMatcha.SignatureType signatureType;
  uint8 v;
  bytes32 r;
  bytes32 s;
}
```

### Functions
### fillLimitOrder

```solidity
function fillLimitOrder(struct IMatcha.LimitOrder order, struct IMatcha.Signature signature, uint128 takerTokenFillAmount) external payable returns (uint128 takerTokenFilledAmount, uint128 makerTokenFilledAmount)
```

