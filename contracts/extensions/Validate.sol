// SPDX-License-Identifier: GPL-2.0-or-later

/** 
* @title Validate.sol
* @author Steven Ens
*/ 

// Allow for bugfix releases until 0.9.0
pragma solidity ^0.8.27;

contract Validate {
    // The address of the signer's private key
    address private constant BACKEND_ADDRESS = 0xb6C5fc0E67767769Dfa68d961FdC550aF76d5959;  
    uint256 private constant MAX_SIGNATURE_AGE = 10 minutes;
    // Mapping to track used signatures
    mapping(bytes32 => bool) public usedSignatures;

    error InvalidSignature();
    error SignatureExpired();
    error SignatureUsedBefore();
    error InvalidValueS();
    error InvalidValueV();
    error InvalidSignatureLength();

    // Modifier to ensure the signature is valid for buyTif() transactions
    modifier onlyValidSignatureBuyTif(
        bytes memory signature,
        uint256 timestamp, 
        address userAddress,
        address tokenAddress,
        uint256 minTokenOutput,
        uint256 tokenPrice,
        uint256 tokenAmount,
        uint256 tokenValue,
        uint256 runningValueTotal
    ) 
    {
        if (!isValidSignatureBuyTif(
            signature,
            timestamp, 
            userAddress,
            tokenAddress,
            minTokenOutput,
            tokenPrice,
            tokenAmount,
            tokenValue,
            runningValueTotal
        )) 
        {
            revert InvalidSignature();
        }
        _;
    }

    // Modifier to ensure the signature is valid for sellTif() transactions
    modifier onlyValidSignatureSellTif(
        bytes memory signature,
        uint256 timestamp, 
        address userAddress,
        uint256 userTokensToBurn,
        address tokenAddress,
        uint256 tokenPrice,
        uint256 tokenAmount,
        uint256 tokenValue,
        uint256 runningValueTotal
    ) 
    {
        if (!isValidSignatureSellTif(
            signature,
            timestamp, 
            userAddress,
            userTokensToBurn,
            tokenAddress,
            tokenPrice,
            tokenAmount,
            tokenValue,
            runningValueTotal
        )) 
        {
            revert InvalidSignature();
        }
        _;
    }

    // Modifier to ensure the signature is valid for sellRemovedToken() transactions
    modifier onlyValidSignatureSellRemoved(
        bytes memory signature,
        uint256 timestamp, 
        address userAddress,
        address removedToken,
        uint256 percentOfTokenToSell,
        uint256 priceOfTokenInEth
    )
    {
        if (!isValidSignatureSellRemoved(
            signature,
            timestamp, 
            userAddress,
            removedToken,
            percentOfTokenToSell,
            priceOfTokenInEth
        )) 
        {
            revert InvalidSignature();
        }
        _;
    }

    // Modifier to ensure the signature is valid for reinvestFundEther() transactions
    modifier onlyValidSignatureReinvest(
        bytes memory signature, 
        uint256 timestamp, 
        address userAddress,
        uint256 percentOfBalance, 
        address tokenAddress,
        uint256 minTokenOutput,
        uint256 tokenPrice,
        uint256 tokenAmount,
        uint256 tokenValue
    ) 
    {
        if (!isValidSignatureReinvest(
            signature, 
            timestamp, 
            userAddress,
            percentOfBalance,
            tokenAddress,
            minTokenOutput,
            tokenPrice,
            tokenAmount,
            tokenValue
        )) 
        {
            revert InvalidSignature();
        }
        _;
    }

    // Function to verify the signature for buyTif() transactions
    function isValidSignatureBuyTif(
        bytes memory signature,
        uint256 timestamp,
        address userAddress,
        address tokenAddress,
        uint256 minTokenOutput,
        uint256 tokenPrice,
        uint256 tokenAmount,
        uint256 tokenValue,
        uint256 runningValueTotal
    ) 
    public 
    returns (bool) 
    {
        // Check if the timestamp is more than 10 minutes old
        if (block.timestamp > timestamp + MAX_SIGNATURE_AGE) {
            revert SignatureExpired();
        }
        // Create the message hash
        bytes32 messageHash = keccak256(abi.encodePacked(
            timestamp,
            userAddress,
            tokenAddress,
            minTokenOutput,
            tokenPrice,
            tokenAmount,
            tokenValue,
            runningValueTotal
        ));
        // Add Ethereum Signed Message prefix
        bytes32 ethSignedMessageHash = keccak256(
            abi.encodePacked("\x19Ethereum Signed Message:\n32", messageHash)
        );
        // Ensure the signature hasn't been used before
        if (usedSignatures[ethSignedMessageHash]) 
            revert SignatureUsedBefore();
        // Recover the signer from the message hash and signature
        address recoveredSigner = _recoverSigner(ethSignedMessageHash, signature);
        // Verify the recovered signer matches the backend address
        if (recoveredSigner != BACKEND_ADDRESS)
            return false;
        // Store the signature to prevent future use
        usedSignatures[ethSignedMessageHash] = true;
        return true; 
    }

    // Function to verify the signature for sellTif() transactions
    function isValidSignatureSellTif(
        bytes memory signature,
        uint256 timestamp, 
        address userAddress,
        uint256 userTokensToBurn,
        address tokenAddress,
        uint256 tokenPrice,
        uint256 tokenAmount,
        uint256 tokenValue,
        uint256 runningValueTotal
    ) 
    public 
    returns (bool) 
    {
        if (block.timestamp > timestamp + MAX_SIGNATURE_AGE) {
            revert SignatureExpired();
        }
        bytes32 messageHash = keccak256(abi.encodePacked(
            timestamp, 
            userAddress,
            userTokensToBurn,
            tokenAddress,
            tokenPrice,
            tokenAmount,
            tokenValue,
            runningValueTotal
        ));
        bytes32 ethSignedMessageHash = keccak256(
            abi.encodePacked("\x19Ethereum Signed Message:\n32", messageHash)
        );
        if (usedSignatures[ethSignedMessageHash])
            revert SignatureUsedBefore();
        address recoveredSigner = _recoverSigner(ethSignedMessageHash, signature);
        if (recoveredSigner != BACKEND_ADDRESS)
            return false;
        usedSignatures[ethSignedMessageHash] = true;
        return true; 
    }

    // Function to verify the signature for sellRemovedToken() transactions
    function isValidSignatureSellRemoved(
        bytes memory signature,
        uint256 timestamp, 
        address userAddress,
        address removedToken,
        uint256 percentOfTokenToSell,
        uint256 priceOfTokenInEth
    )
    public
    returns (bool)
    {
        if (block.timestamp > timestamp + MAX_SIGNATURE_AGE) {
            revert SignatureExpired();
        }
        bytes32 messageHash = keccak256(abi.encodePacked(
            timestamp,
            userAddress,
            removedToken,
            percentOfTokenToSell,
            priceOfTokenInEth
        ));
        bytes32 ethSignedMessageHash = keccak256(
            abi.encodePacked("\x19Ethereum Signed Message:\n32", messageHash)
        );
        if (usedSignatures[ethSignedMessageHash])
            revert SignatureUsedBefore();
        address recoveredSigner = _recoverSigner(ethSignedMessageHash, signature);
        if (recoveredSigner != BACKEND_ADDRESS)
            return false;
        usedSignatures[ethSignedMessageHash] = true;
        return true; 
    }

    // Function to verify the signature for reinvestFundEther() transactions
    function isValidSignatureReinvest(
        bytes memory signature, 
        uint256 timestamp,
        address userAddress,
        uint256 percentOfBalance, 
        address tokenAddress,
        uint256 minTokenOutput,
        uint256 tokenPrice,
        uint256 tokenAmount,
        uint256 tokenValue
    ) 
    public 
    returns (bool) 
    {
        if (block.timestamp > timestamp + MAX_SIGNATURE_AGE) {
            revert SignatureExpired();
        }
        bytes32 messageHash = keccak256(abi.encodePacked(
            timestamp,
            userAddress,
            percentOfBalance,
            tokenAddress,
            minTokenOutput,
            tokenPrice,
            tokenAmount,
            tokenValue
        ));
        bytes32 ethSignedMessageHash = keccak256(
            abi.encodePacked("\x19Ethereum Signed Message:\n32", messageHash)
        );
        if (usedSignatures[ethSignedMessageHash])
            revert SignatureUsedBefore();
        address recoveredSigner = _recoverSigner(ethSignedMessageHash, signature);
        if (recoveredSigner != BACKEND_ADDRESS)
            return false;
        usedSignatures[ethSignedMessageHash] = true;
        return true; 
    }

    // Function to recover the signer from the signature
    function _recoverSigner(bytes32 messageHash, bytes memory signature) internal pure returns (address) {
        (uint8 v, bytes32 r, bytes32 s) = _splitSignature(signature);
        // Prevents malleability attacks by using the specific secp256k1 curve order for valid s values
        if (uint256(s) > 0x7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF5D576E7357A4501DDFE92F46681B20A0) {
            revert InvalidValueS();
        }
        // Prevents invalid v values from causing unexpected signature recoveries as the only valid values are 27 and 28
        if (v != 27 && v != 28) {
            revert InvalidValueV();
        }
        return ecrecover(messageHash, v, r, s);
    }

    // Function to split the signature into its components
    function _splitSignature(bytes memory signature) internal pure returns (uint8 v, bytes32 r, bytes32 s) {
        if (signature.length != 65) {
            revert InvalidSignatureLength();
        }
        assembly {
            r := mload(add(signature, 32))
            s := mload(add(signature, 64))
            v := byte(0, mload(add(signature, 96)))
        }
    }
}
