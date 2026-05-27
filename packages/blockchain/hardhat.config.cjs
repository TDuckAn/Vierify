const path = require("node:path");

require("dotenv").config({
  path: path.resolve(__dirname, "../../apps/api/.env")
});
require("@nomicfoundation/hardhat-ethers");

const privateKey = process.env.WALLET_PRIVATE_KEY;

/** @type {import("hardhat/config").HardhatUserConfig} */
module.exports = {
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    amoy: {
      accounts: privateKey ? [privateKey] : [],
      chainId: 80002,
      url: process.env.POLYGON_AMOY_RPC ?? "https://rpc-amoy.polygon.technology"
    }
  }
};
