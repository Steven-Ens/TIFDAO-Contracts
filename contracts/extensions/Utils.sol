// SPDX-License-Identifier: GPL-2.0-or-later

/** 
 * @title Utils.sol
 * @author Steven Ens
 */

pragma solidity ^0.8.27;

/**
 * @dev Helper functions used by Main.sol
 */
contract Utils {
    uint256 private constant DECIMALS = 18;

    error ReadOutOfBounds();
    error InvalidZeroInput();

    /** 
     *@dev Converts bytes values returned by tokensBalance() of BalanceScanner.sol into a uint256 value
     */
    function _bytesToUint256(bytes memory bytesValue) internal pure returns (uint256 result) {
        // Ensure that bytesValue is of the correct length
        if (bytesValue.length != 32)
            revert ReadOutOfBounds();
        // The EVM has a 32-byte word size meaning every item in the stack has a size of 32 bytes. The first 32
        // bytes of the bytesValue contains its length, and the next 32 bytes stores the integer value. mload()
        // loads the integer value stored 32 (0x20) bytes in into memory
        // solhint-disable-next-line no-inline-assembly
        assembly {
            result := mload(add(bytesValue, 0x20))
        }
    }
   
    /** 
     * @dev Converts string values of token symbols to bytes32 values to store in _index
     */
    function _stringToBytes32(string memory stringValue) internal pure returns (bytes32 result) {
        if (bytes(stringValue).length > 32)
            revert ReadOutOfBounds();
        assembly {
            result := mload(add(stringValue, 0x20))
        }
    }
    
    /**
     * @dev Provides a result in in 18 decimal format, where 1 = 1*10^18. As 1*10^18 * 2*10^18 should functionally
     * equal 2.0 and not 2*10^36, the last 18 digits are removed through division. If the product is less than 1*10^18
     * then the value 0 will be returned. If either the multiplicand or multiplier are 0 then the function reverts with
     * InvalidZeroInput()
    **/
    function _multiply(uint256 multiplicand, uint256 multiplier) internal pure returns (uint256) {
        if (multiplicand == 0 || multiplier == 0) 
            revert InvalidZeroInput();
        
        uint256 result = ((multiplicand * multiplier) / (10 ** DECIMALS));
        return result;
    }

    /** 
     * @dev Provides a result in 18 decimal format, where 1 = 1*10^18. 2/1 or 2*10^18/1*10^18 should equal 2 or 2*10^18
     * which which is why the numerator is multiplied by 1*10^18. If either numerator or denominator are 0 then the
     * function reverts with InvalidZeroInput()
    **/
    function _divide(uint256 numerator, uint256 denominator) internal pure returns (uint256) {
        if (numerator == 0 || denominator == 0)
            revert InvalidZeroInput();
        
        numerator = (numerator * (10 ** DECIMALS));
        uint256 result = numerator / denominator;
        return result;
    }
}
