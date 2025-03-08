// Explicitly show the ethers import
const { ethers } = require("hardhat");
const { expect} = require("chai");
// Used to deploy contracts before running tests
const { deploy } = require("./deployment.js");

describe("Validate.sol", function () {
    before(async function () {
        deployment = await deploy();
    });
    
    describe("Validate Tests", function () {
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

        async function getData() {
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
            return { minValuedTokenInfo, runningValueTotal };
        }

        it("Should succeed in starting on the correct block number", async function () {
            expect(await ethers.provider.getBlockNumber()).to.equal(21754847);
        });

        it("Should succeeed in userOne buying 1 ETH", async function () {
            const { minValuedTokenInfo, runningValueTotal } = await getData();

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

        let maxPossibleTokenValue = ethers.BigNumber.from("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff");
        it("Should succeed in userOne approving Main.sol to spend the maxPossibleTokenValue via approve()", async function () {
            await expect(deployment.userOneToken.approve(deployment.main.address, maxPossibleTokenValue)).to.not.be.reverted;
        });

        it("Should succeed in userOne selling 100 TIFDAO", async function () {
            const {
                activeTokens,
                activeSymbols,
                numOfActiveTokens
            } = await deployment.deployerMain.callStatic.getActiveTokens(0, 100);

            const { maxValuedTokenInfo, runningValueTotal } = await deployment.deployerMain.callStatic.getMaxValuedToken(
                activeTokens,
                tokenPrices,
                numOfActiveTokens,
                {
                    gasLimit: 30_000_000,
                }
            );

            const timestamp = Math.floor(Date.now() / 1000);
            const response = await fetch('http://localhost:5003/getSignedMessageSellTif', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    timestamp,
                    userAddress: deployment.userOne.address,
                    userTokensToBurn: ethers.utils.parseEther("100").toString(),
                    tokenAddress: maxValuedTokenInfo.tokenAddress,
                    tokenPrice: maxValuedTokenInfo.tokenPrice.toString(),
                    tokenAmount: maxValuedTokenInfo.tokenAmount.toString(),
                    tokenValue: maxValuedTokenInfo.tokenValue.toString(),
                    runningValueTotal: runningValueTotal.toString()
                })
            });
            const { signature } = await response.json();
        
            await expect(deployment.userOneMain.sell(
                signature,
                timestamp,
                ethers.utils.parseEther("100"),
                maxValuedTokenInfo,
                runningValueTotal
            )).to.not.be.reverted;
        });

        it("Should succeed in deployer removing LINK from the TIFDAO Index", async function () {
            await expect(deployment.deployerMain.removeTokenFromIndex("0x514910771AF9Ca656af840dff83E8264EcF986CA")).to.not.be.reverted;
        });

        it("Should succeed in userOne calling sellRemovedToken() with 50%", async function () {
            const removedTokenAddress = "0x514910771AF9Ca656af840dff83E8264EcF986CA";
            const timestamp = Math.floor(Date.now() / 1000);
            const response = await fetch('http://localhost:5003/getSignedMessageSellRemoved', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    timestamp, 
                    userAddress: deployment.userOne.address, 
                    removedToken: removedTokenAddress,
                    percentOfTokenToSell: "50", 
                    priceOfTokenInEth: tokenPrices[0].toString(),
                })
            });
            const { signature } = await response.json();

            await expect(deployment.userOneMain.sellRemovedToken(
                signature,
                timestamp,
                removedTokenAddress,
                50, 
                tokenPrices[0],
            )).to.not.be.reverted;
        });

        it("Should succeed in getting Main.sol contract balance", async function () {
            // 985 (eth balance estimate) * 0.9 (selling 10 percent of tokens) / 2 = 443 so 440 expected
            expect(await deployment.deployer.provider.getBalance(deployment.main.address)).to.equal("440597252477107157");
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
        
        it("Should succeed in getting Main.sol contract balance", async function () {
            expect(await deployment.deployer.provider.getBalance(deployment.main.address)).to.equal(0);
        });
        
        it("Should fail with InvalidSignature()", async function () {
            const { minValuedTokenInfo, runningValueTotal } = await getData();

            // Signature timestamp from 11 minutes ago
            const timestamp = Math.floor(Date.now() / 1000) - 660;
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

            // userTwo is calling while the signature was created for userOne
            await expect(deployment.userTwoMain.buy(
                signature,
                timestamp,
                minValuedTokenInfo,
                runningValueTotal,
                { value: ethers.utils.parseEther("1") }
            )).to.be.revertedWithCustomError(deployment.main, "InvalidSignature");
        });
        
        it("Should fail with SignatureExpired()", async function () {
            const { minValuedTokenInfo, runningValueTotal } = await getData();

            const latestBlock = await deployment.deployer.provider.getBlock("latest");
            const latestTimestamp = latestBlock.timestamp;
            // Signature timestamp from 11 minutes ago
            const timestamp = latestTimestamp - 660;
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
            )).to.be.revertedWithCustomError(deployment.main, "SignatureExpired");
        });
        
        it("Should fail with SignatureUsedBefore()", async function () {
            const { minValuedTokenInfo, runningValueTotal } = await getData();

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

            const tx = await deployment.userOneMain.buy(
                signature,
                timestamp,
                minValuedTokenInfo,
                runningValueTotal,
                { value: ethers.utils.parseEther("1") }
            );
            await tx.wait();

            // Use the same signature again
            await expect(deployment.userOneMain.buy(
                signature,
                timestamp,
                minValuedTokenInfo,
                runningValueTotal,
                { value: ethers.utils.parseEther("1") }
            )).to.be.revertedWithCustomError(deployment.main, "SignatureUsedBefore");
        });
        
        it("Should fail with InvalidSignatureLength()", async function () {
            const { minValuedTokenInfo, runningValueTotal } = await getData();

            const timestamp = Math.floor(Date.now() / 1000);
            // 66 bytes instead of 65
            const signature = "0x" + "00".repeat(66);

            await expect(deployment.userOneMain.buy(
                signature,
                timestamp,
                minValuedTokenInfo,
                runningValueTotal,
                { value: ethers.utils.parseEther("1") }
            )).to.be.revertedWithCustomError(deployment.main, "InvalidSignatureLength");
        });

        it("Should fail with InvalidValueS()", async function () {
            const { minValuedTokenInfo, runningValueTotal } = await getData();

            const timestamp = Math.floor(Date.now() / 1000);
            const signature = "0x59cbe5a60c44d4a9d97b8724187d5c1f20b6fc9786734c3f94d06dbcb5335b9acfffffffffffffffffffffffffffffff5d576e7357a4501ddfe92f46681b20a01b";

            await expect(deployment.userOneMain.buy(
                signature,
                timestamp,
                minValuedTokenInfo,
                runningValueTotal,
                { value: ethers.utils.parseEther("1") }
            )).to.be.revertedWithCustomError(deployment.main, "InvalidValueS");
        });
        
        it("Should fail with InvalidValueV()", async function () {
            const { minValuedTokenInfo, runningValueTotal } = await getData();

            const timestamp = Math.floor(Date.now() / 1000);
            // v = 00
            const signature = "0x" + "00".repeat(65);

            await expect(deployment.userOneMain.buy(
                signature,
                timestamp,
                minValuedTokenInfo,
                runningValueTotal,
                { value: ethers.utils.parseEther("1") }
            )).to.be.revertedWithCustomError(deployment.main, "InvalidValueV");
        });
    });
});
