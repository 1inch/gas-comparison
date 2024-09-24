// SPDX-License-Identifier: Apache-2.0

pragma solidity ^0.8.0;

interface IMatcha {
    /// @dev A standard OTC or OO limit order.
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

    /// @dev Allowed signature types.
    enum SignatureType {
        ILLEGAL,
        INVALID,
        EIP712,
        ETHSIGN,
        PRESIGNED
    }

    /// @dev Encoded EC signature.
    struct Signature {
        // How to validate the signature.
        SignatureType signatureType;
        // EC Signature data.
        uint8 v;
        // EC Signature data.
        bytes32 r;
        // EC Signature data.
        bytes32 s;
    }

    function fillLimitOrder(
        LimitOrder memory order,
        Signature memory signature,
        uint128 takerTokenFillAmount
    ) external payable returns (uint128 takerTokenFilledAmount, uint128 makerTokenFilledAmount);
}
