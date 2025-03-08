// SPDX-License-Identifier: GPL-2.0-or-later

/** 
 * @title Swap.sol 
 * @author Steven Ens
 */

pragma solidity ^0.8.27;
// Required by Uniswap contracts so explicitly shown
pragma abicoder v2;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol"; // Compiler ^0.8.0
// v1 is used instead of v2 as I don't require the extra return values of v2
import "@uniswap/v3-periphery/contracts/interfaces/IQuoter.sol";  // Compiler >=0.7.5
import "@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol";  // Compiler >=0.7.5
// Used for transferring ETH only
import "@uniswap/v3-periphery/contracts/libraries/TransferHelper.sol"; // Compiler >=0.6.0
import "./Declare.sol";
import "../interfaces/IWETH9.sol";

/** 
 * @dev Includes Uniswap swaps for buying and selling TIFDAO, as well as the required swaps for removing tokens voted
 * out and reinvesting them back into the minValuedToken. 
 */
contract Swap is Declare {
    // Set to local deployer for tests and personal mainnet address for launch
    address private constant FEE_RECEIVER = 0xB9A82ACDAd5CC28d9867b10D879CF3e3ce1bDafF;
    // The Uniswap v3 router requires WETH as the input token and does the conversion from ETH to WETH automatically 
    address private constant WETH_ADDRESS = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;
    IWETH9 private constant WETH = IWETH9(WETH_ADDRESS);
    // Uniswap v1 quoter
    address private constant UNISWAP_QUOTER_ADDRESS = 0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6;
    IQuoter private constant UNISWAP_QUOTER = IQuoter(UNISWAP_QUOTER_ADDRESS);
    // Uniswap v3 router
    address private constant UNISWAP_ROUTER_ADDRESS = 0xE592427A0AEce92De3Edee1F18E0157C05861564;
    ISwapRouter private constant UNISWAP_ROUTER = ISwapRouter(UNISWAP_ROUTER_ADDRESS);

    /**
     * @dev Necessary for withdrawing WETH and allowing this contract to receive ETH. IWETH9.withdraw(uint256) works by
     * burning the supplied amount of the WETH tokens and transferring the same amount of ETH back to the msg.sender
     */
    receive() external payable {}

    /**
     * @dev Called externally in a try/catch while calculating getMinValuedToken() and internally in
     * _burnUserContribution()
     */
    function getUniswapQuote(
        address tokenIn, 
        address tokenOut, 
        uint24 fee, 
        uint256 amountIn, 
        uint160 sqrtPriceLimitX96
    )
        public 
        returns (uint256) 
    {
        uint256 amountOut = UNISWAP_QUOTER.quoteExactInputSingle(
            tokenIn,
            tokenOut,
            fee,
            amountIn,
            sqrtPriceLimitX96
        ); 
        return amountOut;
    }

    /**
     * @dev This is the swap operation for when a user calls buyTif()
     */
    function _ethToMinTokenFromMsgValue(uint256 msgValue, MinValuedToken memory minValuedTokenInfo) internal {
        // Take the 1.5% fee before performing the swap        
        TransferHelper.safeTransferETH(payable(FEE_RECEIVER), ((msgValue / 1000) * 15));
        // The Uniswap router automatically converts ETH to WETH. Tokens are held by Main.sol
        ISwapRouter.ExactInputSingleParams memory uniswapInfo = ISwapRouter.ExactInputSingleParams({
            tokenIn: WETH_ADDRESS,
            tokenOut: minValuedTokenInfo.tokenAddress,
            fee: 3000,
            recipient: address(this),
            // Complete the transaction in the current block 
            deadline: block.timestamp,
            // Send the msg.value accounting for the 1.5% fee already removed
            amountIn: ((msgValue / 1000) * 985),
            amountOutMinimum: minValuedTokenInfo.minTokenOutput,
            sqrtPriceLimitX96: 0
        });
        // Send the msg.value accounting for the 1.5% fee already removed
        UNISWAP_ROUTER.exactInputSingle{ value: ((msgValue / 1000) * 985) }(uniswapInfo);
    }

    /**
     * @dev This is the swap that executes when a user calls sellTif(). The 1.5% fee is collected in the bottom of this
     * operation after the conversion of WETH back to ETH
     */
    function _maxTokenToEthFromMaxToken(
        uint256 minTokenOutput,
        uint256 maxTokenAmountToSell,
        MaxValuedToken memory maxValuedTokenInfo
    ) 
        internal 
    {
        // Get the instance of the maxValuedToken contract 
        ERC20 tokenInstance = ERC20(maxValuedTokenInfo.tokenAddress);
        // Approve the Uniswap v3 router to spend the maxTokenAmountToSell of the max valued token
        tokenInstance.approve(UNISWAP_ROUTER_ADDRESS, maxTokenAmountToSell);

        ISwapRouter.ExactInputSingleParams memory uniswapInfo = ISwapRouter.ExactInputSingleParams({
            tokenIn: maxValuedTokenInfo.tokenAddress,
            tokenOut: WETH_ADDRESS,
            fee: 3000,
            recipient: address(this),
            deadline: block.timestamp,
            amountIn: maxTokenAmountToSell,
            amountOutMinimum: minTokenOutput,
            sqrtPriceLimitX96: 0
        });
        // The amount of WETH to be received by the swap
        uint256 amountOut = UNISWAP_ROUTER.exactInputSingle(uniswapInfo);
        // Convert WETH back to ETH
        WETH.withdraw(amountOut);
        // The 1.5% fee is collected here after conversion back to ETH
        TransferHelper.safeTransferETH(payable(FEE_RECEIVER), ((amountOut / 1000) * 15));
        // Transfer the remaining ETH back to the user less the 1.5% fee
        TransferHelper.safeTransferETH(payable(msg.sender), ((amountOut / 1000) * 985));
    }

    /**
     * @dev This is the swap in sellRemovedToken(), selling the removedToken for WETH and converting it to ETH to
     * be held by this contract until the next swap is executed. No fee is taken in this operation as it only
     * reallocates existing funds. 
     */
    function _removedTokenToEthFromRemovedToken(
        address removedToken, 
        uint256 tokenAmountToSell, 
        uint256 minTokenOutput
    ) 
    internal 
    {
        // Get the instance of the token contract of the tokenToRemove
        ERC20 tokenInstance = ERC20(removedToken);
        // Approve the router to spend tokenAmount of the maxValuedToken
        tokenInstance.approve(UNISWAP_ROUTER_ADDRESS, tokenAmountToSell);

        // This contract receives the ETH in order to buy the minValuedToken through ethToMinTokenFromThisBalance()
        ISwapRouter.ExactInputSingleParams memory uniswapInfo = ISwapRouter.ExactInputSingleParams({
            tokenIn: removedToken,
            tokenOut: WETH_ADDRESS,
            fee: 3000,
            recipient: address(this),
            deadline: block.timestamp,
            amountIn: tokenAmountToSell,
            amountOutMinimum: minTokenOutput,
            sqrtPriceLimitX96: 0
        });
        // The amount of WETH to be received by the swap 
        uint256 amountOut = UNISWAP_ROUTER.exactInputSingle(uniswapInfo);
        // Convert WETH back to ETH
        WETH.withdraw(amountOut);
    }

    /**
     * @dev This is the second swap of removing a token from the index. It's called in reinvestFundEther() and converts
     * the ETH of the removed token's sale back to the newly calculated minValuedToken. No fee is taken in this
     * operation as it only reallocates existing funds.
     */
    function _ethToMinTokenFromThisBalance(uint256 percentOfBalance, MinValuedToken memory minValuedTokenInfo) internal {
        ISwapRouter.ExactInputSingleParams memory uniswapInfo = ISwapRouter.ExactInputSingleParams({
            tokenIn: WETH_ADDRESS,
            tokenOut: minValuedTokenInfo.tokenAddress,
            fee: 3000,
            recipient: address(this),
            deadline: block.timestamp,
            // If ETH is force sent to this contract then it will be spent here, increasing the value of every TIFDAO
            // Token already held by users
            amountIn: ((address(this).balance * percentOfBalance) / 100),
            amountOutMinimum: minValuedTokenInfo.minTokenOutput,
            sqrtPriceLimitX96: 0
        });
        UNISWAP_ROUTER.exactInputSingle{ value: ((address(this).balance * percentOfBalance) / 100)}(uniswapInfo);
    }
}
