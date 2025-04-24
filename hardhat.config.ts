import anyflow from 'anyflow-sdk';
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import '@openzeppelin/hardhat-upgrades';
import 'dotenv/config';

anyflow.setup();

const config: HardhatUserConfig = {
  solidity: "0.8.28",
};

export default anyflow.mergeHardhatConfig(config);
