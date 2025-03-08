// SPDX-License-Identifier: GPL-2.0-or-later

/**
 * @title IWETH9.sol
 * @author Steven Ens
 */

pragma solidity ^0.8.27;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/** 
 * @dev Interface for the live WETH9 ERC20 token contract with the addition of the two required functions below
 */
interface IWETH9 is IERC20 {
    // Deposit ETH to get WETH
    function deposit() external payable;

    // Withdraw WETH to get ETH
    function withdraw(uint256) external;
}
