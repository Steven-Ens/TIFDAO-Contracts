// Explicitly show the ethers import
const { ethers } = require("hardhat");
const { expect } = require("chai");
// Used to deploy contracts before running tests                             
const { deploy } = require("./deployment.js");

// Utils.sol functions set to public for testing only
describe("Utils.sol", function () {
    before(async function () {
        deployment = await deploy();
    });
    
    it("Should succeed in starting on the correct block number", async function () {
        expect(await ethers.provider.getBlockNumber()).to.equal(21754847);
    });

    describe("_bytesToUint256() Tests", function () {
        it("Should fail by triggering the hex data odd-length error", async function () {
            const bytesValue = "0x000000000000000000000000000000000000000000000000000000000000000"; 
            await expect(deployment.userOneMain.callStatic._bytesToUint256(bytesValue)).to.be.rejected;
        });
        
        it("Should fail as length is 64 including the 0x", async function () {
            const bytesValue = "0x00000000000000000000000000000000000000000000000000000000000000"; 
            await expect(deployment.userOneMain.callStatic._bytesToUint256(bytesValue)).to.be.revertedWithCustomError(
                deployment.main, 
                "ReadOutOfBounds"
            );
        });
        
        it("Should fail as length is 68 including the 0x", async function () {
            const bytesValue = "0x000000000000000000000000000000000000000000000000000000000000000000"; 
            await expect(deployment.userOneMain.callStatic._bytesToUint256(bytesValue)).to.be.revertedWithCustomError(
                deployment.main, 
                "ReadOutOfBounds"
            );
        });
        
        it("Should succeed in converting the balance", async function () {
            const bytesValue = "0x0000000000000000000000000000000000000000000000000000000000000000"; 
            const result = await deployment.userOneMain.callStatic._bytesToUint256(bytesValue);
            expect(result).to.equal("0");
        });
        
        it("Should succeed in converting the balance", async function () {
            const bytesValue = "0x0000000000000000000000000000000000000000000000000000000000000001"; 
            const result = await deployment.userOneMain.callStatic._bytesToUint256(bytesValue);
            expect(result).to.equal("1");
        });
        
        it("Should succeed in converting the balance", async function () {
            const bytesValue = "0x1000000000000000000000000000000000000000000000000000000000000000"; 
            const result = await deployment.userOneMain.callStatic._bytesToUint256(bytesValue);
            expect(result).to.equal("7237005577332262213973186563042994240829374041602535252466099000494570602496");
        });
        
        it("Should succeed in converting the balance", async function () {
            const bytesValue = "0x00000000000000000000000000000000000000000000444b316c141919a1c41a"; 
            const result = await deployment.userOneMain.callStatic._bytesToUint256(bytesValue);
            expect(result).to.equal("322507987884167470892058");
        });
        
        it("Should succeed in converting the balance", async function () {
            const bytesValue = "0x000000000000000000000000000000000000000000008c43cc35cedf12b38620"; 
            const result = await deployment.userOneMain.callStatic._bytesToUint256(bytesValue);
            expect(result).to.equal("662381954349503859623456");
        });

        it("Should succeed in converting the balance", async function () {
            const bytesValue = "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"; 
            const result = await deployment.userOneMain.callStatic._bytesToUint256(bytesValue);
            expect(result).to.equal("115792089237316195423570985008687907853269984665640564039457584007913129639935");
        });
    });
    
    describe("_stringToBytes32() Tests", function () {
        it("Should fail as the input is 33 characters", async function () {
            const stringValue = "123456789012345678901234567890123"; 
            await expect(deployment.userOneMain.callStatic._stringToBytes32(stringValue)).to.be.revertedWithCustomError(
                deployment.main,
                "ReadOutOfBounds"
            );
        });
        
        it("Should succeed in converting the string", async function () {
            const stringValue = "A"; 
            const result = await deployment.userOneMain.callStatic._stringToBytes32(stringValue);
            expect(result).to.equal("0x4100000000000000000000000000000000000000000000000000000000000000");
        });

        it("Should succeed in converting the string", async function () {
            const stringValue = "TEST"; 
            const result = await deployment.userOneMain.callStatic._stringToBytes32(stringValue);
            expect(result).to.equal("0x5445535400000000000000000000000000000000000000000000000000000000");
        });
        
        it("Should succeed in converting the string", async function () {
            const stringValue = "TEST1234"; 
            const result = await deployment.userOneMain.callStatic._stringToBytes32(stringValue);
            expect(result).to.equal("0x5445535431323334000000000000000000000000000000000000000000000000");
        });
        
        it("Should succeed in converting the string", async function () {
            const stringValue = "12345678901234567890123456789012"; 
            const result = await deployment.userOneMain.callStatic._stringToBytes32(stringValue);
            expect(result).to.equal("0x3132333435363738393031323334353637383930313233343536373839303132");
        });
    });

    describe("_multiply() Tests", function () {
        it("Should fail with invalid input", async function () {
            const multiplicand = ethers.utils.parseEther("1");
            const multiplier = 0;
            await expect(deployment.userOneMain.callStatic._multiply(multiplicand, multiplier)).to.be.revertedWithCustomError(
                deployment.main,
                "InvalidZeroInput"
            );
        });
        
        it("Should fail with invalid input", async function () {
            const multiplicand = 0;
            const multiplier = ethers.utils.parseEther("1");
            await expect(deployment.userOneMain.callStatic._multiply(multiplicand, multiplier)).to.be.revertedWithCustomError(
                deployment.main,
                "InvalidZeroInput"
            );
        });
        
        it("Should succeed in returning 0", async function () {
            const multiplicand = 1;
            const multiplier = 1; 
            expect(await deployment.userOneMain.callStatic._multiply(multiplicand, multiplier)).to.equal(0);
        });
        
        it("Should succeed in returning 0", async function () {
            const multiplicand = 100_000_000;
            const multiplier = 1_000_000_000; 
            expect(await deployment.userOneMain.callStatic._multiply(multiplicand, multiplier)).to.equal(0);
        });
        
        it("Should succeed in returning the product", async function () {
            const multiplicand = 1_000_000_000;
            const multiplier = 1_000_000_000; 
            const result = await deployment.userOneMain.callStatic._multiply(multiplicand, multiplier);
            expect(result).to.equal("1");
        });
        
        it("Should succeed in returning the product", async function () {
            const multiplicand = ethers.utils.parseEther("1");
            const multiplier = 2; 
            const result = await deployment.userOneMain.callStatic._multiply(multiplicand, multiplier);
            expect(result).to.equal("2");
        });
        
        it("Should succeed in returning the product", async function () {
            const multiplicand = ethers.utils.parseEther("1");
            const multiplier = ethers.utils.parseEther("2");
            const result = await deployment.userOneMain.callStatic._multiply(multiplicand, multiplier);
            expect(result).to.equal("2000000000000000000");
        });
        
        it("Should succeed in returning the product", async function () {
            const multiplicand = ethers.utils.parseEther("1000000000");
            const multiplier = ethers.utils.parseEther("2000000000");
            const result = await deployment.userOneMain.callStatic._multiply(multiplicand, multiplier);
            expect(result).to.equal("2000000000000000000000000000000000000");
        });
        
        it("Should succeed in returning the product", async function () {
            const multiplicand = ethers.utils.parseEther("1000000000000000000");
            const multiplier = ethers.utils.parseEther("2000000000000000000");
            const result = await deployment.userOneMain.callStatic._multiply(multiplicand, multiplier);
            expect(result).to.equal("2000000000000000000000000000000000000000000000000000000");
        });
    });
    
    describe("_divide() Tests", function () {
        it("Should fail with invalid input", async function () {
            const numerator = 0;
            const denominator = ethers.utils.parseEther("1");
            await expect(deployment.userOneMain.callStatic._divide(numerator, denominator)).to.be.revertedWithCustomError(
                deployment.main,
                "InvalidZeroInput"
            );
        });
        
        it("Should fail with invalid input", async function () {
            const numerator = ethers.utils.parseEther("1");
            const denominator = 0; 
            await expect(deployment.userOneMain.callStatic._divide(numerator, denominator)).to.be.revertedWithCustomError(
                deployment.main,
                "InvalidZeroInput"
            );
        });
        
        it("Should succeed in returning the result", async function () {
            const numerator = 1;
            const denominator = 2; 
            const result = await deployment.userOneMain.callStatic._divide(numerator, denominator);
            expect(result).to.equal("500000000000000000");
        });
        
        it("Should succeed in returning the result", async function () {
            const numerator = 1_000_000_000;
            const denominator = 2_000_000_000; 
            const result = await deployment.userOneMain.callStatic._divide(numerator, denominator);
            expect(result).to.equal("500000000000000000");
        });
        
        it("Should succeed in returning the result", async function () {
            const numerator = ethers.utils.parseEther("1");
            const denominator = ethers.utils.parseEther("2"); 
            const result = await deployment.userOneMain.callStatic._divide(numerator, denominator);
            expect(result).to.equal("500000000000000000");
        });
        
        it("Should succeed in returning the result", async function () {
            const numerator = ethers.utils.parseEther("1000000000000000000");
            const denominator = ethers.utils.parseEther("2000000000000000000"); 
            const result = await deployment.userOneMain.callStatic._divide(numerator, denominator);
            expect(result).to.equal("500000000000000000");
        });
        
        it("Should succeed in returning the result", async function () {
            const numerator = 100;
            const denominator = 2; 
            const result = await deployment.userOneMain.callStatic._divide(numerator, denominator);
            expect(result).to.equal("50000000000000000000");
        });
        
        it("Should succeed in returning the result", async function () {
            const numerator = 1;
            const denominator = 200; 
            const result = await deployment.userOneMain.callStatic._divide(numerator, denominator);
            expect(result).to.equal("5000000000000000");
        });
        
        it("Should succeed in returning the result", async function () {
            const numerator = ethers.utils.parseEther("1");
            const denominator = 2; 
            const result = await deployment.userOneMain.callStatic._divide(numerator, denominator);
            expect(result).to.equal("500000000000000000000000000000000000");
        });
        
        it("Should succeed in returning the result", async function () {
            const numerator = 10; 
            const denominator = ethers.utils.parseEther("2"); 
            const result = await deployment.userOneMain.callStatic._divide(numerator, denominator);
            expect(result).to.equal("5");
        });
    });
});
