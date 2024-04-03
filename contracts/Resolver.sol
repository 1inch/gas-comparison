// SPDX-License-Identifier: MIT

pragma solidity 0.8.23;

import { InchResolver } from "./InchResolver.sol";
import { UniswapResolver } from "./UniswapResolver.sol";
import { IOrderMixin } from "@1inch/limit-order-protocol-contract/contracts/interfaces/IOrderMixin.sol";

contract Resolver is InchResolver, UniswapResolver {
    constructor(IOrderMixin inch, address reactor) InchResolver(inch) UniswapResolver(reactor) {}
}
