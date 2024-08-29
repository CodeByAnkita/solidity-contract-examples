//hardhat.config.js
require("@nomicfoundation/hardhat-toolbox");
require("@nomiclabs/hardhat-etherscan");
require("dotenv").config();

module.exports = {
  solidity: "0.8.24",
  networks: {
    sepolia: {
      url: process.env.ALCHEMY_SEPOLIA_ENDPOINT,
      accounts: [process.env.PRIVATE_KEY_DEPLOYER]
    },
    polygon: {
      url: process.env.ALCHEMY_POLYGON_ENDPOINT,
      accounts: [process.env.PRIVATE_KEY_DEPLOYER]
    },
    mainnet: {
      url: process.env.ALCHEMY_MAINNET_ENDPOINT,
      accounts: [process.env.PRIVATE_KEY_DEPLOYER]
    }
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY
  }
};




