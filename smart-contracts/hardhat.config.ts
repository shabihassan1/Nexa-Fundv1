import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import dotenv from "dotenv";

dotenv.config();

const PRIVATE_KEY = process.env.PRIVATE_KEY || "";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: { enabled: true, runs: 200 }
    }
  },
  networks: {
    hardhat: {},
    polygonAmoy: {
      url: process.env.AMOY_RPC_URL || "https://rpc-amoy.polygon.technology/",
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
      chainId: 80002
    }
  },
  paths: {
    sources: "contracts",
    tests: "test",
    cache: "cache",
    artifacts: "artifacts"
  }
};

export default config;


