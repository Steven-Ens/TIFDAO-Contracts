// SPDX-License-Identifier: GPL-2.0-or-later

/**
 * @title IPause.sol
 * @author Steven Ens
 */

pragma solidity ^0.8.27;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/** 
 * @dev Interface to add the paused() function to check if the token contract is paused when selecting minValuedToken
 * and maxValuedToken
 */
interface IPause is IERC20 {
    function paused() external returns (bool);
}
