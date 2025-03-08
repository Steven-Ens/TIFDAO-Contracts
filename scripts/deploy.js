// Order of Contract Deployment:
// Deploy Token.sol
// Deploy Main.sol and pass the Token.sol contract address to the constructor 
// Deploy Governance.sol passing the Token.sol and Main.sol contract addresses to the constructor
// Call setMainAddress() in Token.sol with the Main.sol contract address
// Grant Main.sol MINTER_ROLE of Token.sol
// Grant Governance.sol GOVERNANCE_ROLE of Main.sol 
// Grant Deployer GOVERNANCE_ROLE of Main.sol
// Revoke role DEFAULT_ADMIN_ROLE from the deployer address so only Deployer, Main.sol and Governance.sol maintain
// their set roles and there are no ways to assign new roles

// Explicitly show the ethers import
const { ethers } = require("hardhat");
// Manages the nonce for a signer by automatically increasing it as it sends transactions
const { NonceManager } = require("@ethersproject/experimental");

async function main() {
    // A signer in ethers.js is an object that has access to a private key, in order to sign
    // transactions. Here we get the list of accounts in the network we're connected to, only keeping
    // the first one
    const [deployer] = await ethers.getSigners();
    // Log the address of the deployer 
    console.log("Deployer account address:", deployer.address);

    // Log the initial balance of the the deployer account and convert it to ETH
    initialBalance = ethers.utils.formatEther(await deployer.getBalance()).toString();
    console.log("Deployer account balance:", initialBalance, "ETH");

    // Display current block number
    blockNumber = await ethers.provider.getBlockNumber();
    console.log("Current block number:", blockNumber);
    
    // Get the current gas price and convert it from wei go gwei
    gasPrice = ethers.utils.formatUnits(await deployer.getGasPrice(), "gwei").toString();
    console.log("Current gas price:", gasPrice, "GWEI");

    // Token.sol
    console.log("Deploying Token.sol...");
    // A ContractFactory in ethers.js is an abstraction used to deploy new smart contracts, so
    // Token here represents a factory for instances of the Token.sol contract
    const Token = await ethers.getContractFactory("Token");
    // Calling deploy() on a ContractFactory will start a deployment, and return a Promise that
    // resolves to a contract
    const token = await Token.deploy();
    // This is the transaction used to deploy the contract, and .wait() resolves the
    // TransactionReceipt once the transaction has been included in the chain for a default of 1
    // block
    await token.deployTransaction.wait();
    console.log("Token.sol contract address:", token.address);

    gasPrice = ethers.utils.formatUnits(await deployer.getGasPrice(), "gwei").toString();
    console.log("Current gas price:", gasPrice, "GWEI");

    // Main.sol
    console.log("Deploying Main.sol...");
    const Main = await ethers.getContractFactory("Main");
    // Pass the address of Token.sol to the constructor of Main.sol
    const main = await Main.deploy(token.address);
    await main.deployTransaction.wait();
    console.log("Main.sol contract address:", main.address);
    
    gasPrice = ethers.utils.formatUnits(await deployer.getGasPrice(), "gwei").toString();
    console.log("Current gas price:", gasPrice, "GWEI");

    // Governance.sol
    console.log("Deploying Governance.sol...");
    const Governance = await ethers.getContractFactory("Governance");
    // Pass the address of Token.sol to the constructor of Governance.sol
    const governance = await Governance.deploy(token.address, main.address);
    await governance.deployTransaction.wait();
    console.log("Governance.sol contract address:", governance.address);
    
    gasPrice = ethers.utils.formatUnits(await deployer.getGasPrice(), "gwei").toString();
    console.log("Current gas price:", gasPrice, "GWEI");

    // NonceManager doesn't handle re-broadcast, so sending a lot of transactions to the network on
    // a node that doesn't control that account means the transaction pool may drop your
    // transactions
    const deployerNonce = new NonceManager(deployer);

    // Grant MINTER_ROLE of Token.sol to Main.sol
    console.log("Granting MINTER_ROLE of Token.sol to Main.sol...");
    // Return an instance of Token.sol attached to its live contract address
    const deployedTokenContract = new ethers.Contract(token.address, token.interface, deployerNonce);
    // Returns the Keccak-256 hash with the prefix 0x
    // Expected result: 0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6 
    minterRoleHash = ethers.utils.id("MINTER_ROLE");
    // Grant the role
    await deployedTokenContract.grantRole(minterRoleHash, main.address);

    // Grant GOVERNOR_ROLE of Main.sol to Voting.sol
    console.log("Granting GOVERNOR_ROLE of Main.sol to Governance.sol...");
    // Return an instance of Main.sol attached to its live contract address 
    const deployedMainContract = new ethers.Contract(main.address, main.interface, deployerNonce);
    // Expected result: 0x7935bd0ae54bc31f548c14dba4d37c5c64b3f8ca900cb468fb8abd54d5894f55
    governorRoleHash = ethers.utils.id("GOVERNANCE_ROLE");
    // Grant the role
    await deployedMainContract.grantRole(governorRoleHash, governance.address);

    // Add abillity to cancel in voting.sol

    const defaultAdminRole = "0x0000000000000000000000000000000000000000000000000000000000000000"
    // Remove DEFAULT_ADMIN_ROLE of deployer from Token.sol so no new roles can be assigned from Token.sol
    await deployedTokenContract.revokeRole(defaultAdminRole, deployer.address); 
    // Remove DEFAULT_ADMIN_ROLE of deployer from Main.sol so no new roles can be assigned from Main.sol
    await deployedMainContract.revokeRole(defaultAdminRole, deployer.address); 
    
    finalBalance = ethers.utils.formatEther((await deployer.getBalance())).toString();
    console.log("Deployer account balance:", finalBalance, "ETH");

    // Not accurate if ETH added to the deployer account during the deployment
    costToDeploy = initialBalance - finalBalance;
    console.log("Final deployment cost:", costToDeploy, "ETH");
}

// Run the async function while accounting for errors
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
});

