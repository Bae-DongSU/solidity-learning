import "@nomicfoundation/hardhat-toolbox";

module.exports = {
    defaultNetwork: "hardhat",
    networks: {
      hardhat: {
      },
    },
    solidity: {
      version: "0.8.28",
      settings: {
        optimizer: {
          enabled: true,
          runs: 200
        }
      }
    },
    paths: {
      sources: "./contracts",
      tests: "./test",
      cache: "./cache",
      artifacts: "./artifacts"
    },
    mocha: {
      timeout: 40000
    }
  }