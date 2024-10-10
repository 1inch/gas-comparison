// SPDX-License-Identifier: GPL-2.0-or-later

pragma solidity ^0.8.0;

import { ResolvedOrder } from "./ReactorStructs.sol";

/// @notice Callback for executing orders through a reactor.
interface IReactorCallback {
    /// @notice Called by the reactor during the execution of an order
    /// @param resolvedOrders Array of filling orders, each order has inputs and outputs
    /// @param callbackData The callback data specified for an order execution
    /// @dev Must have approved each token and amount in outputs to the msg.sender
    function reactorCallback(ResolvedOrder[] memory resolvedOrders, bytes memory callbackData) external;
}
