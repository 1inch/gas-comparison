// SPDX-License-Identifier: MIT

pragma solidity 0.8.23;

import { InchResolver } from "./InchResolver.sol";
import { UniswapResolver } from "./UniswapResolver.sol";
import { CowswapResolver } from "./CowswapResolver.sol";
import { IOrderMixin } from "@1inch/limit-order-protocol-contract/contracts/interfaces/IOrderMixin.sol";

contract Resolver is InchResolver, UniswapResolver, CowswapResolver {
    constructor(IOrderMixin inch, address reactor, address cowswap)
        InchResolver(inch) UniswapResolver(reactor) CowswapResolver(cowswap)
        {}
}
