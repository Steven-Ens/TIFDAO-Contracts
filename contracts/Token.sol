// SPDX-License-Identifier: GPL-2.0-or-later

/**
 * @title Token.sol
 * @author OpenZeppelin Wizard (https://wizard.openzeppelin.com)
 * @author Steven Ens
 */

pragma solidity ^0.8.27;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";

/**
 * @dev The TIFDAO Token implementation. This contract should never receive ETH and has no receive() or payable 
 * functions to do so by any normal measures
 */
contract Token is ERC20, ERC20Burnable, AccessControl, ERC20Permit, ERC20Votes {
    
    // Made public to expose to external API as per OpenZeppelin documentation
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    // solhint-disable-next-line func-visibility
    constructor() ERC20("Token Index Fund DAO", "TIFDAO") ERC20Permit("Token Index Fund DAO") {
        // Temporarily set the admin role as the deployment address to be retracted at the end of scripts/deploy.js
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    // The modifier onlyRole(MINTER_ROLE) is given to contracts/Main.sol
    function mint(address to, uint256 amount) public onlyRole(MINTER_ROLE) {
        _mint(to, amount);
    }
   
    // The following functions are required overrides 
    function _afterTokenTransfer(address from, address to, uint256 amount) internal override(ERC20, ERC20Votes) {
        super._afterTokenTransfer(from, to, amount);  
    }

    function _mint(address to, uint256 amount) internal override(ERC20, ERC20Votes) {
        super._mint(to, amount);
    }

    function _burn(address account, uint256 amount) internal override(ERC20, ERC20Votes) {
        super._burn(account, amount);
    }
}
