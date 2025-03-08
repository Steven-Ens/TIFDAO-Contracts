// Order of Contract Deployment:
// Deploy Token.sol
// Deploy Main.sol and pass the Token.sol contract address to the constructor 
// Deploy Governance.sol passing the Token.sol and Main.sol contract addresses to the constructor
// Grant Main.sol MINTER_ROLE of Token.sol
// Grant Governance.sol GOVERNANCE_ROLE of Main.sol 
// Grant Deployer GOVERNANCE_ROLE of Main.sol (for testing purposes only)
// Revoke role DEFAULT_ADMIN_ROLE from the deployer address so only Deployer, Main.sol and Governance.sol maintain
// their set roles and there are no ways to assign new roles

// Explicitly show the ethers import
const { ethers } = require("hardhat");
// Manages the nonce for a signer by automatically increasing it as transactions are sent 
const { NonceManager } = require("@ethersproject/experimental");

async function deploy() {
    // Contracts 
    let main;
    let token;
    let governance;
    // deployer 
    let deployer;
    let deployerToken;
    let deployerMain;
    let deployerGovernance;
    // userOne 
    let userOne;
    let userOneToken;
    let userOneMain;
    let userOneGovernance;
    // userTwo 
    let userTwo;
    let userTwoToken;
    let userTwoMain;
    let userTwoGovernance;
    // userThree
    let userThree;
    let userThreeToken;
    let userThreeMain;
    let userThreeGovernance;

    // The provider used is Alchemy 
    [deployer, userOne, userTwo, userThree] = await ethers.getSigners();
    // Log the address of the deployer 
    console.log("deployer account address:", deployer.address);
    console.log("userOne account address:", userOne.address);
    console.log("userTwo account address:", userTwo.address);
    console.log("userThree account address:", userThree.address);

    // Log the initial balance of the the deployer account and convert it to ETH
    initialBalance = ethers.utils.formatEther(await deployer.getBalance()).toString();
    console.log("deployer initial ETH balance:", initialBalance);
    
    // Get the current gas price in Gwei
    gasPrice = ethers.utils.formatUnits(await deployer.getGasPrice(), "gwei").toString();
    console.log("Current gas price:", gasPrice, "GWEI");

    // Token.sol
    console.log("Deploying Token.sol:");
    // A ContractFactory in ethers.js is an abstraction used to deploy new smart contracts, so Token here represents a
    // factory for instances of the Token.sol contract. getContractFactory() is a hardhat-ethers helper function
    const Token = await ethers.getContractFactory("Token");
    // Calling deploy() on a ContractFactory does NOT deploy the contract yet
    token = await Token.deploy();
    // deployTransaction is used to deploy the contract, and .wait() waits until the transaction is mined before returning
    // the receipt (default is to wait for 1 block)
    await token.deployTransaction.wait();
    console.log("Token.sol contract address:", token.address);

    // Main.sol
    console.log("Deploying Main.sol:");
    const Main = await ethers.getContractFactory("Main");
    // Pass the address of Token.sol to the constructor
    main = await Main.deploy(token.address);
    await main.deployTransaction.wait();
    console.log("Main.sol contract address:", main.address);

    // Governance.sol
    console.log("Deploying Governance.sol:");
    const Governance = await ethers.getContractFactory("Governance");
    // Pass the address of Token.sol and Main.sol to the constructor
    governance = await Governance.deploy(token.address, main.address);
    await governance.deployTransaction.wait();
    console.log("Governance.sol contract address:", governance.address);

    // NonceManager manages the nonce for the signers, automatically increasing it with sent transactions
    const deployerNonce = new NonceManager(deployer);
    const userOneNonce = new NonceManager(userOne);
    const userTwoNonce = new NonceManager(userTwo);
    const userThreeNonce = new NonceManager(userThree);

    // Return an instance of Token.sol attached to its live contract address and specific users
    deployerToken = new ethers.Contract(token.address, token.interface, deployerNonce);
    userOneToken = new ethers.Contract(token.address, token.interface, userOneNonce);
    userTwoToken = new ethers.Contract(token.address, token.interface, userTwoNonce);
    userThreeToken = new ethers.Contract(token.address, token.interface, userThreeNonce);

    // Return an instance of Main.sol attached to its live contract address and specific users
    deployerMain = new ethers.Contract(main.address, main.interface, deployerNonce);
    userOneMain = new ethers.Contract(main.address, main.interface, userOneNonce);
    userTwoMain = new ethers.Contract(main.address, main.interface, userTwoNonce);
    userThreeMain = new ethers.Contract(main.address, main.interface, userThreeNonce);
    
    // Return an instance of Governance.sol attached to its live contract address and specific users
    deployerGovernance = new ethers.Contract(governance.address, governance.interface, deployerNonce);
    userOneGovernance = new ethers.Contract(governance.address, governance.interface, userOneNonce);
    userTwoGovernance = new ethers.Contract(governance.address, governance.interface, userTwoNonce);
    userThreeGovernance = new ethers.Contract(governance.address, governance.interface, userThreeNonce);
    
    // Grant MINTER_ROLE of Token.sol to Main.sol
    console.log("Granting MINTER_ROLE of Token.sol to Main.sol:");
    // Returns the Keccak-256 hash with the prefix 0x
    // Expected result: 0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6 
    const minterRoleHash = ethers.utils.id("MINTER_ROLE");
    // Grant the role
    await deployerToken.grantRole(minterRoleHash, main.address);

    // Grant GOVERNANCE_ROLE of Main.sol to Governance.sol and the deployer
    console.log("Granting GOVERNANCE_ROLE of Main.sol to Governance.sol and deployer:");
    // Returns the Keccak-256 hash with the prefix 0x
    // Expected result: 0x7935bd0ae54bc31f548c14dba4d37c5c64b3f8ca900cb468fb8abd54d5894f55
    const governanceRoleHash = ethers.utils.id("GOVERNANCE_ROLE");
    // Grant the role
    await deployerMain.grantRole(governanceRoleHash, governance.address);
    await deployerMain.grantRole(governanceRoleHash, deployer.address); 

    // Revoke roles
    const defaultAdminRole = "0x0000000000000000000000000000000000000000000000000000000000000000"
    // Remove DEFAULT_ADMIN_ROLE of deployer from Token.sol and Main.sol so no new roles can be assigned 
    await deployerToken.revokeRole(defaultAdminRole, deployer.address); 
    await deployerMain.revokeRole(defaultAdminRole, deployer.address); 
    console.log("Deployer DEFAULT_ADMIN_ROLE revoked from Token.sol and Main.sol...");
   
    finalBalance = ethers.utils.formatEther(await deployer.getBalance()).toString();
    console.log("Deployer final ETH balance:", finalBalance);

    // Assign the variables to the object after completion
    const deployment = { 
        // Contracts     
        main: main,
        token: token,
        governance: governance,
        // deployer 
        deployer: deployer,
        deployerToken: deployerToken,
        deployerMain: deployerMain,
        deployerGovernance: deployerGovernance,
        // userOne 
        userOne: userOne, 
        userOneToken: userOneToken,
        userOneMain: userOneMain,
        userOneGovernance: userOneGovernance,
        // userTwo 
        userTwo: userTwo,
        userTwoToken: userTwoToken,
        userTwoMain: userTwoMain,
        userTwoGovernance: userTwoGovernance,
        // userThree
        userThree: userThree,
        userThreeToken: userThreeToken,
        userThreeMain: userThreeMain,
        userThreeGovernance: userThreeGovernance
    };
    return deployment;
};
module.exports = { deploy };
