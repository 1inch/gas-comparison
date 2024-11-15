
## ISettlerActions

### Functions list
- [TRANSFER_FROM(recipient, permit, sig) external](#transfer_from)
- [METATXN_TRANSFER_FROM(recipient, permit) external](#metatxn_transfer_from)
- [RFQ_VIP(recipient, makerPermit, maker, makerSig, takerPermit, takerSig) external](#rfq_vip)
- [METATXN_RFQ_VIP(recipient, makerPermit, maker, makerSig, takerPermit) external](#metatxn_rfq_vip)
- [RFQ(recipient, permit, maker, makerSig, takerToken, maxTakerAmount) external](#rfq)
- [UNISWAPV3(recipient, bps, path, amountOutMin) external](#uniswapv3)
- [UNISWAPV3_VIP(recipient, path, permit, sig, amountOutMin) external](#uniswapv3_vip)
- [MAKERPSM(recipient, gemToken, bps, psm, buyGem) external](#makerpsm)
- [CURVE_TRICRYPTO_VIP(recipient, poolInfo, permit, sig, minBuyAmount) external](#curve_tricrypto_vip)
- [METATXN_CURVE_TRICRYPTO_VIP(recipient, poolInfo, permit, minBuyAmount) external](#metatxn_curve_tricrypto_vip)
- [DODOV1(sellToken, bps, pool, quoteForBase, minBuyAmount) external](#dodov1)
- [VELODROME(recipient, bps, pool, swapInfo, minBuyAmount) external](#velodrome)
- [METATXN_UNISWAPV3_VIP(recipient, path, permit, amountOutMin) external](#metatxn_uniswapv3_vip)
- [UNISWAPV2(recipient, sellToken, bps, pool, swapInfo, amountOutMin) external](#uniswapv2)
- [POSITIVE_SLIPPAGE(recipient, token, expectedAmount) external](#positive_slippage)
- [BASIC(sellToken, bps, pool, offset, data) external](#basic)

### Functions
### TRANSFER_FROM

```solidity
function TRANSFER_FROM(address recipient, struct ISignatureTransfer.PermitTransferFrom permit, bytes sig) external
```

_Transfer funds from msg.sender Permit2._

### METATXN_TRANSFER_FROM

```solidity
function METATXN_TRANSFER_FROM(address recipient, struct ISignatureTransfer.PermitTransferFrom permit) external
```

_Transfer funds from metatransaction requestor into the Settler contract using Permit2. Only for use in `Settler.executeMetaTxn` where the signature is provided as calldata_

### RFQ_VIP

```solidity
function RFQ_VIP(address recipient, struct ISignatureTransfer.PermitTransferFrom makerPermit, address maker, bytes makerSig, struct ISignatureTransfer.PermitTransferFrom takerPermit, bytes takerSig) external
```

_Settle an RfqOrder between maker and taker transfering funds directly between the parties_

### METATXN_RFQ_VIP

```solidity
function METATXN_RFQ_VIP(address recipient, struct ISignatureTransfer.PermitTransferFrom makerPermit, address maker, bytes makerSig, struct ISignatureTransfer.PermitTransferFrom takerPermit) external
```

_Settle an RfqOrder between maker and taker transfering funds directly between the parties for the entire amount_

### RFQ

```solidity
function RFQ(address recipient, struct ISignatureTransfer.PermitTransferFrom permit, address maker, bytes makerSig, address takerToken, uint256 maxTakerAmount) external
```

_Settle an RfqOrder between Maker and Settler. Transfering funds from the Settler contract to maker.
Retaining funds in the settler contract._

### UNISWAPV3

```solidity
function UNISWAPV3(address recipient, uint256 bps, bytes path, uint256 amountOutMin) external
```

_Trades against UniswapV3 using the contracts balance for funding_

### UNISWAPV3_VIP

```solidity
function UNISWAPV3_VIP(address recipient, bytes path, struct ISignatureTransfer.PermitTransferFrom permit, bytes sig, uint256 amountOutMin) external
```

_Trades against UniswapV3 using user funds via Permit2 for funding_

### MAKERPSM

```solidity
function MAKERPSM(address recipient, address gemToken, uint256 bps, address psm, bool buyGem) external
```

### CURVE_TRICRYPTO_VIP

```solidity
function CURVE_TRICRYPTO_VIP(address recipient, uint80 poolInfo, struct ISignatureTransfer.PermitTransferFrom permit, bytes sig, uint256 minBuyAmount) external
```

### METATXN_CURVE_TRICRYPTO_VIP

```solidity
function METATXN_CURVE_TRICRYPTO_VIP(address recipient, uint80 poolInfo, struct ISignatureTransfer.PermitTransferFrom permit, uint256 minBuyAmount) external
```

### DODOV1

```solidity
function DODOV1(address sellToken, uint256 bps, address pool, bool quoteForBase, uint256 minBuyAmount) external
```

### VELODROME

```solidity
function VELODROME(address recipient, uint256 bps, address pool, uint24 swapInfo, uint256 minBuyAmount) external
```

### METATXN_UNISWAPV3_VIP

```solidity
function METATXN_UNISWAPV3_VIP(address recipient, bytes path, struct ISignatureTransfer.PermitTransferFrom permit, uint256 amountOutMin) external
```

_Trades against UniswapV3 using user funds via Permit2 for funding. Metatransaction variant. Signature is over all actions._

### UNISWAPV2

```solidity
function UNISWAPV2(address recipient, address sellToken, uint256 bps, address pool, uint24 swapInfo, uint256 amountOutMin) external
```

_Trades against UniswapV2 using the contracts balance for funding_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| recipient | address |  |
| sellToken | address |  |
| bps | uint256 |  |
| pool | address |  |
| swapInfo | uint24 | is encoded as the upper 16 bits as the fee of the pool in bps, the second                 lowest bit as "sell token has transfer fee", and the lowest bit as the                 "token0 for token1" flag. |
| amountOutMin | uint256 |  |

### POSITIVE_SLIPPAGE

```solidity
function POSITIVE_SLIPPAGE(address recipient, address token, uint256 expectedAmount) external
```

### BASIC

```solidity
function BASIC(address sellToken, uint256 bps, address pool, uint256 offset, bytes data) external
```

_Trades against a basic AMM which follows the approval, transferFrom(msg.sender) interaction_

