
## IUniswapUniversalRouter

### Functions list
- [execute(commands, inputs, deadline) external](#execute)
- [execute(commands, inputs) external](#execute)

### Functions
### execute

```solidity
function execute(bytes commands, bytes[] inputs, uint256 deadline) external payable
```
Executes encoded commands along with provided inputs. Reverts if deadline has expired.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| commands | bytes | A set of concatenated commands, each 1 byte in length |
| inputs | bytes[] | An array of byte strings containing abi encoded inputs for each command |
| deadline | uint256 | The deadline by which the transaction must be executed |

### execute

```solidity
function execute(bytes commands, bytes[] inputs) external payable
```
Same as execute but without a deadline

