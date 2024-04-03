// SPDX-License-Identifier: MIT

pragma solidity 0.8.23;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { Address, AddressLib} from "@1inch/solidity-utils/contracts/libraries/AddressLib.sol";
import { SafeERC20 } from "@1inch/solidity-utils/contracts/libraries/SafeERC20.sol";
import { RevertReasonForwarder } from "@1inch/solidity-utils/contracts/libraries/RevertReasonForwarder.sol";
import { IOrderMixin } from "@1inch/limit-order-protocol-contract/contracts/interfaces/IOrderMixin.sol";
import { ITakerInteraction } from "@1inch/limit-order-protocol-contract/contracts/interfaces/ITakerInteraction.sol";

contract InchResolver is ITakerInteraction {
    error OnlyOwner();
    error NotTaker();
    error OnlyLOP();
    error FailedExternalCall(uint256 index, bytes reason);

    using SafeERC20 for IERC20;
    using AddressLib for Address;

    bytes1 private constant _FINALIZE_INTERACTION = 0x01;

    IOrderMixin private immutable _LOPV4;
    address private immutable _OWNER;

    modifier onlyOwner () {
        if (msg.sender != _OWNER) revert OnlyOwner();
        _;
    }

    constructor(IOrderMixin limitOrderProtocol) {
        _LOPV4 = limitOrderProtocol;
        _OWNER = msg.sender;
    }

    function approve(IERC20 token, address to) external onlyOwner {
        token.forceApprove(to, type(uint256).max);
    }

    function settleOrders(bytes calldata data) public {
        // solhint-disable-next-line avoid-low-level-calls
        (bool success,) = address(_LOPV4).call(data);
        if (!success) RevertReasonForwarder.reRevert();
    }

    function takerInteraction(
        IOrderMixin.Order calldata /* order */,
        bytes calldata /* extension */,
        bytes32 /* orderHash */,
        address taker,
        uint256 /* makingAmount */,
        uint256 /* takingAmount */,
        uint256 /* remainingMakingAmount */,
        bytes calldata extraData
    ) public {
        if (msg.sender != address(_LOPV4)) revert OnlyLOP();
        if (taker != address(this)) revert NotTaker();

        unchecked {
            if (extraData[0] == _FINALIZE_INTERACTION) {
                if (extraData.length > 1) {
                    (Address[] memory targets, bytes[] memory calldatas) = abi.decode(extraData[1:], (Address[], bytes[]));
                    for (uint256 i = 0; i < targets.length; ++i) {
                        // solhint-disable-next-line avoid-low-level-calls
                        (bool success, bytes memory reason) = targets[i].get().call(calldatas[i]);
                        if (!success) revert FailedExternalCall(i, reason);
                    }
                }
            } else {
                settleOrders(extraData[1:]);
            }
        }
    }
}
