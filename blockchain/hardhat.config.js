require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const localRpcUrl = process.env.LOCAL_RPC_URL || "http://127.0.0.1:8545";

module.exports = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    hardhat: {},
    localhost: {
      url: localRpcUrl
    }
  }
};
