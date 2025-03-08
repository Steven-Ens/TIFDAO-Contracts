// SPDX-License-Identifier: GPL-2.0-or-later

/**
 * @title Declare.sol
 * @author Steven Ens
 */

pragma solidity ^0.8.27;

/** 
 * @dev Abstract contract to declare structs used in both Main.sol and Swap.sol 
 */
abstract contract Declare {
    struct MinValuedToken {
        address tokenAddress;
        uint256 minTokenOutput;
        uint256 tokenPrice;
        uint256 tokenAmount;
        uint256 tokenValue;
    }
    struct MaxValuedToken {
        address tokenAddress;
        uint256 tokenPrice;
        uint256 tokenAmount;
        uint256 tokenValue;
    }
}
