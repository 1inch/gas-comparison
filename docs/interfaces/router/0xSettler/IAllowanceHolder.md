
## IAllowanceHolder

### Functions list
- [exec(operator, token, amount, target, data) external](#exec)
- [transferFrom(token, owner, recipient, amount) external](#transferfrom)

### Functions
### exec

```solidity
function exec(address operator, address token, uint256 amount, address payable target, bytes data) external payable returns (bytes result)
```
Executes against `target` with the `data` payload. Prior to execution, token permits
        are temporarily stored for the duration of the transaction. These permits can be
        consumed by the `operator` during the execution
`operator` consumes the funds during its operations by calling back into
        `AllowanceHolder` with `transferFrom`, consuming a token permit.
If calling `target` with `data` reverts, the revert is propagated

_Neither `exec` nor `transferFrom` check that `token` contains code.
msg.sender is forwarded to target appended to the msg data (similar to ERC-2771)_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| operator | address | An address which is allowed to consume the token permits |
| token | address | The ERC20 token the caller has authorised to be consumed |
| amount | uint256 | The quantity of `token` the caller has authorised to be consumed |
| target | address payable | A contract to execute operations with `data` |
| data | bytes | The data to forward to `target` |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
result | bytes | The returndata from calling `target` with `data` |

### transferFrom

```solidity
function transferFrom(address token, address owner, address recipient, uint256 amount) external returns (bool)
```
The counterpart to `exec` which allows for the consumption of token permits later
        during execution

_*DOES NOT* check that `token` contains code. This function vacuously succeeds if
     `token` is empty.
can only be called by the `operator` previously registered in `exec`_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| token | address | The ERC20 token to transfer |
| owner | address | The owner of tokens to transfer |
| recipient | address | The destination/beneficiary of the ERC20 `transferFrom` |
| amount | uint256 | The quantity of `token` to transfer` |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
[0] | bool | true |

