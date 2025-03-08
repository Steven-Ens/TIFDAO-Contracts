// Explicitly show the ethers import
const { ethers } = require("hardhat");
const { expect } = require("chai");
// Used to deploy contracts before running tests                             
const { deploy } = require("./deployment.js");

describe("Token.sol", function () {
    before(async function () {
        deployment = await deploy();
    });

    describe("Token Tests", function () {
        const tokenPrices = [
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

        const DEFAULT_ADMIN_ROLE = "0x0000000000000000000000000000000000000000000000000000000000000000";

        it("Should succeed in starting on the correct block number", async function () {
            expect(await ethers.provider.getBlockNumber()).to.equal(21754847);
        });

        it("Should fail in userOne sending 1 ETH to Token.sol", async function () {  
            await expect(deployment.userOne.sendTransaction(
                { to: deployment.token.address, value: ethers.utils.parseEther("1") }
            )).to.be.revertedWithoutReason();
            
            expect(await ethers.provider.getBalance(deployment.token.address)).to.equal(0); 
        });   

        it("Should fail in userOne calling mint()", async function () {  
            await expect(deployment.userOneToken.mint(deployment.userOne.address, 1)).to.be.revertedWith(
                "AccessControl: account 0x70997970c51812dc3a010c7d01b50e0d17dc79c8 is missing role 0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6"
            );
        });
        
        it("Should succeed in deployer calling hasRole()", async function () {  
            expect(await deployment.deployerToken.hasRole(DEFAULT_ADMIN_ROLE, deployment.deployer.address)).to.equal(false);
        });
        
        it("Should fail in deployer calling grantRole()", async function () {  
            await expect(deployment.deployerToken.grantRole(DEFAULT_ADMIN_ROLE, deployment.deployer.address)).to.be.revertedWith(
                "AccessControl: account 0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266 is missing role 0x0000000000000000000000000000000000000000000000000000000000000000"
            );
        });

        it("Should succeed in calling decimals()", async function () {  
            expect(await deployment.userOneToken.decimals()).to.equal(18);
        })
        
        it("Should succeed in calling name()", async function () {  
            expect(await deployment.userOneToken.name()).to.equal("Token Index Fund DAO");
        })
        
        it("Should succeed in calling symbol()", async function () {  
            expect(await deployment.userOneToken.symbol()).to.equal("TIFDAO");
        })

        it("Should succeed in userOne buying TIF()", async function () {  
            const { 
                activeTokens, 
                activeSymbols, 
                numOfActiveTokens
            } = await deployment.deployerMain.callStatic.getActiveTokens(0, 100);

            const { minValuedTokenInfo, runningValueTotal } = await deployment.deployerMain.callStatic.getMinValuedToken(
                activeTokens,
                tokenPrices.slice(0, 60),
                numOfActiveTokens,
                ethers.utils.parseEther("0.001"),
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

            const tx = await deployment.userOneMain.buy(
                signature,
                timestamp,
                minValuedTokenInfo,
                runningValueTotal,
                { value: ethers.utils.parseEther("0.001") }
            );
            await tx.wait()
        });
        
        it("Should succeed in calling totalSupply()", async function () {  
            expect(await deployment.userOneToken.totalSupply()).to.equal(ethers.utils.parseEther("1000"));
        });
        
        it("Should succeed in calling balanceOf() userOne", async function () {  
            expect(await deployment.userOneToken.balanceOf(deployment.userOne.address)).to.equal(
                ethers.utils.parseEther("1000")
            );
        });
        
        it("Should succeed in userOne calling burn()", async function () {  
            expect(await deployment.userOneToken.burn(ethers.utils.parseEther("100"))).to.not.be.reverted;
        });
        
        it("Should succeed in calling balanceOf() userOne", async function () {  
            expect(await deployment.userOneToken.balanceOf(deployment.userOne.address)).to.equal(
                ethers.utils.parseEther("900")
            );
        });
        
        it("Should succeed in userOne transferring to userTwo", async function () {  
            expect(await deployment.userOneToken.transfer(
                deployment.userTwo.address, 
                ethers.utils.parseEther("100")
            )).to.not.be.reverted;
        });
        
        it("Should succeed in calling balanceOf() userOne", async function () {  
            expect(await deployment.userOneToken.balanceOf(deployment.userOne.address)).to.equal(
                ethers.utils.parseEther("800")
            );
        });
        
        it("Should succeed in calling balanceOf() userTwo", async function () {  
            expect(await deployment.userOneToken.balanceOf(deployment.userTwo.address)).to.equal(
                ethers.utils.parseEther("100")
            );
        });
        
        it("Should succeed in userOne approving to userTwo", async function () {  
            expect(await deployment.userOneToken.approve(
                deployment.userTwo.address, 
                ethers.utils.parseEther("200")
            )).to.not.be.reverted;
        });
        
        it("Should succeed in getting allowance() of userTwo", async function () {  
            expect(await deployment.userOneToken.allowance(deployment.userOne.address, deployment.userTwo.address)).to.equal(
                ethers.utils.parseEther("200")
            );
        });
        
        it("Should succeed in userTwo calling burnFrom()", async function () {  
            expect(await deployment.userTwoToken.burnFrom(
                deployment.userOne.address, 
                ethers.utils.parseEther("100")
            )).to.not.be.reverted;
        });
        
        it("Should succeed in calling balanceOf() userOne", async function () {  
            expect(await deployment.userOneToken.balanceOf(deployment.userOne.address)).to.equal(
                ethers.utils.parseEther("700")
            );
        });

        it("Should succeed in userTwo calling transferFrom()", async function () {  
            expect(await deployment.userTwoToken.transferFrom(
                deployment.userOne.address, 
                deployment.userTwo.address, 
                ethers.utils.parseEther("100")
            )).to.not.be.reverted;
        });
        
        it("Should succeed in calling balanceOf() userOne", async function () {  
            expect(await deployment.userOneToken.balanceOf(deployment.userOne.address)).to.equal(
                ethers.utils.parseEther("600")
            );
        });
        
        it("Should succeed in calling balanceOf() userTwo", async function () {  
            expect(await deployment.userTwoToken.balanceOf(deployment.userTwo.address)).to.equal(
                ethers.utils.parseEther("200")
            );
        });  
        
        it("Should succeed in getting allowance() of userTwo", async function () {  
            expect(await deployment.userOneToken.allowance(deployment.userOne.address, deployment.userTwo.address)).to.equal(
                0
            );
        });
        
        it("Should succeed in calling totalSupply()", async function () {  
            expect(await deployment.userOneToken.totalSupply()).to.equal(ethers.utils.parseEther("800"));
        });
    });
});
