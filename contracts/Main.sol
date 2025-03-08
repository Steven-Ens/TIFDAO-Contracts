// SPDX-License-Identifier: GPL-2.0-or-later

/**
 * @title Main.sol
 * @author Steven Ens
 */

// Allow for bugfix releases until 0.9.0
pragma solidity ^0.8.27;

// @openzeppelin contracts use compiler version ^0.8.0
import "@openzeppelin/contracts/access/AccessControl.sol"; 
import "@openzeppelin/contracts/token/ERC20/ERC20.sol"; 
// This file is local as the npm version uses compiler 0.8.3 only. The only change made is adding ^0.8.3
import "./BalanceScanner.sol"; 
// Compiler version ^0.8.27 is used for all of the following files:
import "./Token.sol";
import "./interfaces/IPause.sol";
import "./extensions/Declare.sol";
import "./extensions/Utils.sol"; 
import "./extensions/Swap.sol";
import "./extensions/Validate.sol";

/**
 * @dev Includes methods related to getting and setting the state of the Token Index Fund DAO
 */
contract Main is AccessControl, Declare, Utils, Swap, Validate {
    // The active Token.sol contract address and instance assigned in the constructor
    address private _tifAddress; 
    Token private _tifInstance;
    // Stores the block number of the the last call to removeTokenFromIndex()
    uint256 private _blockLastCalled;
    // Used to ensure buy() and sell() transactions do not use old input data
    uint256 private _lastTimestampCalled;
    // Number of tokens in the index including those that are set to false. It's used to terminate for loops looping
    // through _index values. It's increased after brand new tokens are successfully added to the index through
    // addTokenToIndex(), though not decreased after removeTokenFromIndex() as tokens set to false can still be voted
    // back in afterwards and this prevents a token from occupying more than one slot in _index
    uint256 private _totalTokensInIndex = 60;
    // Limits the gas for calls to paused() in getMinValuedToken() and getMaxValuedToken(). Successful calls use <
    // 10000 gas so this is a safe limit that prevents Invalid FE Opcode errors from using too much gas
    uint256 private constant GAS_LIMIT = 50000; 
    // The GOVERNANCE_ROLE is given to the Governance.sol contract instance in scripts/deploy.js so it can execute
    // proposals calling addTokenToIndex() and removeTokenFromIndex()
    bytes32 private constant GOVERNANCE_ROLE = keccak256("GOVERNANCE_ROLE");
    // Includes tokens set to false, it's a hard cap implemented to prevent looping over 100 times through _index
    uint256 private constant MAX_TOKENS_IN_INDEX = 100;
    // Includes tokens set to false, no less than 50 tokens can be in the index to help prevent mass token removal
    uint256 private constant MIN_TOKENS_IN_INDEX = 50;
    // Safety feature to prevent a single large voter or collection of voters from mass removing tokens by adding a
    // week delay between token removals. Proposals adding tokens to the index are not limited. If multiple proposals
    // are ready to be executed at the same time then users can choose which order to execute them, in case there is a
    // hack on a token or a removal with a higher priority
    uint256 private constant ONE_WEEK_IN_BLOCKS = 50_400;
    // eth-scan balance scanner 
    address private constant BALANCE_SCANNER_ADDRESS = 0x08A8fDBddc160A7d5b957256b903dCAb1aE512C5;
    BalanceScanner private constant BALANCE_SCANNER = BalanceScanner(BALANCE_SCANNER_ADDRESS);
    // The Uniswap v3 router requires WETH as the input token and does the conversion from ETH to WETH automatically 
    address private constant WETH_ADDRESS = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;
    // Token contract addresses of index tokens 
    address private constant LINK_ADDRESS = 0x514910771AF9Ca656af840dff83E8264EcF986CA;
    address private constant SHIB_ADDRESS = 0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE;
    address private constant UNI_ADDRESS = 0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984; 
    address private constant PEPE_ADDRESS = 0x6982508145454Ce325dDbE47a25d4ec3d2311933;
    address private constant ONDO_ADDRESS = 0xfAbA6f8e4a5E8Ab82F62fe7C39859FA577269BE3; 
    address private constant AAVE_ADDRESS = 0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9;
    address private constant MNT_ADDRESS = 0x3c3a81e81dc49A522A592e7622A7E711c06bf354;
    address private constant POL_ADDRESS = 0x455e53CBB86018Ac2B8092FdCd39d8444aFFC3F6; 
    address private constant RENDER_ADDRESS = 0x6De037ef9aD2725EB40118Bb1702EBb27e4Aeb24; 
    address private constant ARB_ADDRESS = 0xB50721BCf8d664c30412Cfbc6cf7a15145234ad1; 
    address private constant FET_ADDRESS = 0xaea46A60368A7bD060eec7DF8CBa43b7EF41Ad85;
    address private constant ENA_ADDRESS = 0x57e114B691Db790C35207b2e685D4A43181e6061;
    address private constant IMX_ADDRESS = 0xF57e7e7C23978C3cAEC3C3548E3D615c346e79fF;
    address private constant INJ_ADDRESS = 0xe28b3B32B6c345A34Ff64674606124Dd5Aceca30;
    address private constant LDO_ADDRESS = 0x5A98FcBEA516Cf06857215779Fd812CA3beF1B32;
    address private constant GRT_ADDRESS = 0xc944E90C64B2c07662A292be6244BDf05Cda44a7;
    address private constant WLD_ADDRESS = 0x163f8C2467924be0ae7B5347228CABF260318753;
    address private constant QNT_ADDRESS = 0x4a220E6096B25EADb88358cb44068A3248254675;
    address private constant NEXO_ADDRESS = 0xB62132e35a6c13ee1EE0f84dC5d40bad8d815206;
    address private constant SAND_ADDRESS = 0x3845badAde8e6dFF049820680d1F14bD3903a5d0; 
    address private constant ENS_ADDRESS = 0xC18360217D8F7Ab5e7c516566761Ea12Ce7F9D72;
    address private constant CRV_ADDRESS = 0xD533a949740bb3306d119CC777fa900bA034cd52;
    address private constant BTT_ADDRESS = 0xC669928185DbCE49d2230CC9B0979BE6DC797957; 
    address private constant MKR_ADDRESS = 0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2;
    address private constant AXS_ADDRESS = 0xBB0E17EF65F82Ab018d8EDd776e8DD940327B28b;
    address private constant BEAM_ADDRESS = 0x62D0A8458eD7719FDAF978fe5929C6D342B0bFcE;
    address private constant MANA_ADDRESS = 0x0F5D2fB29fb7d3CFeE444a200298f468908cC942;
    address private constant RSR_ADDRESS = 0x320623b8E4fF03373931769A31Fc52A4E78B5d70;
    address private constant APE_ADDRESS = 0x4d224452801ACEd8B2F0aebE155379bb5D594381;
    address private constant W_ADDRESS = 0xB0fFa8000886e57F86dd5264b9582b2Ad87b2b91;
    address private constant CHZ_ADDRESS = 0x3506424F91fD33084466F402d5D97f05F8e3b4AF;
    address private constant EIGEN_ADDRESS = 0xec53bF9167f50cDEB3Ae105f56099aaaB9061F83;
    address private constant COMP_ADDRESS = 0xc00e94Cb662C3520282E6f5717214004A7f26888;
    address private constant AMP_ADDRESS = 0xfF20817765cB7f73d4bde2e66e067E58D11095C2;
    address private constant PENDLE_ADDRESS = 0x808507121B80c02388fAd14726482e061B8da827;
    address private constant PRIME_ADDRESS = 0xb23d80f5FefcDDaa212212F028021B41DEd428CF;
    address private constant GNO_ADDRESS = 0x6810e776880C02933D47DB1b9fc05908e5386b96;
    address private constant SNX_ADDRESS = 0xC011a73ee8576Fb46F5E1c5751cA3B9Fe0af2a6F;
    address private constant AXL_ADDRESS = 0x467719aD09025FcC6cF6F8311755809d45a5E5f3; 
    address private constant DYDX_ADDRESS = 0x92D6C1e31e14520e676a687F0a93788B716BEff5; 
    address private constant SUPER_ADDRESS = 0xe53EC727dbDEB9E2d5456c3be40cFF031AB40A55;
    address private constant INCH_ADDRESS = 0x111111111117dC0aa78b770fA6A738034120C302;
    address private constant SAFE_ADDRESS = 0x5aFE3855358E112B5647B952709E6165e1c1eEEe;
    address private constant LPT_ADDRESS = 0x58b6A8A3302369DAEc383334672404Ee733aB239;
    address private constant ZRO_ADDRESS = 0x6985884C4392D348587B19cb9eAAf157F13271cd;
    address private constant BLUR_ADDRESS = 0x5283D291DBCF85356A21bA090E6db59121208b44;
    address private constant TURBO_ADDRESS = 0xA35923162C49cF95e6BF26623385eb431ad920D3; 
    address private constant HOT_ADDRESS = 0x6c6EE5e31d828De241282B9606C8e98Ea48526E2;
    address private constant ZRX_ADDRESS = 0xE41d2489571d322189246DaFA5ebDe1F4699F498;
    address private constant BAT_ADDRESS = 0x0D8775F648430679A709E98d2b0Cb6250d2887EF;
    address private constant GLM_ADDRESS = 0x7DD9c5Cba05E151C895FDe1CF355C9A1D5DA6429;
    address private constant TRAC_ADDRESS = 0xaA7a9CA87d3694B5755f213B5D04094b8d0F0A6F;
    address private constant SKL_ADDRESS = 0x00c83aeCC790e8a4453e5dD3B0B4b3680501a7A7;
    address private constant IOTX_ADDRESS = 0x6fB3e0A217407EFFf7Ca062D46c26E5d60a14d69;
    address private constant ANKR_ADDRESS = 0x8290333ceF9e6D528dD5618Fb97a76f268f3EDD4;
    address private constant ENJ_ADDRESS = 0xF629cBd94d3791C9250152BD8dfBDF380E2a3B9c;
    address private constant MEME_ADDRESS = 0xb131f4A55907B10d1F0A50d8ab8FA09EC342cd74;
    address private constant MASK_ADDRESS = 0x69af81e73A73B40adF4f3d4223Cd9b1ECE623074;
    address private constant METIS_ADDRESS = 0x9E32b13ce7f2E80A01932B42553652E053D6ed8e;
    address private constant NEIRO_ADDRESS = 0x812Ba41e071C7b7fA4EBcFB62dF5F45f6fA853Ee;

    struct PriceData {
        uint256 price;
        uint256 convertedPrice;
        uint256 tokenAmountInFund;
        uint256 tokenValueInFund;
    }
    struct MintData {
        uint256 tifTotalSupply;
        uint256 tokenAmountAfterSwap;
        uint256 userContributedTokenAmount;
        uint256 userContributedTokenValue;
        uint256 userContributedValuePercent;
        uint256 tifToMint;
    }
    struct BurnData {
        uint256 tifTotalSupply;
        uint256 userPercentOfTotalSupply;
        uint256 maxTokenPercentOfTotalValue;
        uint256 userPercentOfMaxTokenPercent;
        uint256 maxTokenAmountToSell;
        uint256 tifToBurn;
        uint256 minTokenOutput;
        uint256 expectedOutput;
    }
    struct IndexData {
        address tokenAddress;
        bytes32 tokenSymbol;
        bool tokenActive;
        bool tokenRemoved;
    }

    // Uses a uint as the key (starting from 0 and incrementing by 1) to allow for iteration over the keys
    mapping(uint256 => IndexData) private _index;

    /// Allow the front-end to watch for these events
    event TokensMinted(uint256 indexed amount);
    event TokensBurned(uint256 indexed amount);
    event TokenAdded(address indexed token);
    event TokenRemoved(address indexed token);

    // getTokenSymbol();
    error SymbolNotFound();
    // getRunningValueTotal(), getMinValuedToken() and getMaxValuedToken()
    error BalanceScanFailed();
    // burnUserContribution() and _burnUserContribution()
    error InsufficientOutputAmount();
    // buy() and sell()
    error OutdatedInputData();
    error InsufficientInputAmount();
    // addTokenToIndex()
    error MaximumTokenQuantity();
    error TokenAlreadyAdded();
    error InvalidTokenSymbol();
    // removeTokenFromIndex()
    error RemovalLimitReached();
    error MinimumTokenQuantity();
    // _setTokenRemoved()
    error TokenAlreadyRemoved();
    // _getTokenRemoved()
    error TokenNotRemoved();
    // _setTokenToFalse()
    error TokenAlreadyInactive();
    // reinvestFundEther()
    error NoContractBalance();
    
    // Pass the address of the created Token.sol contract from scripts/deploy.js
    // solhint-disable-next-line func-visibility
    constructor(address tifAddress_) {
        // Temporarily give the DEFAULT_ADMIN_ROLE to the deployer address in order to assign the GOVERNANCE_ROLE to
        // Governance.sol. This role is revoked at the end of scripts/deploy.js
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);

        _tifAddress = tifAddress_;
        _tifInstance = Token(_tifAddress);

        // Assign each token a key, and set the IndexData values
        _index[0] = IndexData(LINK_ADDRESS, "LINK", true, false);
        _index[1] = IndexData(SHIB_ADDRESS, "SHIB", true, false);
        _index[2] = IndexData(UNI_ADDRESS, "UNI", true, false);
        _index[3] = IndexData(PEPE_ADDRESS, "PEPE",true, false);
        _index[4] = IndexData(ONDO_ADDRESS, "ONDO", true, false);
        _index[5] = IndexData(AAVE_ADDRESS, "AAVE", true, false);
        _index[6] = IndexData(MNT_ADDRESS, "MNT", true, false);
        _index[7] = IndexData(POL_ADDRESS, "POL", true, false);
        _index[8] = IndexData(RENDER_ADDRESS, "RENDER", true, false);
        _index[9] = IndexData(ARB_ADDRESS, "ARB", true, false);
        _index[10] = IndexData(FET_ADDRESS, "FET", true, false);
        _index[11] = IndexData(ENA_ADDRESS, "ENA", true, false);
        _index[12] = IndexData(IMX_ADDRESS, "IMX", true, false);
        _index[13] = IndexData(INJ_ADDRESS, "INJ", true, false);
        _index[14] = IndexData(LDO_ADDRESS, "LDO", true, false);
        _index[15] = IndexData(GRT_ADDRESS, "GRT", true, false);
        _index[16] = IndexData(WLD_ADDRESS, "WLD", true, false);
        _index[17] = IndexData(QNT_ADDRESS, "QNT", true, false);
        _index[18] = IndexData(NEXO_ADDRESS, "NEXO", true, false);
        _index[19] = IndexData(SAND_ADDRESS, "SAND", true, false);
        _index[20] = IndexData(ENS_ADDRESS, "ENS", true, false);
        _index[21] = IndexData(CRV_ADDRESS, "CRV", true, false);
        _index[22] = IndexData(BTT_ADDRESS, "BTT", true, false);
        _index[23] = IndexData(MKR_ADDRESS, "MKR", true, false);
        _index[24] = IndexData(AXS_ADDRESS, "AXS", true, false);
        _index[25] = IndexData(BEAM_ADDRESS, "BEAM", true, false);
        _index[26] = IndexData(MANA_ADDRESS, "MANA", true, false);
        _index[27] = IndexData(RSR_ADDRESS, "RSR", true, false);
        _index[28] = IndexData(APE_ADDRESS, "APE", true, false);
        _index[29] = IndexData(W_ADDRESS, "W", true, false);
        _index[30] = IndexData(CHZ_ADDRESS, "CHZ", true, false);
        _index[31] = IndexData(EIGEN_ADDRESS, "EIGEN", true, false);
        _index[32] = IndexData(COMP_ADDRESS, "COMP", true, false);
        _index[33] = IndexData(AMP_ADDRESS, "AMP", true, false);
        _index[34] = IndexData(PENDLE_ADDRESS, "PENDLE", true, false);
        _index[35] = IndexData(PRIME_ADDRESS, "PRIME", true, false);
        _index[36] = IndexData(GNO_ADDRESS, "GNO", true, false);
        _index[37] = IndexData(SNX_ADDRESS, "SNX", true, false);
        _index[38] = IndexData(AXL_ADDRESS, "AXL", true, false);
        _index[39] = IndexData(DYDX_ADDRESS, "ETHDYDX", true, false);
        _index[40] = IndexData(SUPER_ADDRESS, "SUPER", true, false);
        _index[41] = IndexData(INCH_ADDRESS, "1INCH", true, false);
        _index[42] = IndexData(SAFE_ADDRESS, "SAFE", true, false);
        _index[43] = IndexData(LPT_ADDRESS, "LPT", true, false);
        _index[44] = IndexData(ZRO_ADDRESS, "ZRO", true, false);
        _index[45] = IndexData(BLUR_ADDRESS, "BLUR", true, false);
        _index[46] = IndexData(TURBO_ADDRESS, "TURBO", true, false);
        _index[47] = IndexData(HOT_ADDRESS, "HOT", true, false);
        _index[48] = IndexData(ZRX_ADDRESS, "ZRX", true, false);
        _index[49] = IndexData(BAT_ADDRESS, "BAT", true, false);
        _index[50] = IndexData(GLM_ADDRESS, "GLM", true, false);
        _index[51] = IndexData(TRAC_ADDRESS, "TRAC", true, false);
        _index[52] = IndexData(SKL_ADDRESS, "SKL", true, false);
        _index[53] = IndexData(IOTX_ADDRESS, "IOTX", true, false);
        _index[54] = IndexData(ANKR_ADDRESS, "ANKR", true, false);
        _index[55] = IndexData(ENJ_ADDRESS, "ENJ", true, false);
        _index[56] = IndexData(MEME_ADDRESS, "MEME", true, false);
        _index[57] = IndexData(MASK_ADDRESS, "MASK", true, false);
        _index[58] = IndexData(METIS_ADDRESS, "METIS", true, false);
        _index[59] = IndexData(NEIRO_ADDRESS, "NEIRO", true, false);
    }

    /**
     * @dev This function is called by the front-end to get the tokenSymbol of the address inputted by the user. The
     * symbol is used to get the token price on the front-end, before the price of the token is used in
     * sellRemovedToken().
     */
    function getTokenSymbol(address token) external view returns (bytes32) {
        // Cache the storage value
        uint256 totalTokensInIndex = _totalTokensInIndex;
        // Loop through every _index key to see if it's the correct tokenAddress
        for (uint256 i; i < totalTokensInIndex; i++) {
            if (_index[i].tokenAddress == token) {
                return _index[i].tokenSymbol;
            }
        }
        revert SymbolNotFound();
    }

    /**
     * @dev This function is automatically called by the front-end to get the current price of the TIFDAO Token in
     * Ether when a user connects their wallet. A non-zero runningValueTotal and totalSupply() is required or the error
     * InvalidZeroInput() occurs from Utils.sol.
     */
    function getCurrentPrice(uint256 runningValueTotal) external view returns (uint256) {
        return _divide(runningValueTotal, _tifInstance.totalSupply());
    }

    /**
     * @dev This function is automatically called by the front-end to get the current runningValueTotal of all of the
     * tokens within the TIFDAO Fund as well as the Ether balance of the this contract. The runningValueTotal is used
     * in getCurrentPrice(). An array with the value of each token is also returned in order to calculate the
     * allocation of each token in the TIFDAO Fund on the front-end. View getMinValuedToken() for code comments.
     */
    function getRunningValueTotal(
        address[] memory activeTokens, 
        uint256[] memory tokenPrices, 
        uint256 numOfActiveTokens
    )
        external 
        view
        returns (uint256[] memory tokenValues, uint256 runningValueTotal) 
    {
        PriceData memory priceData;
        BalanceScanner.Result[] memory balanceScannerResult;
        balanceScannerResult = BALANCE_SCANNER.tokensBalance(address(this), activeTokens);
        tokenValues = new uint256[](numOfActiveTokens);
        for (uint256 i; i < numOfActiveTokens; i++) {
            delete priceData;
            if (balanceScannerResult[i].success != true)
                revert BalanceScanFailed();
            priceData.price = tokenPrices[i];
            if (priceData.price == 0)
                continue;
            priceData.convertedPrice = uint256(priceData.price);
            priceData.tokenAmountInFund = _bytesToUint256(balanceScannerResult[i].data);
            if (priceData.tokenAmountInFund != 0) {
                priceData.tokenValueInFund = _multiply(priceData.convertedPrice, priceData.tokenAmountInFund);
                runningValueTotal += priceData.tokenValueInFund;
            } else {
                priceData.tokenValueInFund = 0;
            }
            // Save each token's value to get the token allocation in the TIFDAO Fund on the front-end
            tokenValues[i] = priceData.tokenValueInFund;
        }
        // If a token is sold for an ether balance but still has some token balance left it's still active, so include
        // the balance in the overall runningValueTotal. 
        runningValueTotal += address(this).balance;
    }

    /**
     * @dev This function is called from the front-end to simulate _mintUserContribution() if the user executes the
     * transaction. This function does not mint tokens or emit events, it just provides a quote accounting for the
     * 1.5% fee. View _mintUserContribution() for comments.
     */
    function mintUserContribution(
        uint256 msgValue,
        MinValuedToken memory minValuedTokenInfo, 
        uint256 runningValueTotal
    ) 
    external 
    returns (uint256) 
    {
        MintData memory mintInfo;
        mintInfo.tifTotalSupply = _tifInstance.totalSupply();
        if (mintInfo.tifTotalSupply != 0) {
            // Account for the 1.5% fee
            uint256 availableMsgValue = ((985 * msgValue) / 1000);
            // Need a quote as _mintUserContribution() uses token balances before and after a swap
            uint256 amountOut = getUniswapQuote(
                WETH_ADDRESS, 
                minValuedTokenInfo.tokenAddress, 
                3000, 
                availableMsgValue, 
                0
            );
            mintInfo.userContributedTokenValue = _multiply(
                amountOut, 
                minValuedTokenInfo.tokenPrice
            );
            mintInfo.userContributedValuePercent = _divide(
                mintInfo.userContributedTokenValue, 
                runningValueTotal
            );
            return _multiply(mintInfo.userContributedValuePercent, mintInfo.tifTotalSupply);
        } else {
            return 1000 * (10 ** 18);
        }
    }
    
    /**
     * @dev This function is called from the front-end to simulate _burnUserContribution() if the user executes the
     * transaction. This function does not burn or emit events, it just provides a quote accounting for the 1.5% fee.
     * If the full amount of userTokensToBurn cannot be burned from the maxValuedToken then it provides the amount of
     * tokens that can be burned, where the front-end updates the input field to show the user. Assumes that 
     * userTokensToBurn is in 18 decimal format from the front-end. View _burnUserContribution() for comments.
     */
    function burnUserContribution(
        uint256 userTokensToBurn,
        MaxValuedToken memory maxValuedTokenInfo,
        uint256 runningValueTotal
    ) 
        external
        returns (uint256, uint256)
    {
        BurnData memory burnData;
        burnData.tifTotalSupply = _tifInstance.totalSupply();
        burnData.userPercentOfTotalSupply = _divide(userTokensToBurn, burnData.tifTotalSupply);
        burnData.maxTokenPercentOfTotalValue = _divide(maxValuedTokenInfo.tokenValue, runningValueTotal);
        if (burnData.userPercentOfTotalSupply <= burnData.maxTokenPercentOfTotalValue) {
            burnData.userPercentOfMaxTokenPercent = _divide(
                burnData.userPercentOfTotalSupply, 
                burnData.maxTokenPercentOfTotalValue
            );
            burnData.maxTokenAmountToSell = _multiply(
                burnData.userPercentOfMaxTokenPercent,
                maxValuedTokenInfo.tokenAmount
            );
            burnData.tifToBurn = userTokensToBurn;
        } else {
            burnData.maxTokenAmountToSell = maxValuedTokenInfo.tokenAmount;
            burnData.tifToBurn = _multiply(burnData.maxTokenPercentOfTotalValue, burnData.tifTotalSupply);
        }
        burnData.minTokenOutput = _getMinTokenOutputSell(burnData.maxTokenAmountToSell, maxValuedTokenInfo);
        burnData.expectedOutput = getUniswapQuote(
            maxValuedTokenInfo.tokenAddress,
            WETH_ADDRESS,
            3000,
            burnData.maxTokenAmountToSell,
            0
        );
        if (burnData.expectedOutput < burnData.minTokenOutput)
            revert InsufficientOutputAmount();
        // Calculate the 1.5% fee to show the user how much they should receive
        burnData.expectedOutput = ((985 * burnData.expectedOutput) / 1000);
        // Return the expectedOutput and change the input on the front-end to reflect what can be burned
        return (burnData.expectedOutput, burnData.tifToBurn);
    }

    /**
     * @dev This function is called from the front-end by the user with inputs from the static call to save gas. Marked
     * as payable because the msg.value is required. This function requires a valid signature generated by the signing
     * server. 
     */
    function buy(
        bytes memory signature,
        uint256 timestamp,
        MinValuedToken memory minValuedTokenInfo, 
        uint256 runningValueTotal
    ) 
    external 
    payable 
    onlyValidSignatureBuyTif(
        signature,
        timestamp,
        msg.sender,
        minValuedTokenInfo.tokenAddress,
        minValuedTokenInfo.minTokenOutput,
        minValuedTokenInfo.tokenPrice,
        minValuedTokenInfo.tokenAmount,
        minValuedTokenInfo.tokenValue,
        runningValueTotal
    )
    {
        // Ensures only one transaction goes through per block otherwise the user must get updated input data
        if (timestamp < _lastTimestampCalled) 
            revert OutdatedInputData();
        // Update to ensure only one transaction per block
        _lastTimestampCalled = block.timestamp;

        uint256 msgValue = _getMsgValue();
        // The minimum msg.value is 1000 wei as the fee calculation divides by 1000 
        if (msgValue < 1000 wei) {
            revert InsufficientInputAmount();
        }

        // Swap the user's ETH for the calculated minValuedToken 
        _ethToMinTokenFromMsgValue(msgValue, minValuedTokenInfo);
        // Mint the user's TIFDAO, has to be after the swap to calculate how many tokens were added
        _mintUserContribution(minValuedTokenInfo, runningValueTotal);
    }
    
    /**
     * @dev This function is used in buy() and getMinValuedToken().
     */
    function _getMsgValue() internal view returns (uint256) {
        return msg.value;
    }
    
    /**
     * @dev This function mints the tokens to the user and emits the event TokensMinted. It's called within buy()
     * after the user's ETH is swapped for the minValueToken.
     */
    function _mintUserContribution(MinValuedToken memory minValuedTokenInfo, uint256 runningValueTotal) internal {
        MintData memory mintInfo;
        // If supply is 0 then it's the first transaction which automatically sets the exchange rate
        mintInfo.tifTotalSupply = _tifInstance.totalSupply();
        if (mintInfo.tifTotalSupply != 0) {
            // Calculate the amount of tokens the user added
            ERC20 tokenInstance = ERC20(minValuedTokenInfo.tokenAddress);
            mintInfo.tokenAmountAfterSwap = tokenInstance.balanceOf(address(this)); 
            mintInfo.userContributedTokenAmount = mintInfo.tokenAmountAfterSwap - minValuedTokenInfo.tokenAmount;
            // Calculate the value added to the index and the percentage of the value vs runningValueTotal
            mintInfo.userContributedTokenValue = _multiply(
                mintInfo.userContributedTokenAmount, 
                minValuedTokenInfo.tokenPrice
            );
            mintInfo.userContributedValuePercent = _divide(
                mintInfo.userContributedTokenValue, 
                runningValueTotal
            );
            mintInfo.tifToMint = _multiply(mintInfo.userContributedValuePercent, mintInfo.tifTotalSupply);
        } else {
            // Set exchange rate
            mintInfo.tifToMint = 1000 * (10 ** 18);
        }
        // Mint the tokens and emit the event
        _tifInstance.mint(msg.sender, mintInfo.tifToMint);
        emit TokensMinted(mintInfo.tifToMint);
    }

    /**
     * @dev This function is called from the front-end by the user with inputs from the static call to save gas. 
     * Assumes userTokensToBurn is in 18 decimal format.
     */
    function sell(
        bytes memory signature,
        uint256 timestamp, 
        uint256 userTokensToBurn, 
        MaxValuedToken memory maxValuedTokenInfo, 
        uint256 runningValueTotal
    )
    external 
    onlyValidSignatureSellTif(
        signature,
        timestamp,
        msg.sender,
        userTokensToBurn,
        maxValuedTokenInfo.tokenAddress,
        maxValuedTokenInfo.tokenPrice,
        maxValuedTokenInfo.tokenAmount,
        maxValuedTokenInfo.tokenValue,
        runningValueTotal
    )
    {
        // Ensures only one transaction goes through per block otherwise the user must get updated input data
        if (timestamp < _lastTimestampCalled) 
            revert OutdatedInputData();
        // Update to ensure only one transaction per block
        _lastTimestampCalled = block.timestamp;

        if (userTokensToBurn == 0) {
            revert InsufficientInputAmount();
        }
        // The swap happens in burnUserContribution() after calculating the percentage of the maxValuedToken that the
        // user is able to sell from
        _burnUserContribution(userTokensToBurn, maxValuedTokenInfo, runningValueTotal);
    } 
    
    /**
     * @dev This function requires users to provide an allowance to Main.sol via approve() in Token.sol before calling
     * sell(). This function assumes that either burning userTokensToBurn is possible in one transaction, or the
     * user accepted the front-end input change to burn as much as possible in one transaction. Assumes that 
     * userTokensToBurn is in 18 decimal format from the front-end.
     */
    function _burnUserContribution(
        uint256 userTokensToBurn,
        MaxValuedToken memory maxValuedTokenInfo,
        uint256 runningValueTotal
    ) 
        internal 
    {
        BurnData memory burnData;
        burnData.tifTotalSupply = _tifInstance.totalSupply();
        // Percentage of tokens the user wants to burn vs the current total supply
        burnData.userPercentOfTotalSupply = _divide(userTokensToBurn, burnData.tifTotalSupply);
        // Percentage of the max valued token's value vs the current runningValueTotal of all tokens in the index plus
        // any Ether balance the contract has
        burnData.maxTokenPercentOfTotalValue = _divide(maxValuedTokenInfo.tokenValue, runningValueTotal);
        // Compare if the percentage of tokens owned by the user is less than or equal to the percentage of the max
        // token's value vs the runningValueTotal. If so, then the full amount of maxValuedToken can be swapped in one
        // transaction and all of userTokensToBurn can be burned
        if (burnData.userPercentOfTotalSupply <= burnData.maxTokenPercentOfTotalValue) {
            // Calculate how much of the maxValuedToken the user can actually sell. For example, say the user owns 10%
            // of the total tokens and the max valued token is 12% of the total token value, then the user can only
            // sell 10/12 of of max valued token 
            burnData.userPercentOfMaxTokenPercent = _divide(
                burnData.userPercentOfTotalSupply, 
                burnData.maxTokenPercentOfTotalValue
            );
            // Calculate the amount of the maxValuedToken to sell
            burnData.maxTokenAmountToSell = _multiply(
                burnData.userPercentOfMaxTokenPercent,
                maxValuedTokenInfo.tokenAmount
            );
            // The amount of tokens to burn is the initial userTokensToBurn from the user
            burnData.tifToBurn = userTokensToBurn;
        } else {
            // This means all tokens will be sold as the user had a larger percentage of the total supply than the max
            // valued token had compared to the runningValueTotal. Also have to calculate what percentage of the users'
            // tokens to actually burn
            burnData.maxTokenAmountToSell = maxValuedTokenInfo.tokenAmount;
            // Say the user owns 12% of total tokens and max token is only 10% of total value, just multiply the total
            // token supply by the percentage of max tokens vs the total value to burn only that many tokens.
            // maxTokenPercentOfTotalValue is the whole max valued token's percentage of the fund, so sell this many
            // tokens at this time 
            burnData.tifToBurn = _multiply(burnData.maxTokenPercentOfTotalValue, burnData.tifTotalSupply);
        }
        // minTokenOutput is calculated in this function as maxtokenAmountToSell needs to be calculated first.
        // _getMinTokenOutputSell() doesn't take into account the 1.5% fee as that is dealt with in 
        // _maxTokenToEthFromMaxToken() below
        burnData.minTokenOutput = _getMinTokenOutputSell(burnData.maxTokenAmountToSell, maxValuedTokenInfo);
        // Get the expected output of the transaction
        burnData.expectedOutput = getUniswapQuote(
            maxValuedTokenInfo.tokenAddress,
            WETH_ADDRESS,
            3000,
            burnData.maxTokenAmountToSell,
            0
        );
        if (burnData.expectedOutput < burnData.minTokenOutput)
            revert InsufficientOutputAmount();
        // Burn the tokens before the external call 
        _tifInstance.burnFrom(msg.sender, burnData.tifToBurn);
        // Perform the actual swap, where the fee is taken after the conversion before the remainder is sent to the
        // user
        _maxTokenToEthFromMaxToken(
            burnData.minTokenOutput,
            burnData.maxTokenAmountToSell,
            maxValuedTokenInfo
        );
        emit TokensBurned(burnData.tifToBurn);
    }
    
    /** 
     * @dev This function returns the minimum amount of the WETH token output. The 1.5% fee is accounted for within
     * _maxTokenToEthFromMaxToken().
     */
    function _getMinTokenOutputSell(uint256 maxTokenAmountToSell, MaxValuedToken memory maxValuedTokenInfo)
        internal 
        pure 
        returns (uint256) 
    {
        // Get value in Ether as the token received is WETH in this case 
        uint256 minTokenOutputBeforeImpact = _multiply(maxTokenAmountToSell, maxValuedTokenInfo.tokenPrice);
        // Accounts for the allowable 2% price impact
        return ((980 * minTokenOutputBeforeImpact) / 1000);
    }
    
    /**
     * @dev This function is called by the front-end use to be used as input for multiple functions. This function and 
     * getMinValuedToken()/getMaxValuedToken() are called by the front-end in an ethers callStatic() using the Ethereum
     * node eth_call method allowing for a simulated transaction and return of data without actually executing and
     * paying for it. activesymbols is required to get the prices from the CoinMarketCap API, and numOfActiveTokens is
     * required to ensure the price feed checks in getMinValuedToken() and getMaxValuedToken() are all successful.
     */
    function getActiveTokens(uint256 start, uint256 end) 
        external 
        view 
        returns (address[] memory activeTokens, bytes32[] memory activeSymbols, uint256 numOfActiveTokens) {
        // If called for getMaxValuedToken() then use _totalTokensInIndex as the array size and loop end
        if (start == 0 && end == 100) {
            end = _totalTokensInIndex;
            // A dynamic array is used instead of a fixed sized array because the BalanceScanner.sol function
            // tokensBalance() requires a dynamic memory array as a parameter
            activeTokens = new address[](end);
            activeSymbols = new bytes32[](end);
        // Called for batches of 10 in getMinValuedToken()
        } else {
            activeTokens = new address[](10);
            activeSymbols = new bytes32[](10);
        }
        // Using _totalTokensInIndex as end ensures _index keys are not skipped from tokens set to false
        for (uint256 i = start; i < end; i++) {
            // Filter out active tokens and symbols and add their values to their arrays
            if (_index[i].tokenActive) {
                activeTokens[numOfActiveTokens] = _index[i].tokenAddress;
                activeSymbols[numOfActiveTokens] = _index[i].tokenSymbol;
                // Save the number of active tokens currently in the index. As i < _totalTokensInIndex which is limited 
                // to 100 from addTokenToIndex() it's safe from overflow and more gas efficient
                unchecked {
                numOfActiveTokens++;
                }
            }
        }
    }
    
    /**
     * @dev This function checks if the token is paused if it implements the OpenZeppelin Pausable.sol contract with
     * the function paused(). 
     */
    function _isTokenPaused(address token) internal returns (bool) {
        IPause tokenInstance = IPause(token);
        // Use low-level call to invoke `paused()` with limited gas
        (bool success, bytes memory data) = address(tokenInstance).call{ gas: GAS_LIMIT }(
            abi.encodeWithSignature("paused()") //"IDE requires this
        );
        if (success) {
            // If the call is successful, return the paused state
            return abi.decode(data, (bool));
        } else {
            // If the call fails either because the function is missing or there's an invalid opcode error then return
            // false 
            return false;
        }
    }

    /**
     * @dev This function is set to external so it can be called by the front-end interface in a static call. Payable
     * so it can be called with a simulated msg.value from the front-end. runningValueTotal does not include
     * address(this).balance that is fetched on the front-end.
     */
    function getMinValuedToken(
        address[] memory activeTokens, 
        uint256[] memory tokenPrices, 
        uint256 numOfActiveTokens,
        uint256 inputAmount
    )
        external 
        returns (MinValuedToken memory minValuedTokenInfo, uint256 runningValueTotal) 
    {
        PriceData memory priceData;
        // Account for 1.5% fee before calculating expected swap output. Done once here instead of in for loop
        uint256 availableMsgValue = ((985 * inputAmount) / 1000);
        // Result[] is an array of structs where each token has its own index value that represents the two returned
        // struct elements of the balance scanner scan. Consists of a bool dictating success of the call and a
        // bytes32 value of the amount of the token held by the this contract
        BalanceScanner.Result[] memory balanceScannerResult;
        // Return the balances of the active tokens held by this contract
        balanceScannerResult = BALANCE_SCANNER.tokensBalance(address(this), activeTokens);
        // Requiring each call value to succeed means only active tokens within the index can be checked. The index of
        // each token in activeTokens[i] matches the balanceScannerResult[i]
        for (uint256 i; i < numOfActiveTokens; i++) {
            // Resets each loop through in case data remains from tokens not chosen 
            delete priceData;
            // Verify the contract call is successful otherwise revert as this means that the following calculations
            // would not be accurate
            if (!balanceScannerResult[i].success)
                revert BalanceScanFailed();
            // Check if the token is paused before further calculations. Skips tokens that are paused
            if(_isTokenPaused(activeTokens[i]))
                continue;
            // Get the integer token price. Tokens with no price have a value of 0 in tokenPrices
            priceData.price = tokenPrices[i];
            // Don't store tokens with no available price data as the operations below will not be accurate
            if (priceData.price == 0)
                continue;
            // Convert the integer to uint256 as prices returned can't be < 0
            priceData.convertedPrice = uint256(priceData.price);
            // Convert the bytes result to uint256
            priceData.tokenAmountInFund = _bytesToUint256(balanceScannerResult[i].data);
            // If no tokens are held by the fund then don't calculate the value as it's 0
            if (priceData.tokenAmountInFund != 0) {
                // Get the value of the token and add it to runningValueTotal 
                priceData.tokenValueInFund = _multiply(priceData.convertedPrice, priceData.tokenAmountInFund);
                runningValueTotal += priceData.tokenValueInFund;
            } else {
                priceData.tokenValueInFund = 0;
            }
            // Get minimum token output including the 1.5% fee and the 2% additional total allowable price impact
            uint256 minTokenOutput = _getMinTokenOutputBuy(availableMsgValue, priceData.convertedPrice);
            // Actual expected amount out if the swap was performed 
            try this.getUniswapQuote(WETH_ADDRESS, activeTokens[i], 3000, availableMsgValue, 0) 
                returns (uint256 expectedOutput) 
            {
                // Only choose tokens that fall below the 2% maximum swap price impact
                if (expectedOutput >= minTokenOutput) {
                    // Fills up the index from the top down
                    if (minValuedTokenInfo.tokenAddress != address(0) && 
                        priceData.tokenValueInFund < minValuedTokenInfo.tokenValue) 
                    {
                        // Save the tokenAddress and minTokenOutput for the swap operation in buy()
                        minValuedTokenInfo.tokenAddress = activeTokens[i];
                        minValuedTokenInfo.minTokenOutput = minTokenOutput; 
                        // Stored for _mintUserContribution()
                        minValuedTokenInfo.tokenPrice = priceData.convertedPrice;
                        minValuedTokenInfo.tokenAmount = priceData.tokenAmountInFund;
                        // Only stored for comparisons to other tokens within this function
                        minValuedTokenInfo.tokenValue = priceData.tokenValueInFund;
                    // The first token to pass all the checks is set as the default minValuedToken to start, as it's
                    // being compared to other tokens in the operation above that may already have a value > 0 which is
                    // what minValuedTokenInfo.tokenValue has a default value of
                    } else if (minValuedTokenInfo.tokenAddress == address(0)) {
                        minValuedTokenInfo.tokenAddress = activeTokens[i];
                        minValuedTokenInfo.minTokenOutput = minTokenOutput; 
                        minValuedTokenInfo.tokenPrice = priceData.convertedPrice;
                        minValuedTokenInfo.tokenAmount = priceData.tokenAmountInFund;
                        minValuedTokenInfo.tokenValue = priceData.tokenValueInFund;
                    }
                }
            // If it reverts unintentionally getting the quote move to the next token
            } catch {
                continue;
            }
        }
    }
    
    /**
     * @dev This function Returns the minTokenOutput expected accounting for the 1.5% fee and the a 2% price impact
     * from the TIFDAO buy() swap.
     */
    function _getMinTokenOutputBuy(uint256 availableMsgValue, uint256 tokenPrice)
        internal 
        pure 
        returns (uint256) 
    {
        // Minimum token output accounting for fee only
        uint256 minTokenOutputBeforeImpact = _divide(availableMsgValue, tokenPrice);
        // Accounts for the 2% price impact
        return ((980 * minTokenOutputBeforeImpact) / 1000);
    }

    /**
     * @dev This function is set to external so it can be called by the front-end interface in a static call.
     * runningValueTotal does not include address(this).balance. To see comments look in getMinValuedToken(). 
     */
    function getMaxValuedToken(address[] memory activeTokens, uint256[] memory tokenPrices, uint256 numOfActiveTokens)
        external 
        returns (MaxValuedToken memory maxValuedTokenInfo, uint256 runningValueTotal) 
    {
        PriceData memory priceData;
        BalanceScanner.Result[] memory balanceScannerResult;
        balanceScannerResult = BALANCE_SCANNER.tokensBalance(address(this), activeTokens);
        for (uint256 i; i < numOfActiveTokens; i++) {
            delete priceData;
            if (!balanceScannerResult[i].success)
                revert BalanceScanFailed();
            if(_isTokenPaused(activeTokens[i]))
                continue;
            priceData.price = tokenPrices[i];
            if (priceData.price == 0) 
                continue;
            priceData.convertedPrice = uint256(priceData.price);
            priceData.tokenAmountInFund = _bytesToUint256(balanceScannerResult[i].data);
            if (priceData.tokenAmountInFund != 0) {
                priceData.tokenValueInFund = _multiply(priceData.convertedPrice, priceData.tokenAmountInFund);
                runningValueTotal += priceData.tokenValueInFund;
            } else {
                priceData.tokenValueInFund = 0;
            }
            // Don't need to set the default max as the first token as there will always be a token in the index
            // with a value if I don't sell the exchange ratio TIFDAO
            if (priceData.tokenValueInFund > maxValuedTokenInfo.tokenValue) {
                // Save these values for calculations in burnUserContribution()
                maxValuedTokenInfo.tokenAddress = activeTokens[i];
                maxValuedTokenInfo.tokenPrice = priceData.convertedPrice;
                maxValuedTokenInfo.tokenAmount = priceData.tokenAmountInFund;
                // Only stored for comparisons to other tokens within this function
                maxValuedTokenInfo.tokenValue = priceData.tokenValueInFund;
            }
        }
    }
    
    /**
     * @dev This function adds a single token to _index through successful governance proposal execution. If the token
     * is already in the index but set to false then it will be set to true, if it is already in the index and set to
     * true an error will occur, and if the token has not been in the index before then it will be added to _index.
     */
    function addTokenToIndex(address tokenToAdd) external onlyRole(GOVERNANCE_ROLE) {
        uint256 totalTokensInIndex = _totalTokensInIndex;
        // Check if the token limit of 100 tokens is reached
        if (totalTokensInIndex >= MAX_TOKENS_IN_INDEX)
            revert MaximumTokenQuantity();
        // Need to go through every _index key to see if it's the token to add, to ensure it's not already there to
        // avoid adding a duplicate value in _index. Can't use numOfActiveTokens as it would skip checks if it's less
        // than the totalTokensInIndex and all values need to be checked
        for (uint256 i; i < totalTokensInIndex; i++) {
            // Check if the tokenToAdd has been in the index before
            if (_index[i].tokenAddress == tokenToAdd) {
                // Only set the value to true if it's currently set to false
                if (!_index[i].tokenActive) {
                    _index[i].tokenActive = true;
                    // Front-end can watch for this event 
                    emit TokenAdded(tokenToAdd);
                    // Break otherwise it runs the code below still
                    break;
                } else {
                    revert TokenAlreadyAdded();
                }
            }
            // This code runs after the whole _index is checked, and adds to _index using the current
            // _totalTokensInIndex value as the index value. For example if there are 20 tokens that means slots 0
            // through 19 are filled and this will add the new token to slot 20 before updating the value of
            // _totalTokensInIndex
            if (i == totalTokensInIndex - 1) {
                // Get the token symbol
                try IERC20Metadata(tokenToAdd).symbol() returns (string memory tokenSymbol) {
                    // Convert from string to bytes32 value
                    bytes32 convertedTokenSymbol = _stringToBytes32(tokenSymbol);
                    _index[totalTokensInIndex] = IndexData(tokenToAdd, convertedTokenSymbol, true, false);
                    // Update the number of tokens internally. Can be unchecked as _totalTokensInIndex can never be more
                    // than MAX_TOKENS_IN_INDEX (100) from the check above, meaning it's safe from overflow and gas
                    // efficient
                    unchecked {
                        _totalTokensInIndex++;
                    }
                    emit TokenAdded(tokenToAdd);
                } catch {
                    revert InvalidTokenSymbol();
                }
            }
        }
    }
    
    /**
     * @dev This function sets tokenActive and tokenRemoved to false for a token within _index.
     * 
     */
    function _setTokenToFalse(address tokenToRemove) internal {
        uint256 totalTokensInIndex = _totalTokensInIndex;
        // Loop through every index to see if it's the token to remove
        for (uint256 i; i < totalTokensInIndex; i++) {
            if (_index[i].tokenAddress == tokenToRemove) {
                // Only set the token to false if it's currently set to true
                if (_index[i].tokenActive) {
                    _index[i].tokenActive = false;
                    _index[i].tokenRemoved = false;
                    // Front-end can watch for this event
                    emit TokenRemoved(tokenToRemove);
                } else {
                    revert TokenAlreadyInactive();
                }
            }
        }
    }
    
    /**
     * @dev This function removes a single token from the TIFDAO Index through successful governance proposal
     * execution. This function can only be called once a week to prevent mass removal of tokens.
     */
    function removeTokenFromIndex(address tokenToRemove) external onlyRole(GOVERNANCE_ROLE) {
        uint256 currentBlock = block.number;
        if (currentBlock < _blockLastCalled + ONE_WEEK_IN_BLOCKS)
            revert RemovalLimitReached();
        else
            _blockLastCalled = currentBlock;
        
        if (_totalTokensInIndex <= MIN_TOKENS_IN_INDEX)
            revert MinimumTokenQuantity();
        
        _setTokenRemoved(tokenToRemove);
            
        // Get the balance of the tokenToRemove held by this contract. If it's 0 then remove it now
        ERC20 tokenInstance = ERC20(tokenToRemove);
        uint256 tokenAmount = tokenInstance.balanceOf(address(this));
        if (tokenAmount == 0) 
            _setTokenToFalse(tokenToRemove);
    }
    
    /**
     * @dev This function sets the tokenRemoved value to true, and if it's already true then reverts. 
     */
    function _setTokenRemoved(address tokenToRemove) internal {
        uint256 totalTokensInIndex = _totalTokensInIndex;
        // Loop through every key to see if it's the token to remove
        for (uint256 i; i < totalTokensInIndex; i++) {
            if (_index[i].tokenAddress == tokenToRemove) {
                if (!_index[i].tokenRemoved)
                    _index[i].tokenRemoved = true;
                else
                    revert TokenAlreadyRemoved();
            }
        }
    }
    
    /**
     * @dev This function sells a percentage of removedToken after checking it's removed. Called after
     * removeTokenFromIndex() if the removed token has a balance in the TIFDAO Fund. Once all tokens are removed then
     * it sets the token to inactive and not removed. Percentage is between 1 and 100 from the front-end.
     */
    function sellRemovedToken(
        bytes memory signature, 
        uint256 timestamp, 
        address removedToken, 
        uint256 percentOfTokenToSell, 
        uint256 priceOfTokenInEth
    ) 
    external 
    payable
    onlyValidSignatureSellRemoved(
        signature,
        timestamp, 
        msg.sender,
        removedToken,
        percentOfTokenToSell,
        priceOfTokenInEth
    )
    {
        // Check if token has been removed
        if (_getTokenRemoved(removedToken)) { 
            // Get the balance of the tokenToRemove held by this contract
            ERC20 tokenInstance = ERC20(removedToken);
            uint256 tokenAmount = tokenInstance.balanceOf(address(this));
            uint256 tokenAmountToSell = ((tokenAmount * percentOfTokenToSell) / 100);
            uint256 minTokenOutput = _getMinTokenOutputRemoved(tokenAmountToSell, priceOfTokenInEth);
            _removedTokenToEthFromRemovedToken(removedToken, tokenAmountToSell, minTokenOutput);
            // If all tokens are sold then set the token to false
            tokenAmount = tokenInstance.balanceOf(address(this));
            if (tokenAmount == 0)
                _setTokenToFalse(removedToken);
        }
    }

    /**
     * @dev This function checks if removedToken equals true
     */
    function _getTokenRemoved(address removedToken) internal view returns (bool) {
        uint256 totalTokensInIndex = _totalTokensInIndex;
        // Loop through every index to see if it's the token to remove
        for (uint256 i; i < totalTokensInIndex; i++) {
            if (_index[i].tokenAddress == removedToken) {
                // Only set the token to false if it's currently set to true
                if (_index[i].tokenRemoved)
                    return true;
                else
                    revert TokenNotRemoved();
            }
        }
        // If token not in the index
        return false;
    }
    
    /**
     * @dev This function calculates the minTokenOutput for the swap in sellRemovedToken().
     */
    function _getMinTokenOutputRemoved(uint256 tokenAmountToSell, uint256 priceOfTokenInEth)
        internal
        pure
        returns (uint256)
    {
        // Get value in Ether as the token is WETH in this case
        uint256 minTokenOutputBeforeImpact = _multiply(tokenAmountToSell, priceOfTokenInEth);
        // Accounts for the 2% price impact
        return ((980 * minTokenOutputBeforeImpact) / 1000);
    }
    
    /** 
     * @dev This function uses input data from a static call so minValuedTokenInfo isn't calculated on-chain. Can be
     * called by any user through the front-end if there is an Ether balance. 
     */ 
    function reinvestFundEther(
        bytes memory signature,
        uint256 timestamp,
        uint256 percentOfBalance, 
        MinValuedToken memory minValuedTokenInfo
    ) 
    external 
    onlyValidSignatureReinvest(
        signature,
        timestamp,
        msg.sender, 
        percentOfBalance, 
        minValuedTokenInfo.tokenAddress,  
        minValuedTokenInfo.minTokenOutput,
        minValuedTokenInfo.tokenPrice,
        minValuedTokenInfo.tokenAmount,
        minValuedTokenInfo.tokenValue
    ) 
    {
        if (address(this).balance > 0)
            _ethToMinTokenFromThisBalance(percentOfBalance, minValuedTokenInfo);
        else
            revert NoContractBalance();
    }
}
