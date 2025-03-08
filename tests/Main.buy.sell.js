// This test proves the following:
// -Tokens are purchased starting from _index[0] moving up as expected
// -The price of the tokens remains steady throughout the whole test
// -After all tokens have a value in the index the tokens with the least value are purchased first
// -Tokens are sold starting from the most valuable to the lease valuable
// -Selling as many tokens as possible works, as well as selling the exact amount when the maxValuedToken's value is
// high enough
// -Buying and selling with small and large amounts works as expected
// -Tokens with quotes < minTokenOutput are not purchased as expected (18 of them at 0.1 ether)

// Explicitly show the ethers import
const { ethers } = require("hardhat");
const { expect } = require("chai");
// Used to deploy contracts before running tests                             
const { deploy } = require("./deployment.js");

describe("Main.sol", function () {
    before(async function () {
        deployment = await deploy();
    });

    describe("Buy & Sell Token Tests", function () {
        // Calculated at the time of the block the fork in hardhat.config is set to get accurate minimum output and
        // Uniswap quotes
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

        async function minValuedToken(amount) {
            // Fixed number of batches
            const numBatches = 10; 
            // Each batch processes 10 tokens
            const batchSize = 10; 
            let minValuedTokenInfo;
            let runningValueTotal;
            let finalMinValuedTokenInfo = null;
            let finalRunningValueTotal = ethers.BigNumber.from(0);

            for (let i = 0; i < numBatches; i++) {
                const start = i * batchSize;
                const end = start + batchSize;
                //console.log(`Processing Batch ${i + 1} (Tokens ${start} to ${end - 1})`);

                // Get active tokens for the current batch
                const { activeTokens, 
                        activeSymbols, 
                        numOfActiveTokens } = await deployment.deployerMain.callStatic.getActiveTokens(start, end);
                //console.log(`Batch ${i + 1} numOfActiveTokens: ${numOfActiveTokens.toString()}`);
                // Skip if no tokens are active in this batch, use isZero() as it's comparing with a BigNumber value
                if (numOfActiveTokens.isZero())
                    continue;

                // Call to get the prices of the activeTokens
                // tokenPrices = 

                // Call getMinValuedToken() for the current batch
                try {
                    //const result = await deployment.deployerMain.callStatic.getMinValuedToken(
                    ({ minValuedTokenInfo, runningValueTotal } = await deployment.deployerMain.callStatic.getMinValuedToken(
                        activeTokens,
                        //tokenPrices,
                        tokenPrices.slice(start, end),
                        numOfActiveTokens,
                        ethers.utils.parseEther(amount.toString()), 
                        {
                            //value: ethers.utils.parseEther(amount.toString()), 
                            gasLimit: 30_000_000,
                        }
                    ));
                    // Keep track of the sum of the runningValueTotal between batches
                    finalRunningValueTotal = finalRunningValueTotal.add(runningValueTotal);
                } catch (error) {
                    console.log("Error", error); 
                    // If one of the batches fails then runningValueTotal will not be accurate so exit the function
                    return null;
                }
                // If no token passes the checks then continue
                if (minValuedTokenInfo.tokenAddress === ethers.constants.AddressZero)
                    continue;
                // Compare the current batch's smallest token with the overall smallest token
                if (!finalMinValuedTokenInfo || minValuedTokenInfo.tokenValue.lt(finalMinValuedTokenInfo.tokenValue)) {
                    finalMinValuedTokenInfo = minValuedTokenInfo;
                }
            }
            // Rename variables back 
            if (finalMinValuedTokenInfo) {
                minValuedTokenInfo = finalMinValuedTokenInfo;
                runningValueTotal = finalRunningValueTotal;
                console.log(minValuedTokenInfo, runningValueTotal);
                return { minValuedTokenInfo, runningValueTotal };
            }
            // If loop runs but no token is selected for if the transaction size is too large
            return null;
        }

        async function maxValuedToken() {
            const { activeTokens, 
                    activeSymbols,
                    numOfActiveTokens } = await deployment.deployerMain.callStatic.getActiveTokens(0, 100);
            
            // In production the call to get tokenPrices would be here
            
            const result = await deployment.deployerMain.callStatic.getMaxValuedToken(
                activeTokens,
                tokenPrices,
                numOfActiveTokens
            );
            const maxValuedTokenInfo = result.maxValuedTokenInfo;
            const runningValueTotal = result.runningValueTotal;
            
            console.log(maxValuedTokenInfo, runningValueTotal);
            return { maxValuedTokenInfo, runningValueTotal };
        }

        async function signBuyDataDeployer(minValuedTokenInfo, runningValueTotal) {
            const timestamp = Math.floor(Date.now() / 1000);
            const response = await fetch('http://localhost:5003/getSignedMessageBuyTif', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    timestamp,
                    userAddress: deployment.deployer.address,
                    tokenAddress: minValuedTokenInfo.tokenAddress,
                    minTokenOutput: minValuedTokenInfo.minTokenOutput.toString(),
                    tokenPrice: minValuedTokenInfo.tokenPrice.toString(),
                    tokenAmount: minValuedTokenInfo.tokenAmount.toString(),
                    tokenValue: minValuedTokenInfo.tokenValue.toString(),
                    runningValueTotal: runningValueTotal.toString()
                })
            });
            const { signature } = await response.json();
            return { signature, timestamp };
        }
        
        async function signBuyDataUserOne(minValuedTokenInfo, runningValueTotal) {
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
            return { signature, timestamp };
        }
        
        async function signBuyDataUserTwo(minValuedTokenInfo, runningValueTotal) {
            const timestamp = Math.floor(Date.now() / 1000);
            const response = await fetch('http://localhost:5003/getSignedMessageBuyTif', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    timestamp,
                    userAddress: deployment.userTwo.address,
                    tokenAddress: minValuedTokenInfo.tokenAddress,
                    minTokenOutput: minValuedTokenInfo.minTokenOutput.toString(),
                    tokenPrice: minValuedTokenInfo.tokenPrice.toString(),
                    tokenAmount: minValuedTokenInfo.tokenAmount.toString(),
                    tokenValue: minValuedTokenInfo.tokenValue.toString(),
                    runningValueTotal: runningValueTotal.toString()
                })
            });
            const { signature } = await response.json();
            return { signature, timestamp };
        }

        async function signBuyDataUserThree(minValuedTokenInfo, runningValueTotal) {
            const timestamp = Math.floor(Date.now() / 1000);
            const response = await fetch('http://localhost:5003/getSignedMessageBuyTif', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    timestamp,
                    userAddress: deployment.userThree.address,
                    tokenAddress: minValuedTokenInfo.tokenAddress,
                    minTokenOutput: minValuedTokenInfo.minTokenOutput.toString(),
                    tokenPrice: minValuedTokenInfo.tokenPrice.toString(),
                    tokenAmount: minValuedTokenInfo.tokenAmount.toString(),
                    tokenValue: minValuedTokenInfo.tokenValue.toString(),
                    runningValueTotal: runningValueTotal.toString()
                })
            });
            const { signature } = await response.json();
            return { signature, timestamp };
        }

        async function signSellDataDeployer(maxValuedTokenInfo, runningValueTotal, tokens) {
            const timestamp = Math.floor(Date.now() / 1000);
            const response = await fetch('http://localhost:5003/getSignedMessageSellTif', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    timestamp,
                    userAddress: deployment.deployer.address,
                    userTokensToBurn: ethers.utils.parseEther(tokens).toString(),
                    tokenAddress: maxValuedTokenInfo.tokenAddress,
                    tokenPrice: maxValuedTokenInfo.tokenPrice.toString(),
                    tokenAmount: maxValuedTokenInfo.tokenAmount.toString(),
                    tokenValue: maxValuedTokenInfo.tokenValue.toString(),
                    runningValueTotal: runningValueTotal.toString()
                })
            });
            const { signature } = await response.json();
            return { signature, timestamp };
        }

        async function signSellDataUserOne(maxValuedTokenInfo, runningValueTotal, tokens) {
            const timestamp = Math.floor(Date.now() / 1000);
            const response = await fetch('http://localhost:5003/getSignedMessageSellTif', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    timestamp,
                    userAddress: deployment.userOne.address,
                    userTokensToBurn: ethers.utils.parseEther(tokens).toString(),
                    tokenAddress: maxValuedTokenInfo.tokenAddress,
                    tokenPrice: maxValuedTokenInfo.tokenPrice.toString(),
                    tokenAmount: maxValuedTokenInfo.tokenAmount.toString(),
                    tokenValue: maxValuedTokenInfo.tokenValue.toString(),
                    runningValueTotal: runningValueTotal.toString()
                })
            });
            const { signature } = await response.json();
            return { signature, timestamp };
        }

        async function signSellDataUserTwo(maxValuedTokenInfo, runningValueTotal, tokens) {
            const timestamp = Math.floor(Date.now() / 1000);
            const response = await fetch('http://localhost:5003/getSignedMessageSellTif', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    timestamp,
                    userAddress: deployment.userTwo.address,
                    userTokensToBurn: ethers.utils.parseEther(tokens).toString(),
                    tokenAddress: maxValuedTokenInfo.tokenAddress,
                    tokenPrice: maxValuedTokenInfo.tokenPrice.toString(),
                    tokenAmount: maxValuedTokenInfo.tokenAmount.toString(),
                    tokenValue: maxValuedTokenInfo.tokenValue.toString(),
                    runningValueTotal: runningValueTotal.toString()
                })
            });
            const { signature } = await response.json();
            return { signature, timestamp };
        }

        async function signSellDataUserThree(maxValuedTokenInfo, runningValueTotal, tokens) {
            const timestamp = Math.floor(Date.now() / 1000);
            const response = await fetch('http://localhost:5003/getSignedMessageSellTif', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    timestamp,
                    userAddress: deployment.userThree.address,
                    userTokensToBurn: ethers.utils.parseEther(tokens).toString(),
                    tokenAddress: maxValuedTokenInfo.tokenAddress,
                    tokenPrice: maxValuedTokenInfo.tokenPrice.toString(),
                    tokenAmount: maxValuedTokenInfo.tokenAmount.toString(),
                    tokenValue: maxValuedTokenInfo.tokenValue.toString(),
                    runningValueTotal: runningValueTotal.toString()
                })
            });
            const { signature } = await response.json();
            return { signature, timestamp };
        }
        
        // Show TIF total supply and user TIF/ETH balances after transactions
        async function userBalances() {
            console.log("\n");
            const userOneTifBalance = ethers.utils.formatEther(
                await deployment.token.balanceOf(deployment.userOne.address)
            ).toString();
            console.log("userOne TIF balance: ", userOneTifBalance);
            const userOneEthBalance = ethers.utils.formatEther(await deployment.userOne.getBalance()).toString();
            console.log("userOne ETH balance:", userOneEthBalance);
            
            const userTwoTifBalance = ethers.utils.formatEther(
                await deployment.token.balanceOf(deployment.userTwo.address)
            ).toString();
            console.log("userTwo TIF balance: ", userTwoTifBalance);
            const userTwoEthBalance = ethers.utils.formatEther(await deployment.userTwo.getBalance()).toString();
            console.log("userTwo ETH balance:", userTwoEthBalance);
            
            const userThreeTifBalance = ethers.utils.formatEther(
                await deployment.token.balanceOf(deployment.userThree.address)
            ).toString();
            console.log("userThree TIF balance: ", userThreeTifBalance);
            const userThreeEthBalance = ethers.utils.formatEther(await deployment.userThree.getBalance()).toString();
            console.log("userThree ETH balance:", userThreeEthBalance);

            tifTotalSupply = ethers.utils.formatEther(
                await deployment.token.totalSupply()
            ).toString();
            console.log("TIF total supply", tifTotalSupply);
        }

        async function tokensMintedEvent() {
            // Filter out event TokensMinted()
            const topic = ethers.utils.id("TokensMinted(uint256)");
            const filter = { topics: [topic] }
            const log = await ethers.provider.getLogs(filter);
            const logData = log[0].topics[1];
            const tifMinted = ethers.utils.formatUnits((ethers.BigNumber.from(logData)), 18);
            console.log("TIF Minted", tifMinted);
        }

        async function tokensBurnedEvent() {
            // Filter out event TokensBurned()
            const topic = ethers.utils.id("TokensBurned(uint256)");
            const filter = { topics: [topic] }
            const log = await ethers.provider.getLogs(filter);
            const logData = log[0].topics[1];
            const tifBurned = ethers.utils.formatUnits((ethers.BigNumber.from(logData)), 18);
            console.log("TIF Burned", tifBurned);
        }

        it("Should succeed in starting on the correct block number", async function () {
            expect(await ethers.provider.getBlockNumber()).to.equal(21754847);
        });

        it("Should succeed in showing no contract balance", async function () {
            expect(await ethers.provider.getBalance(deployment.main.address)).to.equal(0);
        });

        const DEFAULT_ADMIN_ROLE = "0x0000000000000000000000000000000000000000000000000000000000000000";
        it("Should succeed in deployer calling hasRole()", async function () {
            expect(await deployment.deployerMain.hasRole(DEFAULT_ADMIN_ROLE, deployment.deployer.address)).to.equal(false);
        });

        it("Should fail in deployer calling grantRole()", async function () {
            await expect(deployment.deployerMain.grantRole(DEFAULT_ADMIN_ROLE, deployment.deployer.address)).to.be.revertedWith(
                "AccessControl: account 0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266 is missing role 0x0000000000000000000000000000000000000000000000000000000000000000"
            );
        });

        it("Should succeed in calling getActiveTokens())", async function () {
            await expect(deployment.deployerMain.getActiveTokens(0, 100)).to.not.be.reverted;
        });

        // Calling with an input value that should not be possible in any liquidity pool with less than 2% impact
        it("Should fail in calling getMinValuedToken()", async function () {
            this.timeout(1200000);
            const result = await minValuedToken(10000); 
            expect(result).to.equal(null);
        });
        
        // Have to manually call getMinValuedToken() here with an input value of 0.001 as the default above is with 0.1
        it("Should succeed in deployer setting the exchange rate of TIF/ETH", async function () {
            const { minValuedTokenInfo, runningValueTotal } = await minValuedToken(0.01);

            const { signature, timestamp } = await signBuyDataDeployer(minValuedTokenInfo, runningValueTotal);
            
            const transaction = await deployment.deployerMain.buy(
                signature, 
                timestamp, 
                minValuedTokenInfo, 
                runningValueTotal, 
                { value: ethers.utils.parseEther("0.01"), nonce: 854 }
            );
            await transaction.wait();
            
            await tokensMintedEvent();
        });
        
        it("Should succeed in the deployer calling getTokenSymbol() for LINK", async function () {
            const tokenSymbol = await deployment.deployerMain.callStatic.getTokenSymbol("0x514910771AF9Ca656af840dff83E8264EcF986CA");
            expect(tokenSymbol).to.equal("0x4c494e4b00000000000000000000000000000000000000000000000000000000");
        });

        it("Should succeed in the deployer calling getRunningValueTotal() and getCurrentPrice()", async function () {
            const { activeTokens,
                    activeSymbols,
                    numOfActiveTokens } = await deployment.deployerMain.callStatic.getActiveTokens(0, 100);

            const { tokenValues, runningValueTotal } = await deployment.deployerMain.callStatic.getRunningValueTotal(
                activeTokens,
                tokenPrices,
                numOfActiveTokens
            );
            // Includes the 1 ETH sent before
            expect(runningValueTotal).to.equal("9846387422065841");

            const currentPrice = await deployment.deployerMain.callStatic.getCurrentPrice(runningValueTotal);
            expect(currentPrice).to.equal("9846387422065");
        });
        
        it("Should succeed in calling getMinValuedToken()", async function () {
            const { activeTokens,
                    activeSymbols,
                    numOfActiveTokens } = await deployment.deployerMain.callStatic.getActiveTokens(0, 100);

            // In production the call to get tokenPrices would be here

            await expect(deployment.deployerMain.getMinValuedToken(
                activeTokens, 
                tokenPrices, 
                numOfActiveTokens, 
                ethers.utils.parseEther("0.1")
            )).to.not.be.reverted;
        });
       
        // There is a balance here from the call above due to how staticCall works
        it("Should succeed in getting the contract balance", async function () {
            expect(await ethers.provider.getBalance(deployment.main.address)).to.equal(0);
        });
           
        // Now there's value from setting the exchange rate
        it("Should succeed in calling getMaxValuedToken()", async function () {
            const { activeTokens,
                    activeSymbols,
                    numOfActiveTokens } = await deployment.deployerMain.callStatic.getActiveTokens(0, 100);
            
            // In production the call to get tokenPrices would be here
            
            await expect(deployment.deployerMain.getMaxValuedToken(
                activeTokens,
                tokenPrices,
                numOfActiveTokens
            )).to.not.be.reverted;
        });
        
        it("Should fail in deployer buying 100 WEI of TIF", async function () {
            const { minValuedTokenInfo, runningValueTotal } = await minValuedToken(1);
            const { signature, timestamp } = await signBuyDataDeployer(minValuedTokenInfo, runningValueTotal);
           
            await expect(deployment.deployerMain.buy(
                signature,
                timestamp,
                minValuedTokenInfo, 
                runningValueTotal, 
                { value: ethers.utils.parseEther("0.0000000000000001") }
            )).to.be.revertedWithCustomError(deployment.main, "InsufficientInputAmount");
        });
        
        it("Should succeed in userOne calling mintUserContribution()", async function () {
            const { minValuedTokenInfo, runningValueTotal } = await minValuedToken(0.1);

            const tifToMint = await deployment.userOneMain.callStatic.mintUserContribution(
                ethers.utils.parseEther("0.1"),
                minValuedTokenInfo, 
                runningValueTotal
            );
            // The next transaction actually mints 9981.31246056207257
            expect(tifToMint).to.equal("9981312460562072570000");
        });
        
        it("Should succeed in userOne buying 0.1 ETH of TIF", async function () {
            const { minValuedTokenInfo, runningValueTotal } = await minValuedToken(0.1);
            
            const { signature, timestamp } = await signBuyDataUserOne(minValuedTokenInfo, runningValueTotal);
            
            const transaction = await deployment.userOneMain.buy(
                signature,
                timestamp,
                minValuedTokenInfo, 
                runningValueTotal, 
                { value: ethers.utils.parseEther("0.1") }
            );
            await transaction.wait();
            
            await userBalances();
            await tokensMintedEvent();
        });
        
        
        it("Should succeed in userTwo buying 0.1 ETH of TIF", async function () {
            const { minValuedTokenInfo, runningValueTotal } = await minValuedToken(0.1);
            
            const { signature, timestamp } = await signBuyDataUserTwo(minValuedTokenInfo, runningValueTotal);

            const transaction = await deployment.userTwoMain.buy(
                signature,
                timestamp,
                minValuedTokenInfo, 
                runningValueTotal, 
                { value: ethers.utils.parseEther("0.1") }
            );
            await transaction.wait();
            
            await userBalances();
            await tokensMintedEvent();
        });
        
        it("Should succeed in userThree buying 0.1 ETH of TIF", async function () {
            const { minValuedTokenInfo, runningValueTotal } = await minValuedToken(0.1);
            
            const { signature, timestamp } = await signBuyDataUserThree(minValuedTokenInfo, runningValueTotal);
            
            const transaction = await deployment.userThreeMain.buy(
                signature,
                timestamp,
                minValuedTokenInfo, 
                runningValueTotal, 
                { value: ethers.utils.parseEther("0.1") }
            );
            await transaction.wait();
            
            await userBalances();
            await tokensMintedEvent();
        });
        
        it("Should succeed in userOne buying 0.1 ETH of TIF", async function () {
            const { minValuedTokenInfo, runningValueTotal } = await minValuedToken(0.1);
            
            const { signature, timestamp } = await signBuyDataUserOne(minValuedTokenInfo, runningValueTotal);
            
            const transaction = await deployment.userOneMain.buy(
                signature,
                timestamp,
                minValuedTokenInfo, 
                runningValueTotal, 
                { value: ethers.utils.parseEther("0.1") }
            );
            await transaction.wait();
            
            await userBalances();
            await tokensMintedEvent();
        });
        
        it("Should succeed in userTwo buying 0.1 ETH of TIF", async function () {
            const { minValuedTokenInfo, runningValueTotal } = await minValuedToken(0.1);
            
            const { signature, timestamp } = await signBuyDataUserTwo(minValuedTokenInfo, runningValueTotal);

            const transaction = await deployment.userTwoMain.buy(
                signature,
                timestamp,
                minValuedTokenInfo, 
                runningValueTotal, 
                { value: ethers.utils.parseEther("0.1") }
            );
            await transaction.wait();
            
            await userBalances();
            await tokensMintedEvent();
        });
        
        it("Should succeed in userThree buying 0.1 ETH of TIF", async function () {
            const { minValuedTokenInfo, runningValueTotal } = await minValuedToken(0.1);
            
            const { signature, timestamp } = await signBuyDataUserThree(minValuedTokenInfo, runningValueTotal);
            
            const transaction = await deployment.userThreeMain.buy(
                signature,
                timestamp,
                minValuedTokenInfo, 
                runningValueTotal, 
                { value: ethers.utils.parseEther("0.1") }
            );
            await transaction.wait();
            
            await userBalances();
            await tokensMintedEvent();
        });

        it("Should succeed in userOne buying 0.1 ETH of TIF", async function () {
            const { minValuedTokenInfo, runningValueTotal } = await minValuedToken(0.1);
            
            const { signature, timestamp } = await signBuyDataUserOne(minValuedTokenInfo, runningValueTotal);
            
            const transaction = await deployment.userOneMain.buy(
                signature,
                timestamp,
                minValuedTokenInfo, 
                runningValueTotal, 
                { value: ethers.utils.parseEther("0.1") }
            );
            await transaction.wait();
            
            await userBalances();
            await tokensMintedEvent();
        });
        
        it("Should succeed in userTwo buying 0.1 ETH of TIF", async function () {
            const { minValuedTokenInfo, runningValueTotal } = await minValuedToken(0.1);
            
            const { signature, timestamp } = await signBuyDataUserTwo(minValuedTokenInfo, runningValueTotal);

            const transaction = await deployment.userTwoMain.buy(
                signature,
                timestamp,
                minValuedTokenInfo, 
                runningValueTotal, 
                { value: ethers.utils.parseEther("0.1") }
            );
            await transaction.wait();
            
            await userBalances();
            await tokensMintedEvent();
        });
        
        it("Should succeed in userThree buying 0.1 ETH of TIF", async function () {
            const { minValuedTokenInfo, runningValueTotal } = await minValuedToken(0.1);
            
            const { signature, timestamp } = await signBuyDataUserThree(minValuedTokenInfo, runningValueTotal);
            
            const transaction = await deployment.userThreeMain.buy(
                signature,
                timestamp,
                minValuedTokenInfo, 
                runningValueTotal, 
                { value: ethers.utils.parseEther("0.1") }
            );
            await transaction.wait();
            
            await userBalances();
            await tokensMintedEvent();
        });

        it("Should succeed in userOne buying 0.1 ETH of TIF", async function () {
            const { minValuedTokenInfo, runningValueTotal } = await minValuedToken(0.1);
            
            const { signature, timestamp } = await signBuyDataUserOne(minValuedTokenInfo, runningValueTotal);
            
            const transaction = await deployment.userOneMain.buy(
                signature,
                timestamp,
                minValuedTokenInfo, 
                runningValueTotal, 
                { value: ethers.utils.parseEther("0.1") }
            );
            await transaction.wait();
            
            await userBalances();
            await tokensMintedEvent();
        });
        
        it("Should succeed in userTwo buying 0.1 ETH of TIF", async function () {
            const { minValuedTokenInfo, runningValueTotal } = await minValuedToken(0.1);
            
            const { signature, timestamp } = await signBuyDataUserTwo(minValuedTokenInfo, runningValueTotal);

            const transaction = await deployment.userTwoMain.buy(
                signature,
                timestamp,
                minValuedTokenInfo, 
                runningValueTotal, 
                { value: ethers.utils.parseEther("0.1") }
            );
            await transaction.wait();
            
            await userBalances();
            await tokensMintedEvent();
        });
        
        it("Should succeed in userThree buying 0.1 ETH of TIF", async function () {
            const { minValuedTokenInfo, runningValueTotal } = await minValuedToken(0.1);
            
            const { signature, timestamp } = await signBuyDataUserThree(minValuedTokenInfo, runningValueTotal);
            
            const transaction = await deployment.userThreeMain.buy(
                signature,
                timestamp,
                minValuedTokenInfo, 
                runningValueTotal, 
                { value: ethers.utils.parseEther("0.1") }
            );
            await transaction.wait();
            
            await userBalances();
            await tokensMintedEvent();
        });
        
        it("Should succeed in userOne buying 0.1 ETH of TIF", async function () {
            const { minValuedTokenInfo, runningValueTotal } = await minValuedToken(0.1);
            
            const { signature, timestamp } = await signBuyDataUserOne(minValuedTokenInfo, runningValueTotal);
            
            const transaction = await deployment.userOneMain.buy(
                signature,
                timestamp,
                minValuedTokenInfo, 
                runningValueTotal, 
                { value: ethers.utils.parseEther("0.1") }
            );
            await transaction.wait();
            
            await userBalances();
            await tokensMintedEvent();
        });
        
        it("Should succeed in userTwo buying 0.1 ETH of TIF", async function () {
            const { minValuedTokenInfo, runningValueTotal } = await minValuedToken(0.1);
            
            const { signature, timestamp } = await signBuyDataUserTwo(minValuedTokenInfo, runningValueTotal);

            const transaction = await deployment.userTwoMain.buy(
                signature,
                timestamp,
                minValuedTokenInfo, 
                runningValueTotal, 
                { value: ethers.utils.parseEther("0.1") }
            );
            await transaction.wait();
            
            await userBalances();
            await tokensMintedEvent();
        });
        
        it("Should succeed in userThree buying 0.1 ETH of TIF", async function () {
            const { minValuedTokenInfo, runningValueTotal } = await minValuedToken(0.1);
            
            const { signature, timestamp } = await signBuyDataUserThree(minValuedTokenInfo, runningValueTotal);
            
            const transaction = await deployment.userThreeMain.buy(
                signature,
                timestamp,
                minValuedTokenInfo, 
                runningValueTotal, 
                { value: ethers.utils.parseEther("0.1") }
            );
            await transaction.wait();
            
            await userBalances();
            await tokensMintedEvent();
        });

        it("Should succeed in userOne buying 0.1 ETH of TIF", async function () {
            const { minValuedTokenInfo, runningValueTotal } = await minValuedToken(0.1);
            
            const { signature, timestamp } = await signBuyDataUserOne(minValuedTokenInfo, runningValueTotal);
            
            const transaction = await deployment.userOneMain.buy(
                signature,
                timestamp,
                minValuedTokenInfo, 
                runningValueTotal, 
                { value: ethers.utils.parseEther("0.1") }
            );
            await transaction.wait();
            
            await userBalances();
            await tokensMintedEvent();
        });
        
        it("Should succeed in userTwo buying 0.1 ETH of TIF", async function () {
            const { minValuedTokenInfo, runningValueTotal } = await minValuedToken(0.1);
            
            const { signature, timestamp } = await signBuyDataUserTwo(minValuedTokenInfo, runningValueTotal);

            const transaction = await deployment.userTwoMain.buy(
                signature,
                timestamp,
                minValuedTokenInfo, 
                runningValueTotal, 
                { value: ethers.utils.parseEther("0.1") }
            );
            await transaction.wait();
            
            await userBalances();
            await tokensMintedEvent();
        });
        
        it("Should succeed in userThree buying 0.1 ETH of TIF", async function () {
            const { minValuedTokenInfo, runningValueTotal } = await minValuedToken(0.1);
            
            const { signature, timestamp } = await signBuyDataUserThree(minValuedTokenInfo, runningValueTotal);
            
            const transaction = await deployment.userThreeMain.buy(
                signature,
                timestamp,
                minValuedTokenInfo, 
                runningValueTotal, 
                { value: ethers.utils.parseEther("0.1") }
            );
            await transaction.wait();
            
            await userBalances();
            await tokensMintedEvent();
        });

        it("Should succeed in userOne buying 0.1 ETH of TIF", async function () {
            const { minValuedTokenInfo, runningValueTotal } = await minValuedToken(0.1);
            
            const { signature, timestamp } = await signBuyDataUserOne(minValuedTokenInfo, runningValueTotal);
            
            const transaction = await deployment.userOneMain.buy(
                signature,
                timestamp,
                minValuedTokenInfo, 
                runningValueTotal, 
                { value: ethers.utils.parseEther("0.1") }
            );
            await transaction.wait();
            
            await userBalances();
            await tokensMintedEvent();
        });
        
        it("Should succeed in userTwo buying 0.1 ETH of TIF", async function () {
            const { minValuedTokenInfo, runningValueTotal } = await minValuedToken(0.1);
            
            const { signature, timestamp } = await signBuyDataUserTwo(minValuedTokenInfo, runningValueTotal);

            const transaction = await deployment.userTwoMain.buy(
                signature,
                timestamp,
                minValuedTokenInfo, 
                runningValueTotal, 
                { value: ethers.utils.parseEther("0.1") }
            );
            await transaction.wait();
            
            await userBalances();
            await tokensMintedEvent();
        });
        
        it("Should succeed in userThree buying 0.1 ETH of TIF", async function () {
            const { minValuedTokenInfo, runningValueTotal } = await minValuedToken(0.1);
            
            const { signature, timestamp } = await signBuyDataUserThree(minValuedTokenInfo, runningValueTotal);
            
            const transaction = await deployment.userThreeMain.buy(
                signature,
                timestamp,
                minValuedTokenInfo, 
                runningValueTotal, 
                { value: ethers.utils.parseEther("0.1") }
            );
            await transaction.wait();
            
            await userBalances();
            await tokensMintedEvent();
        });

        it("Should succeed in userOne buying 0.1 ETH of TIF", async function () {
            const { minValuedTokenInfo, runningValueTotal } = await minValuedToken(0.1);
            
            const { signature, timestamp } = await signBuyDataUserOne(minValuedTokenInfo, runningValueTotal);
            
            const transaction = await deployment.userOneMain.buy(
                signature,
                timestamp,
                minValuedTokenInfo, 
                runningValueTotal, 
                { value: ethers.utils.parseEther("0.1") }
            );
            await transaction.wait();
            
            await userBalances();
            await tokensMintedEvent();
        });
        
        it("Should succeed in userTwo buying 0.1 ETH of TIF", async function () {
            const { minValuedTokenInfo, runningValueTotal } = await minValuedToken(0.1);
            
            const { signature, timestamp } = await signBuyDataUserTwo(minValuedTokenInfo, runningValueTotal);

            const transaction = await deployment.userTwoMain.buy(
                signature,
                timestamp,
                minValuedTokenInfo, 
                runningValueTotal, 
                { value: ethers.utils.parseEther("0.1") }
            );
            await transaction.wait();
            
            await userBalances();
            await tokensMintedEvent();
        });
        
        it("Should succeed in userThree buying 0.1 ETH of TIF", async function () {
            const { minValuedTokenInfo, runningValueTotal } = await minValuedToken(0.1);
            
            const { signature, timestamp } = await signBuyDataUserThree(minValuedTokenInfo, runningValueTotal);
            
            const transaction = await deployment.userThreeMain.buy(
                signature,
                timestamp,
                minValuedTokenInfo, 
                runningValueTotal, 
                { value: ethers.utils.parseEther("0.1") }
            );
            await transaction.wait();
            
            await userBalances();
            await tokensMintedEvent();
        });

        it("Should succeed in userOne buying 0.1 ETH of TIF", async function () {
            const { minValuedTokenInfo, runningValueTotal } = await minValuedToken(0.1);
            
            const { signature, timestamp } = await signBuyDataUserOne(minValuedTokenInfo, runningValueTotal);
            
            const transaction = await deployment.userOneMain.buy(
                signature,
                timestamp,
                minValuedTokenInfo, 
                runningValueTotal, 
                { value: ethers.utils.parseEther("0.1") }
            );
            await transaction.wait();
            
            await userBalances();
            await tokensMintedEvent();
        });
        
        it("Should succeed in userTwo buying 0.1 ETH of TIF", async function () {
            const { minValuedTokenInfo, runningValueTotal } = await minValuedToken(0.1);
            
            const { signature, timestamp } = await signBuyDataUserTwo(minValuedTokenInfo, runningValueTotal);

            const transaction = await deployment.userTwoMain.buy(
                signature,
                timestamp,
                minValuedTokenInfo, 
                runningValueTotal, 
                { value: ethers.utils.parseEther("0.1") }
            );
            await transaction.wait();
            
            await userBalances();
            await tokensMintedEvent();
        });
        
        it("Should succeed in userThree buying 0.1 ETH of TIF", async function () {
            const { minValuedTokenInfo, runningValueTotal } = await minValuedToken(0.1);
            
            const { signature, timestamp } = await signBuyDataUserThree(minValuedTokenInfo, runningValueTotal);
            
            const transaction = await deployment.userThreeMain.buy(
                signature,
                timestamp,
                minValuedTokenInfo, 
                runningValueTotal, 
                { value: ethers.utils.parseEther("0.1") }
            );
            await transaction.wait();
            
            await userBalances();
            await tokensMintedEvent();
        });

        it("Should succeed in userOne buying 0.1 ETH of TIF", async function () {
            const { minValuedTokenInfo, runningValueTotal } = await minValuedToken(0.1);
            
            const { signature, timestamp } = await signBuyDataUserOne(minValuedTokenInfo, runningValueTotal);
            
            const transaction = await deployment.userOneMain.buy(
                signature,
                timestamp,
                minValuedTokenInfo, 
                runningValueTotal, 
                { value: ethers.utils.parseEther("0.1") }
            );
            await transaction.wait();
            
            await userBalances();
            await tokensMintedEvent();
        });
        
        it("Should succeed in userTwo buying 0.1 ETH of TIF", async function () {
            const { minValuedTokenInfo, runningValueTotal } = await minValuedToken(0.1);
            
            const { signature, timestamp } = await signBuyDataUserTwo(minValuedTokenInfo, runningValueTotal);

            const transaction = await deployment.userTwoMain.buy(
                signature,
                timestamp,
                minValuedTokenInfo, 
                runningValueTotal, 
                { value: ethers.utils.parseEther("0.1") }
            );
            await transaction.wait();
            
            await userBalances();
            await tokensMintedEvent();
        });
        
        it("Should succeed in userThree buying 0.1 ETH of TIF", async function () {
            const { minValuedTokenInfo, runningValueTotal } = await minValuedToken(0.1);
            
            const { signature, timestamp } = await signBuyDataUserThree(minValuedTokenInfo, runningValueTotal);
            
            const transaction = await deployment.userThreeMain.buy(
                signature,
                timestamp,
                minValuedTokenInfo, 
                runningValueTotal, 
                { value: ethers.utils.parseEther("0.1") }
            );
            await transaction.wait();
            
            await userBalances();
            await tokensMintedEvent();
        });

        it("Should succeed in userOne buying 0.1 ETH of TIF", async function () {
            const { minValuedTokenInfo, runningValueTotal } = await minValuedToken(0.1);
            
            const { signature, timestamp } = await signBuyDataUserOne(minValuedTokenInfo, runningValueTotal);
            
            const transaction = await deployment.userOneMain.buy(
                signature,
                timestamp,
                minValuedTokenInfo, 
                runningValueTotal, 
                { value: ethers.utils.parseEther("0.1") }
            );
            await transaction.wait();
            
            await userBalances();
            await tokensMintedEvent();
        });
        
        it("Should succeed in userTwo buying 0.1 ETH of TIF", async function () {
            const { minValuedTokenInfo, runningValueTotal } = await minValuedToken(0.1);
            
            const { signature, timestamp } = await signBuyDataUserTwo(minValuedTokenInfo, runningValueTotal);

            const transaction = await deployment.userTwoMain.buy(
                signature,
                timestamp,
                minValuedTokenInfo, 
                runningValueTotal, 
                { value: ethers.utils.parseEther("0.1") }
            );
            await transaction.wait();
            
            await userBalances();
            await tokensMintedEvent();
        });
        
        it("Should succeed in userThree buying 0.1 ETH of TIF", async function () {
            const { minValuedTokenInfo, runningValueTotal } = await minValuedToken(0.1);
            
            const { signature, timestamp } = await signBuyDataUserThree(minValuedTokenInfo, runningValueTotal);
            
            const transaction = await deployment.userThreeMain.buy(
                signature,
                timestamp,
                minValuedTokenInfo, 
                runningValueTotal, 
                { value: ethers.utils.parseEther("0.1") }
            );
            await transaction.wait();
            
            await userBalances();
            await tokensMintedEvent();
        });

        it("Should succeed in userOne buying 0.1 ETH of TIF", async function () {
            const { minValuedTokenInfo, runningValueTotal } = await minValuedToken(0.1);
            
            const { signature, timestamp } = await signBuyDataUserOne(minValuedTokenInfo, runningValueTotal);
            
            const transaction = await deployment.userOneMain.buy(
                signature,
                timestamp,
                minValuedTokenInfo, 
                runningValueTotal, 
                { value: ethers.utils.parseEther("0.1") }
            );
            await transaction.wait();
            
            await userBalances();
            await tokensMintedEvent();
        });
        
        it("Should succeed in userTwo buying 0.1 ETH of TIF", async function () {
            const { minValuedTokenInfo, runningValueTotal } = await minValuedToken(0.1);
            
            const { signature, timestamp } = await signBuyDataUserTwo(minValuedTokenInfo, runningValueTotal);

            const transaction = await deployment.userTwoMain.buy(
                signature,
                timestamp,
                minValuedTokenInfo, 
                runningValueTotal, 
                { value: ethers.utils.parseEther("0.1") }
            );
            await transaction.wait();
            
            await userBalances();
            await tokensMintedEvent();
        });
        
        it("Should succeed in userThree buying 0.1 ETH of TIF", async function () {
            const { minValuedTokenInfo, runningValueTotal } = await minValuedToken(0.1);
            
            const { signature, timestamp } = await signBuyDataUserThree(minValuedTokenInfo, runningValueTotal);
            
            const transaction = await deployment.userThreeMain.buy(
                signature,
                timestamp,
                minValuedTokenInfo, 
                runningValueTotal, 
                { value: ethers.utils.parseEther("0.1") }
            );
            await transaction.wait();
            
            await userBalances();
            await tokensMintedEvent();
        });

        it("Should succeed in userOne buying 0.1 ETH of TIF", async function () {
            const { minValuedTokenInfo, runningValueTotal } = await minValuedToken(0.1);
            
            const { signature, timestamp } = await signBuyDataUserOne(minValuedTokenInfo, runningValueTotal);
            
            const transaction = await deployment.userOneMain.buy(
                signature,
                timestamp,
                minValuedTokenInfo, 
                runningValueTotal, 
                { value: ethers.utils.parseEther("0.1") }
            );
            await transaction.wait();
            
            await userBalances();
            await tokensMintedEvent();
        });
        
        it("Should succeed in userTwo buying 0.1 ETH of TIF", async function () {
            const { minValuedTokenInfo, runningValueTotal } = await minValuedToken(0.1);
            
            const { signature, timestamp } = await signBuyDataUserTwo(minValuedTokenInfo, runningValueTotal);

            const transaction = await deployment.userTwoMain.buy(
                signature,
                timestamp,
                minValuedTokenInfo, 
                runningValueTotal, 
                { value: ethers.utils.parseEther("0.1") }
            );
            await transaction.wait();
            
            await userBalances();
            await tokensMintedEvent();
        });
        
        it("Should succeed in userThree buying 0.1 ETH of TIF", async function () {
            const { minValuedTokenInfo, runningValueTotal } = await minValuedToken(0.1);
            
            const { signature, timestamp } = await signBuyDataUserThree(minValuedTokenInfo, runningValueTotal);
            
            const transaction = await deployment.userThreeMain.buy(
                signature,
                timestamp,
                minValuedTokenInfo, 
                runningValueTotal, 
                { value: ethers.utils.parseEther("0.1") }
            );
            await transaction.wait();
            
            await userBalances();
            await tokensMintedEvent();
        });

        it("Should succeed in userOne buying 0.1 ETH of TIF", async function () {
            const { minValuedTokenInfo, runningValueTotal } = await minValuedToken(0.1);
            
            const { signature, timestamp } = await signBuyDataUserOne(minValuedTokenInfo, runningValueTotal);
            
            const transaction = await deployment.userOneMain.buy(
                signature,
                timestamp,
                minValuedTokenInfo, 
                runningValueTotal, 
                { value: ethers.utils.parseEther("0.1") }
            );
            await transaction.wait();
            
            await userBalances();
            await tokensMintedEvent();
        });
        
        it("Should succeed in userTwo buying 0.1 ETH of TIF", async function () {
            const { minValuedTokenInfo, runningValueTotal } = await minValuedToken(0.1);
            
            const { signature, timestamp } = await signBuyDataUserTwo(minValuedTokenInfo, runningValueTotal);

            const transaction = await deployment.userTwoMain.buy(
                signature,
                timestamp,
                minValuedTokenInfo, 
                runningValueTotal, 
                { value: ethers.utils.parseEther("0.1") }
            );
            await transaction.wait();
            
            await userBalances();
            await tokensMintedEvent();
        });
        
        it("Should succeed in userThree buying 0.1 ETH of TIF", async function () {
            const { minValuedTokenInfo, runningValueTotal } = await minValuedToken(0.1);
            
            const { signature, timestamp } = await signBuyDataUserThree(minValuedTokenInfo, runningValueTotal);
            
            const transaction = await deployment.userThreeMain.buy(
                signature,
                timestamp,
                minValuedTokenInfo, 
                runningValueTotal, 
                { value: ethers.utils.parseEther("0.1") }
            );
            await transaction.wait();
            
            await userBalances();
            await tokensMintedEvent();
        });

        it("Should succeed in userOne buying 0.1 ETH of TIF", async function () {
            const { minValuedTokenInfo, runningValueTotal } = await minValuedToken(0.1);
            
            const { signature, timestamp } = await signBuyDataUserOne(minValuedTokenInfo, runningValueTotal);
            
            const transaction = await deployment.userOneMain.buy(
                signature,
                timestamp,
                minValuedTokenInfo, 
                runningValueTotal, 
                { value: ethers.utils.parseEther("0.1") }
            );
            await transaction.wait();
            
            await userBalances();
            await tokensMintedEvent();
        });
        
        it("Should succeed in userTwo buying 0.1 ETH of TIF", async function () {
            const { minValuedTokenInfo, runningValueTotal } = await minValuedToken(0.1);
            
            const { signature, timestamp } = await signBuyDataUserTwo(minValuedTokenInfo, runningValueTotal);

            const transaction = await deployment.userTwoMain.buy(
                signature,
                timestamp,
                minValuedTokenInfo, 
                runningValueTotal, 
                { value: ethers.utils.parseEther("0.1") }
            );
            await transaction.wait();
            
            await userBalances();
            await tokensMintedEvent();
        });
        
        it("Should succeed in userThree buying 0.1 ETH of TIF", async function () {
            const { minValuedTokenInfo, runningValueTotal } = await minValuedToken(0.1);
            
            const { signature, timestamp } = await signBuyDataUserThree(minValuedTokenInfo, runningValueTotal);
            
            const transaction = await deployment.userThreeMain.buy(
                signature,
                timestamp,
                minValuedTokenInfo, 
                runningValueTotal, 
                { value: ethers.utils.parseEther("0.1") }
            );
            await transaction.wait();
            
            await userBalances();
            await tokensMintedEvent();
        });

        it("Should succeed in userOne buying 0.1 ETH of TIF", async function () {
            const { minValuedTokenInfo, runningValueTotal } = await minValuedToken(0.1);
            
            const { signature, timestamp } = await signBuyDataUserOne(minValuedTokenInfo, runningValueTotal);
            
            const transaction = await deployment.userOneMain.buy(
                signature,
                timestamp,
                minValuedTokenInfo, 
                runningValueTotal, 
                { value: ethers.utils.parseEther("0.1") }
            );
            await transaction.wait();
            
            await userBalances();
            await tokensMintedEvent();
        });
        
        it("Should succeed in userTwo buying 0.1 ETH of TIF", async function () {
            const { minValuedTokenInfo, runningValueTotal } = await minValuedToken(0.1);
            
            const { signature, timestamp } = await signBuyDataUserTwo(minValuedTokenInfo, runningValueTotal);

            const transaction = await deployment.userTwoMain.buy(
                signature,
                timestamp,
                minValuedTokenInfo, 
                runningValueTotal, 
                { value: ethers.utils.parseEther("0.1") }
            );
            await transaction.wait();
            
            await userBalances();
            await tokensMintedEvent();
        });
        
        it("Should succeed in userThree buying 0.1 ETH of TIF", async function () {
            const { minValuedTokenInfo, runningValueTotal } = await minValuedToken(0.1);
            
            const { signature, timestamp } = await signBuyDataUserThree(minValuedTokenInfo, runningValueTotal);
            
            const transaction = await deployment.userThreeMain.buy(
                signature,
                timestamp,
                minValuedTokenInfo, 
                runningValueTotal, 
                { value: ethers.utils.parseEther("0.1") }
            );
            await transaction.wait();
            
            await userBalances();
            await tokensMintedEvent();
        });

        it("Should succeed in userOne buying 0.1 ETH of TIF", async function () {
            const { minValuedTokenInfo, runningValueTotal } = await minValuedToken(0.1);
            
            const { signature, timestamp } = await signBuyDataUserOne(minValuedTokenInfo, runningValueTotal);
            
            const transaction = await deployment.userOneMain.buy(
                signature,
                timestamp,
                minValuedTokenInfo, 
                runningValueTotal, 
                { value: ethers.utils.parseEther("0.1") }
            );
            await transaction.wait();
            
            await userBalances();
            await tokensMintedEvent();
        });
        
        it("Should succeed in userTwo buying 0.1 ETH of TIF", async function () {
            const { minValuedTokenInfo, runningValueTotal } = await minValuedToken(0.1);
            
            const { signature, timestamp } = await signBuyDataUserTwo(minValuedTokenInfo, runningValueTotal);

            const transaction = await deployment.userTwoMain.buy(
                signature,
                timestamp,
                minValuedTokenInfo, 
                runningValueTotal, 
                { value: ethers.utils.parseEther("0.1") }
            );
            await transaction.wait();
            
            await userBalances();
            await tokensMintedEvent();
        });
        
        it("Should succeed in userThree buying 0.1 ETH of TIF", async function () {
            const { minValuedTokenInfo, runningValueTotal } = await minValuedToken(0.1);
            
            const { signature, timestamp } = await signBuyDataUserThree(minValuedTokenInfo, runningValueTotal);
            
            const transaction = await deployment.userThreeMain.buy(
                signature,
                timestamp,
                minValuedTokenInfo, 
                runningValueTotal, 
                { value: ethers.utils.parseEther("0.1") }
            );
            await transaction.wait();
            
            await userBalances();
            await tokensMintedEvent();
        });

        it("Should succeed in userOne buying 0.1 ETH of TIF", async function () {
            const { minValuedTokenInfo, runningValueTotal } = await minValuedToken(0.1);
            
            const { signature, timestamp } = await signBuyDataUserOne(minValuedTokenInfo, runningValueTotal);
            
            const transaction = await deployment.userOneMain.buy(
                signature,
                timestamp,
                minValuedTokenInfo, 
                runningValueTotal, 
                { value: ethers.utils.parseEther("0.1") }
            );
            await transaction.wait();
            
            await userBalances();
            await tokensMintedEvent();
        });
        
        it("Should succeed in userTwo buying 0.1 ETH of TIF", async function () {
            const { minValuedTokenInfo, runningValueTotal } = await minValuedToken(0.1);
            
            const { signature, timestamp } = await signBuyDataUserTwo(minValuedTokenInfo, runningValueTotal);

            const transaction = await deployment.userTwoMain.buy(
                signature,
                timestamp,
                minValuedTokenInfo, 
                runningValueTotal, 
                { value: ethers.utils.parseEther("0.1") }
            );
            await transaction.wait();
            
            await userBalances();
            await tokensMintedEvent();
        });
        
        it("Should succeed in userThree buying 0.1 ETH of TIF", async function () {
            const { minValuedTokenInfo, runningValueTotal } = await minValuedToken(0.1);
            
            const { signature, timestamp } = await signBuyDataUserThree(minValuedTokenInfo, runningValueTotal);
            
            const transaction = await deployment.userThreeMain.buy(
                signature,
                timestamp,
                minValuedTokenInfo, 
                runningValueTotal, 
                { value: ethers.utils.parseEther("0.1") }
            );
            await transaction.wait();
            
            await userBalances();
            await tokensMintedEvent();
        });
        
        // This represents the max value of uint256 which is (2**256-1)
        let maxPossibleTokenValue = ethers.BigNumber.from("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff");
        
        it("Should succeed in the users approving Main.sol to spend the maxPossibleTokenValue via approve()", async function () {
            await expect(deployment.userOneToken.approve(deployment.main.address, maxPossibleTokenValue)).to.not.be.reverted;
            await expect(deployment.userTwoToken.approve(deployment.main.address, maxPossibleTokenValue)).to.not.be.reverted;
            await expect(deployment.userThreeToken.approve(deployment.main.address, maxPossibleTokenValue)).to.not.be.reverted;

            expect(await deployment.userOneToken.allowance(deployment.userOne.address, deployment.main.address)
            ).to.equal(ethers.BigNumber.from("115792089237316195423570985008687907853269984665640564039457584007913129639935"));
            expect(await deployment.userTwoToken.allowance(deployment.userTwo.address, deployment.main.address)
            ).to.equal(ethers.BigNumber.from("115792089237316195423570985008687907853269984665640564039457584007913129639935"));
            expect(await deployment.userThreeToken.allowance(deployment.userThree.address, deployment.main.address)
            ).to.equal(ethers.BigNumber.from("115792089237316195423570985008687907853269984665640564039457584007913129639935"));
        });

        it("Should fail in deployer selling 0 tokens", async function () {
            const { maxValuedTokenInfo, runningValueTotal } = await maxValuedToken();

            const { signature, timestamp } = await signSellDataDeployer(maxValuedTokenInfo, runningValueTotal, "0");
            
            await expect(deployment.deployerMain.sell(
                signature,
                timestamp,
                0, 
                maxValuedTokenInfo,
                runningValueTotal
            )).to.be.revertedWithCustomError(deployment.main, "InsufficientInputAmount");
        });
        
        it("Should fail in deployer selling 1 million tokens", async function () {
            const { maxValuedTokenInfo, runningValueTotal } = await maxValuedToken();
            
            const { signature, timestamp } = await signSellDataDeployer(maxValuedTokenInfo, runningValueTotal, "1000000");
            
            await expect(deployment.deployerMain.sell(
                signature,
                timestamp,
                (ethers.utils.parseUnits("1000000", 18)), 
                maxValuedTokenInfo,
                runningValueTotal
            )).to.be.revertedWith("ERC20: insufficient allowance");
        });
            
        it("Should succeed in userOne calling burnUserContribution()", async function () {
            const { maxValuedTokenInfo, runningValueTotal } = await maxValuedToken();
            

            const [ expectedOutput, tifToBurn ] = await deployment.userOneMain.callStatic.burnUserContribution(
                ethers.utils.parseEther("1000000"), 
                maxValuedTokenInfo,
                runningValueTotal
            );
            // Actual amount next transaction is 19929.26970322248570922
            expect(tifToBurn).to.equal("19929269703222485709220");
        });
        
            
        it("Should succeed in userOne selling a portion of 1 million tokens", async function () {
            const { maxValuedTokenInfo, runningValueTotal } = await maxValuedToken();
            
            const { signature, timestamp } = await signSellDataUserOne(maxValuedTokenInfo, runningValueTotal, "1000000");

            const transaction = await deployment.userOneMain.sell(
                signature,
                timestamp,
                (ethers.utils.parseUnits("1000000", 18)), 
                maxValuedTokenInfo,
                runningValueTotal
            );
            await transaction.wait();

            await userBalances();
            await tokensBurnedEvent(); 
        });
            
        
        it("Should succeed in userTwo selling a portion of 1 million tokens", async function () {
            const { maxValuedTokenInfo, runningValueTotal } = await maxValuedToken();

            const { signature, timestamp } = await signSellDataUserTwo(maxValuedTokenInfo, runningValueTotal, "1000000");

            const transaction = await deployment.userTwoMain.sell(
                signature,
                timestamp,
                (ethers.utils.parseUnits("1000000", 18)), 
                maxValuedTokenInfo,
                runningValueTotal
            );
            await transaction.wait();

            await userBalances();
            await tokensBurnedEvent(); 
        });
            
        it("Should succeed in userThree selling a portion of 1 million tokens", async function () {
            const { maxValuedTokenInfo, runningValueTotal } = await maxValuedToken();
            
            const { signature, timestamp } = await signSellDataUserThree(maxValuedTokenInfo, runningValueTotal, "1000000");

            const transaction = await deployment.userThreeMain.sell(
                signature,
                timestamp,
                (ethers.utils.parseUnits("1000000", 18)), 
                maxValuedTokenInfo,
                runningValueTotal
            );
            await transaction.wait();

            await userBalances();
            await tokensBurnedEvent(); 
        });
        
        it("Should succeed in userOne selling 10 thousand tokens", async function () {
            const { maxValuedTokenInfo, runningValueTotal } = await maxValuedToken();
            
            const { signature, timestamp } = await signSellDataUserOne(maxValuedTokenInfo, runningValueTotal, "10000");

            const transaction = await deployment.userOneMain.sell(
                signature,
                timestamp,
                (ethers.utils.parseUnits("10000", 18)), 
                maxValuedTokenInfo,
                runningValueTotal
            );
            await transaction.wait();

            await userBalances();
            await tokensBurnedEvent(); 
        });
            
        
        it("Should succeed in userTwo selling 10 thousand tokens", async function () {
            const { maxValuedTokenInfo, runningValueTotal } = await maxValuedToken();
            
            const { signature, timestamp } = await signSellDataUserTwo(maxValuedTokenInfo, runningValueTotal, "10000");

            const transaction = await deployment.userTwoMain.sell(
                signature,
                timestamp,
                (ethers.utils.parseUnits("10000", 18)), 
                maxValuedTokenInfo,
                runningValueTotal
            );
            await transaction.wait();

            await userBalances();
            await tokensBurnedEvent(); 
        });
            
        it("Should succeed in userThree selling 10 thousand tokens", async function () {
            const { maxValuedTokenInfo, runningValueTotal } = await maxValuedToken();
            
            const { signature, timestamp } = await signSellDataUserThree(maxValuedTokenInfo, runningValueTotal, "10000");

            const transaction = await deployment.userThreeMain.sell(
                signature,
                timestamp,
                (ethers.utils.parseUnits("10000", 18)), 
                maxValuedTokenInfo,
                runningValueTotal
            );
            await transaction.wait();

            await userBalances();
            await tokensBurnedEvent(); 
        });
        
        it("Should succeed in userOne selling 100 tokens", async function () {
            const { maxValuedTokenInfo, runningValueTotal } = await maxValuedToken();
            
            const { signature, timestamp } = await signSellDataUserOne(maxValuedTokenInfo, runningValueTotal, "100");

            const transaction = await deployment.userOneMain.sell(
                signature,
                timestamp,
                (ethers.utils.parseUnits("100", 18)), 
                maxValuedTokenInfo,
                runningValueTotal
            );
            await transaction.wait();

            await userBalances();
            await tokensBurnedEvent(); 
        });
        
        it("Should succeed in userTwo selling 1 token", async function () {
            const { maxValuedTokenInfo, runningValueTotal } = await maxValuedToken();
            
            const { signature, timestamp } = await signSellDataUserTwo(maxValuedTokenInfo, runningValueTotal, "1");

            const transaction = await deployment.userTwoMain.sell(
                signature,
                timestamp,
                (ethers.utils.parseUnits("1", 18)), 
                maxValuedTokenInfo,
                runningValueTotal
            );
            await transaction.wait();

            await userBalances();
            await tokensBurnedEvent(); 
        });
        
        it("Should succeed in userThree selling 0.001 tokens", async function () {
            const { maxValuedTokenInfo, runningValueTotal } = await maxValuedToken();
            
            const { signature, timestamp } = await signSellDataUserThree(maxValuedTokenInfo, runningValueTotal, "0.001");

            const transaction = await deployment.userThreeMain.sell(
                signature,
                timestamp,
                (ethers.utils.parseUnits("0.001", 18)), 
                maxValuedTokenInfo,
                runningValueTotal
            );
            await transaction.wait();

            await userBalances();
            await tokensBurnedEvent(); 
        });
        
        it("Should succeed in userOne selling 0.000000001 tokens", async function () {
            const { maxValuedTokenInfo, runningValueTotal } = await maxValuedToken();
            
            const { signature, timestamp } = await signSellDataUserOne(maxValuedTokenInfo, runningValueTotal, "0.000000001");

            const transaction = await deployment.userOneMain.sell(
                signature,
                timestamp,
                (ethers.utils.parseUnits("0.000000001", 18)), 
                maxValuedTokenInfo,
                runningValueTotal
            );
            await transaction.wait();

            await userBalances();
            await tokensBurnedEvent(); 
        });
        
        // Test small and large amounts
        it("Should succeed in userOne buying 0.000000001 ETH of TIF", async function () {
            const { minValuedTokenInfo, runningValueTotal } = await minValuedToken("0.000000001");
            
            const { signature, timestamp } = await signBuyDataUserOne(minValuedTokenInfo, runningValueTotal);
            
            const transaction = await deployment.userOneMain.buy(
                signature,
                timestamp,
                minValuedTokenInfo, 
                runningValueTotal, 
                { value: ethers.utils.parseEther("0.000000001") }
            );
            await transaction.wait();
            
            await userBalances();
            await tokensMintedEvent();
        });
        
        it("Should succeed in userTwo buying 0.001 ETH of TIF", async function () {
            const { minValuedTokenInfo, runningValueTotal } = await minValuedToken(0.001);
            
            const { signature, timestamp } = await signBuyDataUserTwo(minValuedTokenInfo, runningValueTotal);
            
            const transaction = await deployment.userTwoMain.buy(
                signature,
                timestamp,
                minValuedTokenInfo, 
                runningValueTotal, 
                { value: ethers.utils.parseEther("0.001") }
            );
            await transaction.wait();
            
            await userBalances();
            await tokensMintedEvent();
        });
        
        it("Should succeed in userThree buying 1 ETH of TIF", async function () {
            const { minValuedTokenInfo, runningValueTotal } = await minValuedToken(1);
            
            const { signature, timestamp } = await signBuyDataUserThree(minValuedTokenInfo, runningValueTotal);
            
            const transaction = await deployment.userThreeMain.buy(
                signature,
                timestamp,
                minValuedTokenInfo, 
                runningValueTotal, 
                { value: ethers.utils.parseEther("1") }
            );
            await transaction.wait();
            
            await userBalances();
            await tokensMintedEvent();
        });
        
        it("Should succeed in userOne buying 100 ETH of TIF", async function () {
            const { minValuedTokenInfo, runningValueTotal } = await minValuedToken(100);
            
            const { signature, timestamp } = await signBuyDataUserOne(minValuedTokenInfo, runningValueTotal);
            
            const transaction = await deployment.userOneMain.buy(
                signature,
                timestamp,
                minValuedTokenInfo, 
                runningValueTotal, 
                { value: ethers.utils.parseEther("100") }
            );
            await transaction.wait();
            
            await userBalances();
            await tokensMintedEvent();
        });
        
        it("Should succeed in userOne selling 10 million tokens", async function () {
            const { maxValuedTokenInfo, runningValueTotal } = await maxValuedToken();

            const { signature, timestamp } = await signSellDataUserOne(maxValuedTokenInfo, runningValueTotal, "10000000");

            const transaction = await deployment.userOneMain.sell(
                signature,
                timestamp,
                (ethers.utils.parseUnits("10000000", 18)), 
                maxValuedTokenInfo,
                runningValueTotal
            );
            await transaction.wait();

            await userBalances();
            await tokensBurnedEvent(); 
        });
            
        
        it("Should succeed in sending 1 ETH to the Main.sol via receive()", async function () {
            expect(await ethers.provider.getBalance(deployment.main.address)).to.equal("5499");
            await expect(deployment.deployer.sendTransaction(
                { to: deployment.main.address, value: ethers.utils.parseEther("1") }
            )).to.not.be.reverted;
            // Mine block of prior transaction
            await ethers.provider.send("evm_mine");
            expect(await ethers.provider.getBalance(deployment.main.address)).to.equal("1000000000000005499");
        });
        
    });
});
