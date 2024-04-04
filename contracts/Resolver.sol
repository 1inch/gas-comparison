// SPDX-License-Identifier: MIT

pragma solidity 0.8.23;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { SafeERC20 } from "@1inch/solidity-utils/contracts/libraries/SafeERC20.sol";
import { IOrderMixin } from "@1inch/limit-order-protocol-contract/contracts/interfaces/IOrderMixin.sol";
import { InchResolver } from "./InchResolver.sol";
import { UniswapResolver } from "./UniswapResolver.sol";
import { CowswapResolver } from "./CowswapResolver.sol";

contract Resolver is InchResolver, UniswapResolver, CowswapResolver {
    using SafeERC20 for IERC20;

    error OnlyOwner();

    address private immutable _OWNER;

    modifier onlyOwner () {
        if (msg.sender != _OWNER) revert OnlyOwner();
        _;
    }

    constructor(IOrderMixin inch, address reactor, address cowswap)
        InchResolver(inch)
        UniswapResolver(reactor)
        CowswapResolver(cowswap)
    {
        _OWNER = msg.sender;
    }

    function approve(IERC20 token, address to) external onlyOwner {
        token.forceApprove(to, type(uint256).max);
    }

    function settleOrders(bytes calldata data) public override(InchResolver) onlyOwner() {
        super.settleOrders(data);
    }

    function settleUniswapXOrders(uint256 value, bytes calldata params) public payable override(UniswapResolver) onlyOwner() {
        super.settleUniswapXOrders(value, params);
    }

    function settleCowswapOrders(uint256 value, bytes calldata params) public payable override(CowswapResolver) onlyOwner() {
        super.settleCowswapOrders(value, params);
    }
}
