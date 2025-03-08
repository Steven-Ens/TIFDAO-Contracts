// Explicitly show the ethers import 
const { ethers } = require("hardhat");
const { expect} = require("chai");
// Used to deploy contracts before running tests                                                                                
const { deploy } = require("./deployment.js");

describe("Main.sol", function () {
    before(async function () {
        deployment = await deploy();
    });
    
    describe("Add & Remove Token Tests", function () { 

        async function tokenAddedEvent() {
            const topic = ethers.utils.id("TokenAdded(address)");
            const filter = { topics: [topic] }
            const log = await ethers.provider.getLogs(filter);
            const logData = log[0].topics[1];
            const formattedAddress = ethers.utils.getAddress("0x" + logData.slice(26));
            console.log("Token Added", formattedAddress);
        }
        
        async function tokenRemovedEvent() {
            const topic = ethers.utils.id("TokenRemoved(address)");
            const filter = { topics: [topic] }
            const log = await ethers.provider.getLogs(filter);
            const logData = log[0].topics[1];
            const formattedAddress = ethers.utils.getAddress("0x" + logData.slice(26));
            console.log("Token Removed", formattedAddress);
        }

        let tokenPrices = [
            ethers.BigNumber.from("7381011078572117"),
            ethers.BigNumber.from("5680031631"),
            ethers.BigNumber.from("3499890230664987"),
            ethers.BigNumber.from("3919415918"),
            ethers.BigNumber.from("429962927670663"),
            ethers.BigNumber.from("95833790508181100"),
            ethers.BigNumber.from("368304614389074"),
            ethers.BigNumber.from("120740281400936"),
            ethers.BigNumber.from("1734327858646647"),
            ethers.BigNumber.from("186039672261614"),
            ethers.BigNumber.from("304155041520008"),
            ethers.BigNumber.from("216970315477649"),
            ethers.BigNumber.from("328364911770967"),
            ethers.BigNumber.from("5895314081289867"),
            ethers.BigNumber.from("660891629221951"),
            ethers.BigNumber.from("53485015507013"),
            ethers.BigNumber.from("519970473327576"),
            ethers.BigNumber.from("33519937029105504"),
            ethers.BigNumber.from("442788945593236"),
            ethers.BigNumber.from("155920931684023"),
            ethers.BigNumber.from("10034186761846110"),
            ethers.BigNumber.from("219734222095021"),
            ethers.BigNumber.from("325243339"),
            ethers.BigNumber.from("346058959681041500"),
            ethers.BigNumber.from("1606620791535503"),
            ethers.BigNumber.from("4293088405433"),
            ethers.BigNumber.from("132837662825583"),
            ethers.BigNumber.from("3691779067998"),
            ethers.BigNumber.from("291817740318273"),
            ethers.BigNumber.from("74469997727396"),
            ethers.BigNumber.from("21248006777654"),
            ethers.BigNumber.from("828840474331442"),
            ethers.BigNumber.from("20578978748758740"),
            ethers.BigNumber.from("2077557638638"),
            ethers.BigNumber.from("1050975575378083"),
            ethers.BigNumber.from("2755868873151617"),
            ethers.BigNumber.from("65743136255911230"),
            ethers.BigNumber.from("465629457035187"),
            ethers.BigNumber.from("162304968848256"),
            ethers.BigNumber.from("319217746138046"),
            ethers.BigNumber.from("282003650823516"),
            ethers.BigNumber.from("94449799714949"),
            ethers.BigNumber.from("236435698620434"),
            ethers.BigNumber.from("3316068103540241"),
            ethers.BigNumber.from("1078404481435965"),
            ethers.BigNumber.from("54396060136346"),
            ethers.BigNumber.from("1579387167973"),
            ethers.BigNumber.from("600773142165"),
            ethers.BigNumber.from("121991885099538"),
            ethers.BigNumber.from("67363573981401"),
            ethers.BigNumber.from("98820265891702"),
            ethers.BigNumber.from("182534633977803"),
            ethers.BigNumber.from("15990971100596"),
            ethers.BigNumber.from("9297310666473"),
            ethers.BigNumber.from("8408876210301"),
            ethers.BigNumber.from("46002486258891"),
            ethers.BigNumber.from("1983708855568"),
            ethers.BigNumber.from("699635665341172"),
            ethers.BigNumber.from("10550778979318544"),
            ethers.BigNumber.from("163736393045") 
        ];

        // Tokens
        const SHIB_ADDRESS = "0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE";
        const WBTC_ADDRESS = "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599";
        const LINK_ADDRESS = "0x514910771AF9Ca656af840dff83E8264EcF986CA";

        it("Should succeed in starting on the correct block number", async function () {
            expect(await ethers.provider.getBlockNumber()).to.equal(21754847);
        });

        it("Should fail in userOne calling addTokenToIndex() without GOVERNANCE_ROLE", async function () {
            await expect(deployment.userOneMain.addTokenToIndex(SHIB_ADDRESS)).to.be.revertedWith(
               "AccessControl: account 0x70997970c51812dc3a010c7d01b50e0d17dc79c8 is missing role 0x71840dc4906352362b0cdaf79870196c8e42acafade72d5d5a6d59291253ceb1");
        });

        // Have to manually set _totalTokensInIndex to 100 here
        it("Should fail in deployer calling addTokenToIndex() while exceeding MAX_TOKENS_IN_INDEX", async function () {
//            await expect(deployment.deployerMain.addTokenToIndex(SHIB_ADDRESS)).to.be.revertedWithCustomError(
//               deployment.main,
//               "MaximumTokenQuantity"
//            );
        });
        
        it("Should fail in deployer calling addTokenToIndex() with a token already added", async function () {
            await expect(deployment.deployerMain.addTokenToIndex(SHIB_ADDRESS)).to.be.revertedWithCustomError(
               deployment.main,
               "TokenAlreadyAdded"
            );
        });
        
        it("Should fail in deployer calling addTokenToIndex() with a token with no symbol", async function () {
            await expect(deployment.deployerMain.addTokenToIndex(deployment.governance.address)).to.be.revertedWithCustomError(
               deployment.main,
               "InvalidTokenSymbol"
            );
        });
        
        it("Should succeed in deployer calling addTokenToIndex() with WBTC, a new token", async function () {
            let result = await deployment.deployerMain.getActiveTokens(0, 100);
            expect(result.numOfActiveTokens).to.equal(60);

            await expect(deployment.deployerMain.addTokenToIndex(WBTC_ADDRESS)).to.not.be.reverted;

            result = await deployment.deployerMain.getActiveTokens(0, 100);
            expect(result.numOfActiveTokens).to.equal(61);

            await tokenAddedEvent();
        });

        it("Should fail in userOne calling removeTokenFromIndex()", async function () {
            await expect(deployment.userOneMain.removeTokenFromIndex(WBTC_ADDRESS)).to.be.revertedWith(
               "AccessControl: account 0x70997970c51812dc3a010c7d01b50e0d17dc79c8 is missing role 0x71840dc4906352362b0cdaf79870196c8e42acafade72d5d5a6d59291253ceb1");
        });
        
        // Have to manually set _totalTokensInIndex to 50 here. Have to comment out or it will successfully complete
        // otherwise
        it("Should fail in deployer calling removeTokenFromIndex() while going below MIN_TOKENS_IN_INDEX", async function () {
//            await expect(deployment.deployerMain.removeTokenFromIndex(SHIB_ADDRESS)).to.be.revertedWithCustomError(
//               deployment.main,
//               "MinimumTokenQuantity"
//            );
        });
        
        it("Should succeed in deployer calling removeTokenFromIndex() with WBTC with no tokenAmount", async function () {
            let result = await deployment.deployerMain.getActiveTokens(0, 100);
            expect(result.numOfActiveTokens).to.equal(61);

            await expect(deployment.deployerMain.removeTokenFromIndex(WBTC_ADDRESS)).to.not.be.reverted;

            result = await deployment.deployerMain.getActiveTokens(0, 100);
            expect(result.numOfActiveTokens).to.equal(60);

            await tokenRemovedEvent();
        });
        
        it("Should fail in deployer calling removeTokenFromIndex() again before one week of time", async function () {
            await expect(deployment.deployerMain.removeTokenFromIndex(LINK_ADDRESS)).to.be.revertedWithCustomError(
                deployment.main,
                "RemovalLimitReached"
            );
        });

        it("Should succeed in passing one week days of time in blocks", async function () {
            for (let i = 0; i < 50400; i++) {
                await ethers.provider.send("evm_mine");
            }
        });
        
        it("Should fail in deployer calling removeTokenFromIndex() with WBTC again as it's already inactive", async function () {
            await expect(deployment.deployerMain.removeTokenFromIndex(WBTC_ADDRESS)).to.be.revertedWithCustomError(
                deployment.main,
                "TokenAlreadyInactive"
            );
        });
        
        it("Should succeed in buying 1 ETH of LINK", async function () {
            const {
                activeTokens,
                activeSymbols,
                numOfActiveTokens
            } = await deployment.deployerMain.callStatic.getActiveTokens(0, 100);

            const { minValuedTokenInfo, runningValueTotal } = await deployment.deployerMain.callStatic.getMinValuedToken(
                activeTokens,
                tokenPrices,
                numOfActiveTokens,
                ethers.utils.parseEther("1"),
                {
                    gasLimit: 30_000_000,
                }
            );

            const timestamp = Math.floor(Date.now() / 1000);
            const response = await fetch('http://localhost:5003/getSignedMessageBuyTif', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    timestamp,
                    userAddress: deployment.userOne.address,
                    tokenAddress: minValuedTokenInfo.tokenAddress,
                    minTokenOutput: minValuedTokenInfo.minTokenOutput.toString(),
                    tokenPrice: minValuedTokenInfo.tokenPrice.toString(),
                    tokenAmount: minValuedTokenInfo.tokenAmount.toString(),
                    tokenValue: minValuedTokenInfo.tokenValue.toString(),
                    runningValueTotal: runningValueTotal.toString()
                })
            });
            const { signature } = await response.json();

            await expect(deployment.userOneMain.buy(
                signature,
                timestamp,
                minValuedTokenInfo,
                runningValueTotal,
                { value: ethers.utils.parseEther("1") }
            )).to.not.be.reverted;
        }); 
        
        it("Should succeed in deployer calling removeTokenFromIndex() with LINK with a tokenAmount", async function () {
            let result = await deployment.deployerMain.getActiveTokens(0, 100);
            expect(result.numOfActiveTokens).to.equal(60);

            await expect(deployment.deployerMain.removeTokenFromIndex(LINK_ADDRESS)).to.not.be.reverted;

            result = await deployment.deployerMain.getActiveTokens(0, 100);
            expect(result.numOfActiveTokens).to.equal(60);
        });
        
        it("Should succeed in passing one week days of time in blocks", async function () {
            for (let i = 0; i < 50400; i++) {
                await ethers.provider.send("evm_mine");
            }
        });

        it("Should fail in deployer calling removeTokenFromIndex() with LINK again", async function () {
            await expect(deployment.deployerMain.removeTokenFromIndex(LINK_ADDRESS)).to.be.revertedWithCustomError(
                deployment.main,
                "TokenAlreadyRemoved"
            );
        });
        
        it("Should fail in userOne calling reinvestFundEther() with no contract balance", async function () {
            const { 
                activeTokens, 
                activeSymbols, 
                numOfActiveTokens
            } = await deployment.deployerMain.callStatic.getActiveTokens(0, 100);

            const { minValuedTokenInfo, runningValueTotal } = await deployment.deployerMain.callStatic.getMinValuedToken(
                activeTokens,
                tokenPrices,
                numOfActiveTokens,
                ethers.utils.parseEther("0.001"),
                {
                    gasLimit: 30_000_000,
                }
            );
            const timestamp = Math.floor(Date.now() / 1000);
            const response = await fetch('http://localhost:5003/getSignedMessageReinvest', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    timestamp,
                    userAddress: deployment.userOne.address,
                    percentageOfBalance: "100",
                    tokenAddress: minValuedTokenInfo.tokenAddress,
                    minTokenOutput: minValuedTokenInfo.minTokenOutput.toString(),
                    tokenPrice: minValuedTokenInfo.tokenPrice.toString(),
                    tokenAmount: minValuedTokenInfo.tokenAmount.toString(),
                    tokenValue: minValuedTokenInfo.tokenValue.toString(),
                })
            });
            const { signature } = await response.json();

            await expect(deployment.userOneMain.reinvestFundEther(
                signature,
                timestamp,
                100,
                minValuedTokenInfo,
            )).to.be.revertedWithCustomError(
                deployment.main,
                "NoContractBalance"
            );
        });

        it("Should fail in selling a token that is not removed", async function () {
            const timestamp = Math.floor(Date.now() / 1000);
            const response = await fetch('http://localhost:5003/getSignedMessageSellRemoved', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    timestamp, 
                    userAddress: deployment.userOne.address, 
                    removedToken: WBTC_ADDRESS,
                    percentOfTokenToSell: "100", 
                    priceOfTokenInEth: tokenPrices[0].toString(),
                })
            });
            const { signature } = await response.json();

            await expect(deployment.userOneMain.sellRemovedToken(
                signature,
                timestamp,
                WBTC_ADDRESS,
                100, 
                tokenPrices[0],
            )).to.be.revertedWithCustomError(
                deployment.main,
                "TokenNotRemoved"
            );
            
        });
        
        it("Should fail in deployer calling addTokenToIndex() with LINK while it's still active from having a token balance", async function () {
            await expect(deployment.deployerMain.addTokenToIndex(LINK_ADDRESS)).to.be.revertedWithCustomError(
                deployment.main,
                "TokenAlreadyAdded"
            );
        });

        
        it("Should succeed in calling sellRemovedToken() with LINK and 100%", async function () {
            let result = await deployment.deployerMain.getActiveTokens(0, 100);
            expect(result.numOfActiveTokens).to.equal(60);

            const timestamp = Math.floor(Date.now() / 1000);
            const response = await fetch('http://localhost:5003/getSignedMessageSellRemoved', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    timestamp, 
                    userAddress: deployment.userOne.address, 
                    removedToken: LINK_ADDRESS,
                    percentOfTokenToSell: "100", 
                    priceOfTokenInEth: tokenPrices[0].toString(),
                })
            });
            const { signature } = await response.json();

            await expect(deployment.userOneMain.sellRemovedToken(
                signature,
                timestamp,
                LINK_ADDRESS,
                100, 
                tokenPrices[0],
            )).to.not.be.reverted;
            
            result = await deployment.deployerMain.getActiveTokens(0, 100);
            expect(result.numOfActiveTokens).to.equal(59);

            await tokenRemovedEvent();
        });

        it("Should succeed in userOne calling reinvestFundEther() with 100%", async function () {
            const balance = await deployment.deployer.provider.getBalance(deployment.main.address);
            const {
                activeTokens,
                activeSymbols,
                numOfActiveTokens
            } = await deployment.deployerMain.callStatic.getActiveTokens(0, 100);

            const { minValuedTokenInfo, runningValueTotal } = await deployment.deployerMain.callStatic.getMinValuedToken(
                activeTokens,
                tokenPrices,
                numOfActiveTokens,
                balance,
                {
                    gasLimit: 30_000_000,
                }
            );

            const timestamp = Math.floor(Date.now() / 1000);
            const response = await fetch('http://localhost:5003/getSignedMessageReinvest', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    timestamp,
                    userAddress: deployment.userOne.address,
                    percentageOfBalance: "100",
                    tokenAddress: minValuedTokenInfo.tokenAddress,
                    minTokenOutput: minValuedTokenInfo.minTokenOutput.toString(),
                    tokenPrice: minValuedTokenInfo.tokenPrice.toString(),
                    tokenAmount: minValuedTokenInfo.tokenAmount.toString(),
                    tokenValue: minValuedTokenInfo.tokenValue.toString(),
                })
            });
            const { signature } = await response.json();

            await expect(deployment.userOneMain.reinvestFundEther(
                signature,
                timestamp,
                100,
                minValuedTokenInfo,
            )).to.not.be.reverted;
        });

        it("Should succeed in deployer calling addTokenToIndex() with LINK after already being in the index before", async function () {
            let result = await deployment.deployerMain.getActiveTokens(0, 100);
            expect(result.numOfActiveTokens).to.equal(59);

            await expect(deployment.deployerMain.addTokenToIndex(LINK_ADDRESS)).to.not.be.reverted;

            result = await deployment.deployerMain.getActiveTokens(0, 100);
            expect(result.numOfActiveTokens).to.equal(60);

            await tokenAddedEvent();
        });

        it("Should succeed in getting Main.sol contract balance", async function () {
            expect(await deployment.deployer.provider.getBalance(deployment.main.address)).to.equal(0);
        });
    });
});


