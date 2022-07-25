const { assert, expect } = require("chai");
const { deployments, ethers, getNamedAccounts } = require("hardhat")

describe("Fund Me Unit Test", async () => {

    let fundMe;
    let deployer;
    let mockV3Aggregator;
    const sendValue = ethers.utils.parseEther("1");

    beforeEach(async () => {

        // deploy contract 
        deployer = (await getNamedAccounts()).deployer;
        await deployments.fixture(["all"])
        fundMe = await ethers.getContract("FundMe", deployer);
        mockV3Aggregator = await ethers.getContract("MockV3Aggregator", deployer);

    })
    describe("constructor", async () => {
        it("sets aggregator addresses correctly", async () => {
            const response = await fundMe.getPriceFeed()
            assert.equal(response, mockV3Aggregator.address)
        })
    })
    describe("fund", async () => {
        it("fails if required eth amount isnt sent", async () => {
            await expect(fundMe.fund()).to.be.revertedWith("You need to spend more ETH!")
        });
        it("updates the amount funded", async () => {
            await fundMe.fund({value: sendValue})
            const response = await fundMe.getAddressToAmountFunded(deployer);
            assert.equal(response.toString(), sendValue.toString())
        })
        it("adds funders to funders array", async () => {
            await fundMe.fund({value: sendValue})
            const funder = await fundMe.getFunder(0)
            assert.equal(funder, deployer)
        })
    })
    describe("withdraw", async () => {

        beforeEach(async () => {
            await fundMe.fund({value: sendValue})         
        })

        it("withdraws eth from a single funder", async () => {
            // Arrange
            const startingFundMeBalance = await fundMe.provider.getBalance(fundMe.address)
            const startingDeployerBalance = await fundMe.provider.getBalance(deployer)
            // Act
            const txResponse = await fundMe.withdraw()
            const txReceipt = await txResponse.wait(1)
            const { gasUsed, effectiveGasPrice } = txReceipt;
            const gasCost = gasUsed.mul(effectiveGasPrice);
            const endingFundMeBalance = await fundMe.provider.getBalance(fundMe.address)
            const endingDeployerBalance = await fundMe.provider.getBalance(deployer)
            // gasCost

            // Assert
            assert.equal(endingFundMeBalance, 0)
            assert.equal(startingFundMeBalance.add(startingDeployerBalance).toString(), endingDeployerBalance.add(gasCost).toString())
        })

        it("allows us to withdraw with multiple funders", async () => {
            // Arrange
            const accounts = await ethers.getSigners()
            for (let i = 1; i < 6; i++) {
                const fundMeConnectedContract = await fundMe.connect(accounts[i])
                await fundMeConnectedContract.fund({value: sendValue})
            }
            const startingFundMeBalance = await fundMe.provider.getBalance(fundMe.address)
            const startingDeployerBalance = await fundMe.provider.getBalance(deployer) 

            // Act
            const txResponse = await fundMe.withdraw()
            const txReceipt = await txResponse.wait(1)
            const { gasUsed, effectiveGasPrice } = txReceipt;
            const gasCost = gasUsed.mul(effectiveGasPrice);
            const endingFundMeBalance = await fundMe.provider.getBalance(fundMe.address)
            const endingDeployerBalance = await fundMe.provider.getBalance(deployer)
            // Assert
            assert.equal(endingFundMeBalance, 0)
            assert.equal(startingFundMeBalance.add(startingDeployerBalance).toString(), endingDeployerBalance.add(gasCost).toString())

            // Make sure funders array is reset
            // await expect(fundMe.s_funders(0)).to.be.reverted

            for (let i = 1; i < 6; i++) {
                assert.equal(await fundMe.getAddressToAmountFunded(accounts[i].address), 0)
            }
        })

        it("only allows owner to withdraw funds", async () => {
            const accounts = await ethers.getSigners()
            const attacker = accounts[1]
            const attackerConnectedContract = await fundMe.connect(attacker)
            expect(attackerConnectedContract.withdraw()).to.be.revertedWith("FundMe__NotOwner")
        })

        it("cheaper withdraw testing...", async () => {
            // Arrange
            const accounts = await ethers.getSigners()
            for (let i = 1; i < 6; i++) {
                const fundMeConnectedContract = await fundMe.connect(accounts[i])
                await fundMeConnectedContract.fund({value: sendValue})
            }
            const startingFundMeBalance = await fundMe.provider.getBalance(fundMe.address)
            const startingDeployerBalance = await fundMe.provider.getBalance(deployer) 

            // Act
            const txResponse = await fundMe.cheaperWithdraw()
            const txReceipt = await txResponse.wait(1)
            const { gasUsed, effectiveGasPrice } = txReceipt;
            const gasCost = gasUsed.mul(effectiveGasPrice);
            const endingFundMeBalance = await fundMe.provider.getBalance(fundMe.address)
            const endingDeployerBalance = await fundMe.provider.getBalance(deployer)
            
            // Assert
            assert.equal(endingFundMeBalance, 0)
            assert.equal(startingFundMeBalance.add(startingDeployerBalance).toString(), endingDeployerBalance.add(gasCost).toString())

            for (let i = 1; i < 6; i++) {
                assert.equal(await fundMe.getAddressToAmountFunded(accounts[i].address), 0)
            }
        })
    })
})