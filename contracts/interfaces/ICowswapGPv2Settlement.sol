// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import { IERC20 } from "@openzeppelin/contracts/interfaces/IERC20.sol";

interface ICowswapGPv2Settlement {
    function authenticator() external view returns (address);

    struct GPv2TradeData {
        uint256 sellTokenIndex; // IERC20[] calldata tokens index,
        uint256 buyTokenIndex; // IERC20[] calldata tokens index,
        address receiver;
        uint256 sellAmount;
        uint256 buyAmount;
        uint32 validTo; // timestamp
        bytes32 appData; // [can be 0x]
        uint256 feeAmount; // [can be 0, if OrderKind.SELL, then max value is sellAmount]
        uint256 flags; // 0 - kind (OrderKind.SELL, OrderKind.BUY),
                       // 1 - partiallyFillable (false, true),
                       // 3,4 - sellTokenBalance (OrderBalance.ERC20, undefined, OrderBalance.EXTERNAL, OrderBalance.INTERNAL)
                       // 5 - buyTokenBalance (OrderBalance.ERC20, OrderBalance.INTERNAL)
                       // 6,7 - signingScheme (SigningScheme.EIP712, SigningScheme.ETHSIGN, SigningScheme.EIP1271, SigningScheme.PRESIGN)
        uint256 executedAmount;
        bytes signature; // GPv2Order signature
    }

    struct GPv2InteractionData {
        address target;
        uint256 value;
        bytes callData;
    }

    function settle(
        IERC20[] calldata tokens,
        uint256[] calldata clearingPrices,
        GPv2TradeData[] calldata trades,
        GPv2InteractionData[][3] calldata interactions
    ) external;
}
