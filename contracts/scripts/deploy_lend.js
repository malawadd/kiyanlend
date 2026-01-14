import {network} from "hardhat"

const {viem} = await network.connect();
const lend = await viem.deployContract("KiyanLend", ["0xfb4d140b46e1ae4b170a40c39bf5c43fe46f5432"]);

console.log("Lend deployed to:", lend.address);