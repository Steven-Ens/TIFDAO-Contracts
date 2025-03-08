// SPDX-License-Identifier: GPL-2.0-or-later

/**
 * @title Governance.sol
 * @author OpenZeppelin Wizard (https://wizard.openzeppelin.com)
 * @author Steven Ens
 */

pragma solidity ^0.8.27;

import "@openzeppelin/contracts/governance/Governor.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorCountingSimple.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotes.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotesQuorumFraction.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorPreventLateQuorum.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "@uniswap/v3-periphery/contracts/interfaces/IQuoter.sol";

/**
 * @dev The governance implementation of the TIFDAO Token
 */
// solhint-disable-next-line max-line-length
contract Governance is Governor, GovernorCountingSimple, GovernorVotes, GovernorVotesQuorumFraction, GovernorPreventLateQuorum {
    // Used to ensure the target of proposals is only the Main.sol contract address
    address private _mainAddress;
    // Make sure users don't add TIFDAO Token or WETH to the index
    address private _tifAddress;
    address private constant WETH_ADDRESS = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;
    // Uniswap v1 quoter
    address private constant UNISWAP_QUOTER_ADDRESS = 0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6;
    IQuoter private constant UNISWAP_QUOTER = IQuoter(UNISWAP_QUOTER_ADDRESS);
    // Used to compare the function selector of proposal calldata
    bytes private constant ADD_TOKEN_TO_INDEX = "addTokenToIndex(address)";
    bytes private constant REMOVE_TOKEN_FROM_INDEX = "removeTokenFromIndex(address)";
    bytes4 private constant ADD_TOKEN_SELECTOR = bytes4(keccak256(ADD_TOKEN_TO_INDEX));
    bytes4 private constant REMOVE_TOKEN_SELECTOR = bytes4(keccak256(REMOVE_TOKEN_FROM_INDEX));

    // Used for overwritten functions that aren't meant to be called
    error InvalidOperation();
    error InvalidProposalQuantity();
    error InvalidProposalTarget();
    error InvalidFunctionSelector();
    error InvalidProposalToken();
    error InvalidTokenSymbol();
    error InvalidUniswapQuote();

    // solhint-disable-next-line func-visibility
    constructor(IVotes tifAddress_, address mainAddress_)
        Governor("Governance")
        GovernorVotes(tifAddress_)
        // 4% is the standard
        GovernorVotesQuorumFraction(4)
        // 2 days = 14400 blocks
        GovernorPreventLateQuorum(14400)
    {
        _tifAddress = address(tifAddress_);
        _mainAddress = mainAddress_;
    }
   
    // This contract should not hold ETH for any reason
    receive() external payable override(Governor) {
        revert InvalidOperation();
    }

    // Redundant operation as this contract is the executor but blocked just in case
    function relay(address, uint256, bytes calldata) external payable override(Governor) {
        revert InvalidOperation();
    }

    // 4% is the standard and someone changing it maliciously could destroy governance
    function updateQuorumNumerator(uint256) 
        external 
        pure
        override(GovernorVotesQuorumFraction)
    {
        revert InvalidOperation();
    }

    // Don't want someone to maliciously extend it to prevent a vote from going through for a long time. 2 Days is long
    // enough
    function setLateQuorumVoteExtension(uint64) 
        public 
        pure
        override(GovernorPreventLateQuorum)
    {
        revert InvalidOperation();
    }
        
    // Limit proposals with various security checks
    function propose(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        string memory description
    ) 
        public 
        override(Governor) 
        returns (uint256) 
    {
        // Only one operation can be performed per proposal, makes voting more clear for users
        if (targets.length != 1)
            revert InvalidProposalQuantity();

        // Proposals can only target _mainAddress
        address targetInfo = targets[0];
        if (targetInfo != _mainAddress) 
            revert InvalidProposalTarget();

        // Get the function selector of the calldata and compare it to the only valid function selectors
        bytes memory calldataInfo = calldatas[0];
        if (bytes4(calldataInfo) != ADD_TOKEN_SELECTOR && bytes4(calldataInfo) != REMOVE_TOKEN_SELECTOR)
            revert InvalidFunctionSelector();

        // Only perform if user is trying to add a token to the index
        if (bytes4(calldataInfo) == ADD_TOKEN_SELECTOR) {
            // Create a new bytes array for the slice starting from byte 4
            bytes memory slicedCalldata = new bytes(calldataInfo.length - 4);
            // Copy the data from calldataInfo starting from index 4 into slicedCalldata
            for (uint256 i = 4; i < calldataInfo.length; i++) {
                slicedCalldata[i - 4] = calldataInfo[i];  
            }
            // Decode the calldata to get the address
            address tokenAddress = abi.decode(slicedCalldata, (address));
            if (tokenAddress == _tifAddress || tokenAddress == WETH_ADDRESS)
                revert InvalidProposalToken();

            // Check that the symbol exists
            // solhint-disable-next-line no-empty-blocks
            try IERC20Metadata(tokenAddress).symbol() {
            } catch {
                revert InvalidTokenSymbol();
            }

            // Reverts if no quote gotten
            try UNISWAP_QUOTER.quoteExactInputSingle(
                    WETH_ADDRESS,
                    tokenAddress,
                    3000,
                    1,
                    0
            ) returns (uint256) {
            } catch {
                revert InvalidUniswapQuote();
            }
        }
        return super.propose(targets, values, calldatas, description);
    }

    // Required by Governor.sol, placed above public view functions for grouping readibility
    function votingDelay() public pure override returns (uint256) {
        return 21600; // 3 days
    }

    function votingPeriod() public pure override returns (uint256) {
        return 50400; // 7 days
    }

    // Required overrides
    function quorum(uint256 blockNumber) 
        public 
        view 
        override(IGovernor, GovernorVotesQuorumFraction) 
        returns (uint256) 
    {
        return super.quorum(blockNumber);
    }

    function proposalDeadline(uint256 proposalId) 
        public 
        view 
        override(Governor, GovernorPreventLateQuorum) 
        returns (uint256)
    {
        return super.proposalDeadline(proposalId);
    }
    
    function _castVote(uint256 proposalId, address account, uint8 support, string memory reason, bytes memory params)
        internal
        override(Governor, GovernorPreventLateQuorum)
        returns (uint256)
    {
        return super._castVote(proposalId, account, support, reason, params);
    }
}
