require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.17",
  networks: {
    rinkeby: {
      url: process.env.INFURA_SEPOLIA_ENDPOINT,
      accounts: [process.env.PRIVATE_KEY]
    },
    goerli: {
      url: process.env.INFURA_POLYGON_MAINNET_ENDPOINT,
      accounts: [process.env.PRIVATE_KEY]
    }
  }
};
