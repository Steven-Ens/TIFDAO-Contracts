// Explicitly show the ethers import
const { ethers } = require("hardhat");
const { expect} = require("chai");
// Used to deploy contracts before running tests
const { deploy } = require("./deployment.js");

describe("Governance.sol", function () {
    before(async function () {
        deployment = await deploy();
    });
    
    describe("Governance Tests", function () {
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
    
        it("Should succeed in starting on the correct block number", async function () {
            expect(await ethers.provider.getBlockNumber()).to.equal(21754847);
        });


        it("Should fail in sending 1 ETH to the Governance.sol contract receive()", async function () {
            await expect(deployment.userOne.sendTransaction({ 
                to: deployment.governance.address, 
                value: ethers.utils.parseEther("1") }
            )).to.be.revertedWithCustomError(deployment.governance, "InvalidOperation");
        });

        it("Should succeeed in userOne buying 1 ETH before the delay period", async function () {
            const {
                activeTokens,
                activeSymbols,
                numOfActiveTokens
            } = await deployment.deployerMain.callStatic.getActiveTokens(0, 100);

            const { minValuedTokenInfo, runningValueTotal } = await deployment.deployerMain.callStatic.getMinValuedToken(
                activeTokens,
                tokenPrices.slice(0, 60),
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

            const tx = await deployment.userOneMain.buy(
                signature,
                timestamp,
                minValuedTokenInfo,
                runningValueTotal,
                { value: ethers.utils.parseEther("1") }
            );
            await tx.wait();
        });
        
        it("Should succeeed in userTwo buying 1 ETH before the delay period", async function () {
            const {
                activeTokens,
                activeSymbols,
                numOfActiveTokens
            } = await deployment.deployerMain.callStatic.getActiveTokens(0, 100);

            const { minValuedTokenInfo, runningValueTotal } = await deployment.deployerMain.callStatic.getMinValuedToken(
                activeTokens,
                tokenPrices.slice(0, 60),
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

            const tx = await deployment.userTwoMain.buy(
                signature,
                timestamp,
                minValuedTokenInfo,
                runningValueTotal,
                { value: ethers.utils.parseEther("1") }
            );
            await tx.wait();
        });

        it("Should succeed in delegating userOne to userTwo, and userTwo to userTwo via delegate()", async function () {
            await expect(deployment.userOneToken.delegate(deployment.userTwo.address)).to.not.be.reverted;
            await expect(deployment.userTwoToken.delegate(deployment.userTwo.address)).to.not.be.reverted;
        });
        
        it("Should succeed in returning the number of user votes before the delay period via getVotes()", async function () {
            let currentBlockNumber = await ethers.provider.getBlockNumber();
            await ethers.provider.send("evm_mine");
            
            expect(await deployment.userOneGovernance.getVotes(deployment.userOne.address, currentBlockNumber)).to.equal(0);
            expect(await deployment.userTwoGovernance.getVotes(deployment.userTwo.address, currentBlockNumber)).to.equal(ethers.BigNumber.from("1997827263988222311000"));
            expect(await deployment.userThreeGovernance.getVotes(deployment.userThree.address, currentBlockNumber)).to.equal(0);
        });

        // Testing Governance.sol
        // Added here so I don't have to change all the block numbers
        it("Should fail in calling relay()", async function () {
            await expect(deployment.deployerGovernance.relay(deployment.main.address, 0, "0x")).to.be.revertedWithCustomError(
            deployment.governance,
            "InvalidOperation"
            );
        });
       
        it("Should succeed in returning the votingDelay()", async function () {
            expect(await deployment.deployerGovernance.votingDelay()).to.equal(21600);
        });
            
        it("Should succeed in returning the votingPeriod()", async function () {
            expect(await deployment.deployerGovernance.votingPeriod()).to.equal(50400);
        });

        // Testing Governor.sol
        it("Should succeed returning the name of the Governance.sol contract via name()", async function () {
            expect(await deployment.deployerGovernance.name()).to.equal("Governance");
        });
        
        it("Should succeed returning the version of the Governor.sol contract through version()", async function () {
            expect(await deployment.deployerGovernance.version()).to.equal("1");
        });

        it("Should succeed returning the address of Token.sol through token()", async function () {
            expect(await deployment.deployerGovernance.token()).to.equal(deployment.token.address);
        });
        
        it("Should succeed in returning the proposalThreshold()", async function () {
            expect(await deployment.deployerGovernance.proposalThreshold()).to.equal(0);
        });

        // Testing GovernorCountingSimple.sol
        it("Should succeed in returning the COUNTING_MODE()", async function () {
            expect(await deployment.deployerGovernance.COUNTING_MODE()).to.equal("support=bravo&quorum=for,abstain"); 
        });
        
        // Testing ERC20Votes.sol
        it("Should succeed in returning the CLOCK_MODE()", async function () {
            expect(await deployment.deployerGovernance.CLOCK_MODE()).to.equal("mode=blocknumber&from=default"); 
        });

        // Testing GovernorVotesQuorumFraction.sol
        it("Should succeed in returning the quorumNumerator()", async function () {
            expect(await deployment.deployerGovernance["quorumNumerator()"]()).to.equal(4);
        });
            
        it("Should succeed in returning the quorumDenominator()", async function () {
            expect(await deployment.deployerGovernance.quorumDenominator()).to.equal(100);
        });
        
        it("Should fail in changing updateQuorumNumerator()", async function () {
            await expect(deployment.deployerGovernance.updateQuorumNumerator(1)).to.be.revertedWithCustomError(
                deployment.governance,
                "InvalidOperation");
        });

        // Testing GovernorPreventLateQuorum.sol
        it("Should succeed in returning the lateQuorumVoteExtension()", async function () {
            expect(await deployment.deployerGovernance.lateQuorumVoteExtension()).to.equal(14400);
        });

        it("Should fail in changing setLateQuorumVoteExtension()", async function () {
            await expect(deployment.deployerGovernance.setLateQuorumVoteExtension(1)).to.be.revertedWithCustomError(
                deployment.governance,
                "InvalidOperation");
        });

        // Create proposals
        const WBTC_ADDRESS = "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599";
        const WETH_ADDRESS = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
        const OM_ADDRESS = "0x3593D125a4f7849a1B059E64F4517A86Dd60c95d";
        const GNO_ADDRESS = "0x6810e776880C02933D47DB1b9fc05908e5386b96";
        const SHIB_ADDRESS = "0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE";
        const LINK_ADDRESS = "0x514910771AF9Ca656af840dff83E8264EcF986CA";
        const addToken = ethers.utils.id("addTokenToIndex(address)").slice(0, 10);
        const removeToken = ethers.utils.id("removeTokenFromIndex(address)").slice(0, 10);
        let proposalOneID;
        let proposalTwoID;
        let proposalThreeID;
        let proposalFourID;
        let proposalFiveID;
        
        it("Should fail in creating a proposal to addTokenToIndex() with the wrong proposal length", async function () {
            const payload = ethers.utils.hexConcat([
                addToken,
                ethers.utils.defaultAbiCoder.encode(
                    ["address"], 
                    [WBTC_ADDRESS] 
                )
            ])
            await expect(deployment.deployerGovernance.propose(
                [deployment.main.address, deployment.main.address], 
                [0, 0], 
                [payload, payload], 
                "Proposal 1")
            ).to.be.revertedWithCustomError(deployment.governance, "InvalidProposalQuantity");
        });

        it("Should fail in creating a proposal to addTokenToIndex() with the wrong target", async function () {
            const payload = ethers.utils.hexConcat([
                addToken,
                ethers.utils.defaultAbiCoder.encode(
                    ["address"], 
                    [WBTC_ADDRESS] 
                )
            ])
            await expect(deployment.deployerGovernance.propose(
                [deployment.deployer.address], 
                [0], 
                [payload], 
                "Proposal 1")
            ).to.be.revertedWithCustomError(deployment.governance, "InvalidProposalTarget");
        });
        
        it("Should fail in creating a proposal with the wrong function selector", async function () {
            const payload = ethers.utils.hexConcat([
                ethers.utils.id("test(address,string)").slice(0, 10),
                ethers.utils.defaultAbiCoder.encode(
                    ["address"], 
                    [WBTC_ADDRESS] 
                )
            ])
            await expect(deployment.deployerGovernance.propose(
                [deployment.main.address], 
                [0], 
                [payload], 
                "Proposal 1")
            ).to.be.revertedWithCustomError(deployment.governance, "InvalidFunctionSelector");
        });
        
        it("Should fail in creating a proposal with an invalid token", async function () {
            const payload = ethers.utils.hexConcat([
                addToken,
                ethers.utils.defaultAbiCoder.encode(
                    ["address"], 
                    [WETH_ADDRESS] 
                )
            ])
            await expect(deployment.deployerGovernance.propose(
                [deployment.main.address], 
                [0], 
                [payload], 
                "Proposal 1")
            ).to.be.revertedWithCustomError(deployment.governance, "InvalidProposalToken");
        });
        
        it("Should fail in creating a proposal with an invalid token symbol", async function () {
            const payload = ethers.utils.hexConcat([
                addToken,
                ethers.utils.defaultAbiCoder.encode(
                    ["address"], 
                    [deployment.governance.address] 
                )
            ])
            await expect(deployment.deployerGovernance.propose(
                [deployment.main.address], 
                [0], 
                [payload], 
                "Proposal 1")
            ).to.be.revertedWithCustomError(deployment.governance, "InvalidTokenSymbol");
        });
        
        it("Should fail in creating a proposal with a token with no Uniswap quote", async function () {
            const payload = ethers.utils.hexConcat([
                addToken,
                ethers.utils.defaultAbiCoder.encode(
                    ["address"], 
                    [OM_ADDRESS] 
                )
            ])
            await expect(deployment.deployerGovernance.propose(
                [deployment.main.address], 
                [0], 
                [payload], 
                "Proposal 1")
            ).to.be.revertedWithCustomError(deployment.governance, "InvalidUniswapQuote");
        });

        it("Should succeed in deployer creating a proposal to addTokenToIndex() with GNO", async function () {
            const payload = ethers.utils.hexConcat([
                addToken,
                ethers.utils.defaultAbiCoder.encode(
                    ["address"], 
                    [GNO_ADDRESS] 
                )
            ])
            await expect(deployment.deployerGovernance.propose(
                [deployment.main.address], 
                [0], 
                [payload], 
                "Add GNO")
            ).to.not.be.reverted;
            
            const description = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Add GNO")); 
            proposalOneID = await deployment.deployerGovernance.hashProposal(
                [deployment.main.address], 
                [0], 
                [payload],
                description
            );
        });

        it("Should succeed in userOne creating a proposal to addTokenToIndex() with WBTC", async function () {
            const payload = ethers.utils.hexConcat([
                addToken,
                ethers.utils.defaultAbiCoder.encode(
                    ["address"], 
                    [WBTC_ADDRESS] 
                )
            ])
            await expect(deployment.userOneGovernance.propose(
                [deployment.main.address], 
                [0], 
                [payload], 
                "Add WBTC")
            ).to.not.be.reverted;
            
            const description = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Add WBTC")); 
            proposalTwoID = await deployment.userOneGovernance.hashProposal(
                [deployment.main.address], 
                [0], 
                [payload],
                description
            );
        });
        
        it("Should succeed in userTwo creating a proposal to removeTokenFromIndex() with SHIB", async function () {
            const payload = ethers.utils.hexConcat([
                removeToken,
                ethers.utils.defaultAbiCoder.encode(
                    ["address"], 
                    [SHIB_ADDRESS] 
                )
            ])
            await expect(deployment.userTwoGovernance.propose(
                [deployment.main.address], 
                [0], 
                [payload], 
                "Remove SHIB")
            ).to.not.be.reverted;
            
            const description = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Remove SHIB")); 
            proposalThreeID = await deployment.userTwoGovernance.hashProposal(
                [deployment.main.address], 
                [0], 
                [payload],
                description
            );
        });

        it("Should succeed in userThree creating a proposal to removeTokenFromIndex() with LINK", async function () {
            const payload = ethers.utils.hexConcat([
                removeToken,
                ethers.utils.defaultAbiCoder.encode(
                    ["address"], 
                    [LINK_ADDRESS] 
                )
            ])
            await expect(deployment.userThreeGovernance.propose(
                [deployment.main.address], 
                [0], 
                [payload], 
                "Remove LINK")
            ).to.not.be.reverted;
            
            const description = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Remove LINK")); 
            proposalFourID = await deployment.userThreeGovernance.hashProposal(
                [deployment.main.address], 
                [0], 
                [payload],
                description
            );
        });
   
        it("Should succeed in deployer creating a proposal to addTokenToIndex() with GNO again", async function () {
            const payload = ethers.utils.hexConcat([
                addToken,
                ethers.utils.defaultAbiCoder.encode(
                    ["address"], 
                    [GNO_ADDRESS] 
                )
            ]);
            await expect(deployment.deployerGovernance.propose(
                [deployment.main.address], 
                [0], 
                [payload], 
                "TEST"
            )).to.not.be.reverted;
            
            const description = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("TEST")); 
            proposalFiveID = await deployment.deployerGovernance.hashProposal(
                [deployment.main.address], 
                [0], 
                [payload],
                description
            );
        });
        
        it("Should fail in creating the same proposal twice", async function () {
            const payload = ethers.utils.hexConcat([
                addToken,
                ethers.utils.defaultAbiCoder.encode(
                    ["address"], 
                    [GNO_ADDRESS] 
                )
            ])
            await expect(deployment.deployerGovernance.propose(
                [deployment.main.address], 
                [0], 
                [payload], 
                "TEST")
            ).to.be.revertedWith("Governor: proposal already exists");
        });

        
        it("Should fail in userOne cancelling the second proposal to addTokenToIndex() with GNO", async function () {
            const payload = ethers.utils.hexConcat([
                addToken,
                ethers.utils.defaultAbiCoder.encode(
                    ["address"], 
                    [GNO_ADDRESS] 
                )
            ]);
            const description = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("TEST")); 
            await expect(deployment.userOneGovernance.cancel(
                [deployment.main.address], 
                [0], 
                [payload], 
                description
           )).to.be.revertedWith("Governor: only proposer can cancel");
        });
        
        it("Should succeed in deployer cancelling the second proposal to addTokenToIndex() with GNO", async function () {
            const payload = ethers.utils.hexConcat([
                addToken,
                ethers.utils.defaultAbiCoder.encode(
                    ["address"], 
                    [GNO_ADDRESS] 
                )
            ]);
            const description = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("TEST")); 
            await expect(deployment.deployerGovernance.cancel(
                [deployment.main.address], 
                [0], 
                [payload], 
                description
           )).to.not.be.reverted;
        });
        
        // 0 = Pending, 1 = Active, 2 = Canceled, 3 = Defeated, 4 = Succeeded, 5 = Queued, 6 = Expired, 7 = Executed
        it("Should succeed in viewing the current state() of proposal five", async function () {
            expect(await deployment.deployerGovernance.state(proposalFiveID)).to.equal(2);
        });

        it("Should succeed in getting the proposalSnapshot() of proposal one", async function () {
            expect(await deployment.deployerGovernance.proposalSnapshot(proposalOneID)).to.equal(21776460);
        });
        
        it("Should succeed in getting the proposalSnapshot() of proposal two", async function () {
            expect(await deployment.userOneGovernance.proposalSnapshot(proposalTwoID)).to.equal(21776461);
        });
        
        it("Should succeed in getting the proposalSnapshot() of proposal three", async function () {
            expect(await deployment.userTwoGovernance.proposalSnapshot(proposalThreeID)).to.equal(21776462);
        });
        
        it("Should succeed in getting the proposalSnapshot() of proposal four", async function () {
            expect(await deployment.userThreeGovernance.proposalSnapshot(proposalFourID)).to.equal(21776463);
        });

        it("Should succeed in getting the proposlProposer() of proposal one", async function () {
            expect(await deployment.deployerGovernance.proposalProposer(proposalOneID)).to.equal(deployment.deployer.address); 
        });
       
        it("Should succeed in getting the proposlProposer() of proposal two", async function () {
            expect(await deployment.deployerGovernance.proposalProposer(proposalTwoID)).to.equal(deployment.userOne.address); 
        });
       
        it("Should succeed in getting the proposlProposer() of proposal three", async function () {
            expect(await deployment.deployerGovernance.proposalProposer(proposalThreeID)).to.equal(deployment.userTwo.address); 
        });
       
        it("Should succeed in getting the proposlProposer() of proposal four", async function () {
            expect(await deployment.deployerGovernance.proposalProposer(proposalFourID)).to.equal(deployment.userThree.address); 
        });
       
        const oneWeekInBlocks = 50400;
        it("Should succeed in getting the proposalDeadline() of proposal one", async function () {
            proposalOneDeadline = await deployment.deployerGovernance.proposalDeadline(proposalOneID);
            expect(proposalOneDeadline).to.equal(21826860);
            // Subtract the proposal snapshot block from the proposal deadline block
            proposalOneDuration = proposalOneDeadline - 21776460;
            expect(proposalOneDuration).to.equal(oneWeekInBlocks);
        });
        
        it("Should succeed in getting the proposalDeadline() of proposal two", async function () {
            proposalTwoDeadline = await deployment.userOneGovernance.proposalDeadline(proposalTwoID);
            expect(proposalTwoDeadline).to.equal(21826861);
            proposalTwoDuration = proposalTwoDeadline - 21776461;
            expect(proposalTwoDuration).to.equal(oneWeekInBlocks);
        });
        
        it("Should succeed in getting the proposalDeadline() of proposal three", async function () {
            proposalThreeDeadline = await deployment.userTwoGovernance.proposalDeadline(proposalThreeID);
            expect(proposalThreeDeadline).to.equal(21826862);
            proposalThreeDuration = proposalThreeDeadline - 21776462;
            expect(proposalThreeDuration).to.equal(oneWeekInBlocks);
        });

        it("Should succeed in getting the proposalDeadline() of proposal four", async function () {
            proposalFourDeadline = await deployment.userThreeGovernance.proposalDeadline(proposalFourID);
            expect(proposalFourDeadline).to.equal(21826863);
            proposalFourDuration = proposalFourDeadline - 21776463;
            expect(proposalFourDuration).to.equal(oneWeekInBlocks);
        });

        it("Should fail in casting votes for proposal one during the three day delay period", async function () {
            await expect(deployment.deployerGovernance.castVote(proposalOneID, 0)).to.be.revertedWith(
                "Governor: vote not currently active"
            );
        });
        
        it("Should fail in casting votes for proposal two during the three day delay period", async function () {
            await expect(deployment.userOneGovernance.castVote(proposalTwoID, 0)).to.be.revertedWith(
                "Governor: vote not currently active"
            );
        });
        
        it("Should fail in casting votes for proposal three during the three day delay period", async function () {
            await expect(deployment.userTwoGovernance.castVote(proposalThreeID, 0)).to.be.revertedWith(
                "Governor: vote not currently active"
            );
        });

        it("Should fail in casting votes for proposal four during the three day delay period", async function () {
            await expect(deployment.userThreeGovernance.castVote(proposalFourID, 0)).to.be.revertedWith(
                "Governor: vote not currently active"
            );
        });

        it("Should succeeed in userThree buying 1 ETH during the delay period", async function () {
            const {
                activeTokens,
                activeSymbols,
                numOfActiveTokens
            } = await deployment.deployerMain.callStatic.getActiveTokens(0, 100);

            const { minValuedTokenInfo, runningValueTotal } = await deployment.deployerMain.callStatic.getMinValuedToken(
                activeTokens,
                tokenPrices.slice(0, 60),
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

            const tx = await deployment.userThreeMain.buy(
                signature,
                timestamp,
                minValuedTokenInfo,
                runningValueTotal,
                { value: ethers.utils.parseEther("1") }
            );
            await tx.wait();
        });

        it("Should succeed in delegating userOne's votes to userOne, and userThree's votes to userThree", async function () {
            await expect(deployment.userOneToken.delegate(deployment.userOne.address)).to.not.be.reverted;
            await expect(deployment.userThreeToken.delegate(deployment.userThree.address)).to.not.be.reverted;
        });
        
        it("Should succeed in getting the number of user votes in the delay period via getVotes()", async function () {
            let currentBlockNumber = await ethers.provider.getBlockNumber();
            await ethers.provider.send("evm_mine");
             
            expect(await deployment.userOneGovernance.getVotes(deployment.userOne.address, currentBlockNumber)).to.equal(
                ethers.BigNumber.from("1000000000000000000000")
            );
            expect(await deployment.userTwoGovernance.getVotes(deployment.userTwo.address, currentBlockNumber)).to.equal(
                ethers.BigNumber.from("997827263988222311000")
            );
            expect(await deployment.userThreeGovernance.getVotes(deployment.userThree.address, currentBlockNumber)).to.equal(
                ethers.BigNumber.from("997569128916859924708")
            );
        });

        it("Should succeed in passing three days of time in blocks to get into the voting period", async function () {
            for (let i = 0; i < 21600; i++) {
                await ethers.provider.send("evm_mine");
            }
        });

        // 0 against, 1 for, 2 abstain
        it("Should succeed in casting votes via castVote() for proposal one", async function () {
            await expect(deployment.userOneGovernance.castVote(proposalOneID, 1)).to.not.be.reverted;
            await expect(deployment.userTwoGovernance.castVote(proposalOneID, 0)).to.not.be.reverted;
            await expect(deployment.userThreeGovernance.castVote(proposalOneID, 0)).to.not.be.reverted;
        });
        
        it("Should succeed in casting votes via castVote() for proposal two", async function () {
            await expect(deployment.userOneGovernance.castVote(proposalTwoID, 2)).to.not.be.reverted;
            await expect(deployment.userTwoGovernance.castVote(proposalTwoID, 1)).to.not.be.reverted;
            await expect(deployment.userThreeGovernance.castVote(proposalTwoID, 0)).to.not.be.reverted;
        });
        
        it("Should succeed in casting votes via castVote() for proposal three", async function () {
            await expect(deployment.userOneGovernance.castVote(proposalThreeID, 2)).to.not.be.reverted;
            await expect(deployment.userTwoGovernance.castVote(proposalThreeID, 1)).to.not.be.reverted;
            await expect(deployment.userThreeGovernance.castVote(proposalThreeID, 0)).to.not.be.reverted;
        });

        it("Should fail in casting votes for proposal one again after already doing so", async function () {
            await expect(deployment.userOneGovernance.castVote(proposalOneID, 0)).to.be.revertedWith(
                "GovernorVotingSimple: vote already cast"
            );
        });
        
        it("Should fail in casting votes for proposal two again after already doing so", async function () {
            await expect(deployment.userTwoGovernance.castVote(proposalTwoID, 0)).to.be.revertedWith(
                "GovernorVotingSimple: vote already cast"
            );
        });

        it("Should fail in casting votes for proposal three again after already doing so", async function () {
            await expect(deployment.userThreeGovernance.castVote(proposalThreeID, 0)).to.be.revertedWith(
                "GovernorVotingSimple: vote already cast"
            );
        });

        it("Should succeed in showing whether or not each user voted in proposal one", async function () {
            expect(await deployment.userOneGovernance.hasVoted(proposalOneID, deployment.userOne.address)).to.equal(true);
            expect(await deployment.userTwoGovernance.hasVoted(proposalOneID, deployment.userTwo.address)).to.equal(true);
            expect(await deployment.userOneGovernance.hasVoted(proposalOneID, deployment.userThree.address)).to.equal(true);
        });

        it("Should succeed in showing whether or not each user voted in proposal two", async function () {
            expect(await deployment.userOneGovernance.hasVoted(proposalTwoID, deployment.userOne.address)).to.equal(true);
            expect(await deployment.userTwoGovernance.hasVoted(proposalTwoID, deployment.userTwo.address)).to.equal(true);
            expect(await deployment.userOneGovernance.hasVoted(proposalTwoID, deployment.userThree.address)).to.equal(true);
        });

        it("Should succeed in showing whether or not each user voted in proposal three", async function () {
            expect(await deployment.userOneGovernance.hasVoted(proposalThreeID, deployment.userOne.address)).to.equal(true);
            expect(await deployment.userTwoGovernance.hasVoted(proposalThreeID, deployment.userTwo.address)).to.equal(true);
            expect(await deployment.userOneGovernance.hasVoted(proposalThreeID, deployment.userThree.address)).to.equal(true);
        });
        
        it("Should succeed in showing proposalVotes() for proposal one", async function () {
            proposalOneVotes = await deployment.deployerGovernance.proposalVotes(proposalOneID);
            expect(proposalOneVotes.againstVotes).to.equal(ethers.BigNumber.from("1995396392905082235708"));
            expect(proposalOneVotes.forVotes).to.equal(ethers.BigNumber.from("1000000000000000000000"));
            expect(proposalOneVotes.abstainVotes).to.equal(0);
        });
        
        it("Should succeed in showing proposalVotes() for proposal two", async function () {
            proposalTwoVotes = await deployment.userOneGovernance.proposalVotes(proposalTwoID);
            expect(proposalTwoVotes.againstVotes).to.equal(ethers.BigNumber.from("997569128916859924708"));
            expect(proposalTwoVotes.forVotes).to.equal(ethers.BigNumber.from("997827263988222311000"));
            expect(proposalTwoVotes.abstainVotes).to.equal(ethers.BigNumber.from("1000000000000000000000"));
        });
        
        it("Should succeed in showing proposalVotes() for proposal three", async function () {
            proposalThreeVotes = await deployment.userTwoGovernance.proposalVotes(proposalThreeID);
            expect(proposalThreeVotes.againstVotes).to.equal(ethers.BigNumber.from("997569128916859924708"));
            expect(proposalThreeVotes.forVotes).to.equal(ethers.BigNumber.from("997827263988222311000"));
            expect(proposalThreeVotes.abstainVotes).to.equal(ethers.BigNumber.from("1000000000000000000000"));
        });
        
        it("Should succeed in showing proposalVotes() for proposal four", async function () {
            proposalFourVotes = await deployment.userThreeGovernance.proposalVotes(proposalFourID);
            expect(proposalFourVotes.againstVotes).to.equal(0);
            expect(proposalFourVotes.forVotes).to.equal(0);
            expect(proposalFourVotes.abstainVotes).to.equal(0);
        });

        it("Should succeed in returning the quorum() based on the current totalSupply()", async function () {
            expect(await deployment.deployerToken.totalSupply()).to.equal(ethers.BigNumber.from("2995396392905082235708"));
            // Mine the block of currentBlockNumber
            currentBlockNumber = await ethers.provider.getBlockNumber();
            await ethers.provider.send("evm_mine");

            expect(await deployment.deployerGovernance.quorum(currentBlockNumber)).to.equal(
                ethers.BigNumber.from("119815855716203289428")
            );
        });

        // 0 = Pending, 1 = Active, 2 = Canceled, 3 = Defeated, 4 = Succeeded, 5 = Queued, 6 = Expired, 7 = Executed
        it("Should succeed in viewing the current state() of proposal one", async function () {
            expect(await deployment.deployerGovernance.state(proposalOneID)).to.equal(1);
        });

        it("Should succeed in viewing the current state() of proposal two", async function () {
            expect(await deployment.userOneGovernance.state(proposalTwoID)).to.equal(1);
        });

        it("Should succeed in viewing the current state() of proposal three", async function () {
            expect(await deployment.userTwoGovernance.state(proposalThreeID)).to.equal(1);
        });

        it("Should succeed in viewing the current state() of proposal four", async function () {
            expect(await deployment.userThreeGovernance.state(proposalFourID)).to.equal(1);
        });

        it("Should succeed in passing 6 days in blocks", async function () {
            for (let i = 0; i < 43200; i++)
                await ethers.provider.send("evm_mine");
        });

        it("Should succeed in showing the original proposal deadline hasn't changed for proposal four", async function () {
            currentProposalDeadline = await deployment.userThreeGovernance.proposalDeadline(proposalFourID);
            expect(currentProposalDeadline).to.equal(21826863);
        });

        // 0 against, 1 for, 2 abstain
        it("Should succeed in userOne casting votes via castVote() for proposal four and hitting the quorum causing an extension of proposalDeadline()", async function () {
            await expect(deployment.userOneGovernance.castVote(proposalFourID, 1)).to.not.be.reverted;
        });
        
        it("Should succeed in showing the updated proposal four proposalDeadline() with the two day extension", async function () {
            currentBlockNumber = await ethers.provider.getBlockNumber();

            twoDaysInBlocks = 14400;

            currentProposalDeadline = await deployment.userOneGovernance.proposalDeadline(proposalFourID);
            expect(currentProposalDeadline).to.equal(21834089);

            expect(currentBlockNumber + twoDaysInBlocks).to.equal(currentProposalDeadline);
        });

        it("Should fail in casting votes for proposal four after already doing so", async function () {
            await expect(deployment.userOneGovernance.castVote(proposalFourID, 1)).to.be.revertedWith(
                "GovernorVotingSimple: vote already cast"
            );
        });
       
        it("Should succeed in passing 1 day in blocks", async function () {
            for (let i = 0; i < 7200; i++)
                await ethers.provider.send("evm_mine");
        });
     
        // 0 = Pending, 1 = Active, 2 = Canceled, 3 = Defeated, 4 = Succeeded, 5 = Queued, 6 = Expired, 7 = Executed
        it("Should succeed in viewing the current state() of proposal one", async function () {
            expect(await deployment.deployerGovernance.state(proposalOneID)).to.equal(3);
        });

        it("Should succeed in viewing the current state() of proposal two", async function () {
            expect(await deployment.userOneGovernance.state(proposalTwoID)).to.equal(4);
        });

        it("Should succeed in viewing the current state() of proposal three", async function () {
            expect(await deployment.userTwoGovernance.state(proposalThreeID)).to.equal(4);
        });

        it("Should succeed in viewing the current state() of proposal four", async function () {
            expect(await deployment.userThreeGovernance.state(proposalFourID)).to.equal(1);
        });


        it("Should succeed in showing whether userOne voted in proposal four", async function () {
            expect(await deployment.userOneGovernance.hasVoted(proposalFourID, deployment.userOne.address)).to.equal(true);
        });
        
        // Plus the one day above this passes the two days of extended deadline for proposalFourID
        it("Should succeed in passing 1 day in blocks", async function () {
            for (let i = 0; i < 7200; i++)
                await ethers.provider.send("evm_mine");
        });
     
        it("Should succeed in viewing the current state() of proposal four", async function () {
            expect(await deployment.userThreeGovernance.state(proposalFourID)).to.equal(4);
        });

        it("Should succeed in showing proposalVotes() for proposal four", async function () {
            proposalFourVotes = await deployment.userThreeGovernance.proposalVotes(proposalFourID);
            expect(proposalFourVotes.againstVotes).to.equal(0);
            expect(proposalFourVotes.forVotes).to.equal(ethers.BigNumber.from("1000000000000000000000"));
            expect(proposalFourVotes.abstainVotes).to.equal(0);
        });

        
        it("Should fail in executing proposal one", async function () {
            const payload = ethers.utils.hexConcat([
                addToken,
                ethers.utils.defaultAbiCoder.encode(
                    ["address"], 
                    [GNO_ADDRESS] 
                )
            ])
            const description = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Add GNO"));

            await expect(deployment.deployerGovernance.execute(
                [deployment.main.address], 
                [0], 
                [payload], 
                description
            )).to.be.revertedWith("Governor: proposal not successful");
        });

        it("Should succeed in executing proposal two", async function () {
            const payload = ethers.utils.hexConcat([
                addToken,
                ethers.utils.defaultAbiCoder.encode(
                    ["address"], 
                    [WBTC_ADDRESS] 
                )
            ])
            const description = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Add WBTC"));

            await expect(deployment.userOneGovernance.execute(
                [deployment.main.address], 
                [0], 
                [payload], 
                description
            )).to.not.be.reverted;
        });

        it("Should succeed in showing getActiveTokens() has been modified to 61", async function () {
            const {
                activeTokens,
                activeSymbols,
                numOfActiveTokens
            } = await deployment.deployerMain.callStatic.getActiveTokens(0, 100);

            expect(numOfActiveTokens).to.equal(61);
        });

        it("Should succeed in executing proposal three", async function () {
            const payload = ethers.utils.hexConcat([
                removeToken,
                ethers.utils.defaultAbiCoder.encode(
                    ["address"], 
                    [SHIB_ADDRESS] 
                )
            ])
            const description = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Remove SHIB"));

            await expect(deployment.userTwoGovernance.execute(
                [deployment.main.address], 
                [0], 
                [payload], 
                description
            )).to.not.be.reverted;
        });
        
        it("Should fail in executing proposal four the first time", async function () {
            const payload = ethers.utils.hexConcat([
                removeToken,
                ethers.utils.defaultAbiCoder.encode(
                    ["address"], 
                    [LINK_ADDRESS] 
                )
            ])
            const description = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Remove LINK"));

            await expect(deployment.userThreeGovernance.execute(
                [deployment.main.address], 
                [0], 
                [payload], 
                description
            )).to.be.revertedWithCustomError(deployment.main, "RemovalLimitReached");
        });

        it("Should succeed in passing 1 week in blocks", async function () {
            for (let i = 0; i < 50400; i++)
                await ethers.provider.send("evm_mine");
        });

        it("Should succeed in executing proposal four after waiting a week", async function () {
            const payload = ethers.utils.hexConcat([
                removeToken,
                ethers.utils.defaultAbiCoder.encode(
                    ["address"], 
                    [LINK_ADDRESS] 
                )
            ])
            const description = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Remove LINK"));

            await expect(deployment.userThreeGovernance.execute(
                [deployment.main.address], 
                [0], 
                [payload], 
                description
            )).to.not.be.reverted;
        });

        let afterExecutionBlockNumber;
        it("Should succeed in saving the block number after proposalexecution", async function () {
            afterExecutionBlockNumber = await ethers.provider.getBlockNumber();
            await ethers.provider.send("evm_mine");
        });

        // 0 = Pending, 1 = Active, 2 = Canceled, 3 = Defeated, 4 = Succeeded, 5 = Queued, 6 = Expired, 7 = Executed
        it("Should succeed in viewing the current state() of proposal one", async function () {
            expect(await deployment.deployerGovernance.state(proposalOneID)).to.equal(3);
        });
       
        it("Should succeed in viewing the current state() of proposal two", async function () {
            expect(await deployment.userOneGovernance.state(proposalTwoID)).to.equal(7);
        });
        
        it("Should succeed in viewing the current state() of proposal three", async function () {
            expect(await deployment.userTwoGovernance.state(proposalThreeID)).to.equal(7);
        });
       
        it("Should succeed in viewing the current state() of proposal four", async function () {
            expect(await deployment.userThreeGovernance.state(proposalFourID)).to.equal(7);
        });

        it("Should succeed in returning the number of delegation checkpoints for users via numCheckpoints()", async function () {
            expect(await deployment.userOneToken.numCheckpoints(deployment.userOne.address)).to.equal(1);
            expect(await deployment.userTwoToken.numCheckpoints(deployment.userTwo.address)).to.equal(3);
            expect(await deployment.userThreeToken.numCheckpoints(deployment.userThree.address)).to.equal(1);
        });   

        it("Should succeed in returning the delegation checkpoints via checkpoints()", async function () {
            // userOne delegates to userTwo
            userTwoCheckpointOne = await deployment.userTwoToken.checkpoints(deployment.userTwo.address, 0);
            expect(userTwoCheckpointOne.votes).to.equal(ethers.BigNumber.from("1000000000000000000000"));
            // userTwo delates to userTwo 
            userTwoCheckpointTwo = await deployment.userTwoToken.checkpoints(deployment.userTwo.address, 1);
            expect(userTwoCheckpointTwo.votes).to.equal(ethers.BigNumber.from("1997827263988222311000"));
            // UserOne delegates back to userOne 
            userTwoCheckpointThree = await deployment.userTwoToken.checkpoints(deployment.userTwo.address, 2);
            expect(userTwoCheckpointThree.votes).to.equal(ethers.BigNumber.from("997827263988222311000"));
        });   

        it("Should return the delates of each user via delegates()", async function () {
            expect(await deployment.userOneToken.delegates(deployment.userOne.address)).to.equal(
                deployment.userOne.address
            );
            expect(await deployment.userTwoToken.delegates(deployment.userTwo.address)).to.equal(
                deployment.userTwo.address
            );
            expect(await deployment.userThreeToken.delegates(deployment.userThree.address)).to.equal(
                deployment.userThree.address
            );
        });   
        
        it("Should succeed in returning the past votes of users via getPastVotes()", async function () {
            expect(await deployment.userOneToken.getPastVotes(
                deployment.userOne.address, 
                afterExecutionBlockNumber)
            ).to.equal(ethers.BigNumber.from("1000000000000000000000"));
            expect(await deployment.userTwoToken.getPastVotes(
                deployment.userTwo.address, 
                afterExecutionBlockNumber)
            ).to.equal(ethers.BigNumber.from("997827263988222311000"));
            expect(await deployment.userThreeToken.getPastVotes(
                deployment.userThree.address, 
                afterExecutionBlockNumber)
            ).to.equal(ethers.BigNumber.from("997569128916859924708"));
        });   
        
        it("Should succeed in providing past totalSupply()", async function () {
            expect(await deployment.deployerToken.getPastTotalSupply(afterExecutionBlockNumber)).to.equal(
                ethers.BigNumber.from("2995396392905082235708")
            );
        });   
    });
});
