const { deployments, getNamedAccounts, network} = require("hardhat");
const { networkConfig, developmentChains } = require("../helper-hardhat-config")
const { verify } = require("../utils/verify")

module.exports = async () => {

    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts();
    const chainId = network.config.chainId;

    let ethUsdPriceAddress;

    if (chainId != 31337) {
        ethUsdPriceFeedAddress = networkConfig[chainId]["ethUsdPriceFeed"];
    } else {
        const ethUsdAggregator = await deployments.get("MockV3Aggregator");
        ethUsdPriceAddress = ethUsdAggregator.address;
    }
    
    const fundMe = await deploy("FundMe", {
        from: deployer,
        args: [ethUsdPriceAddress],
        log: true
    })

    log(`FundMe deployed at ${fundMe.address}`)

    if (
        !developmentChains.includes(network.name) &&
        process.env.ETHERSCAN_API_KEY
    ) {
        await verify(fundMe.address, [ethUsdPriceFeedAddress])
    }
    
}

module.exports.tags = ["all", "fundme"];