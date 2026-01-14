import { network } from "hardhat";
import { parseEther } from "viem";

async function main() {
  console.log("Starting deployment...");
  
  const { viem } = await network.connect();
  const [deployer] = await viem.getWalletClients();
  const publicClient = await viem.getPublicClient();
  
  console.log("Deploying from account:", deployer.account.address);
  console.log("Network:", await publicClient.getChainId());
  
  try {
    // Deploy MockERC20 for testing
    console.log("Deploying MockERC20...");
    const mockToken = await viem.deployContract("MockERC20", [
      "Mock USD",
      "MUSD",
      18
    ]);
    console.log("MockERC20 deployed to:", mockToken.address);
    
    // Deploy KiyanLend contract
    console.log("Deploying KiyanLend...");
    const kiyanLend = await viem.deployContract("KiyanLend");
    console.log("KiyanLend deployed to:", kiyanLend.address);
    
    // Verify deployment
    const nextId = await kiyanLend.read.nextProposalId();
    console.log("Initial next proposal ID:", nextId.toString());
    
    console.log("\n=== Deployment Summary ===");
    console.log("MockERC20:", mockToken.address);
    console.log("KiyanLend:", kiyanLend.address);
    
    return {
      mockToken: mockToken.address,
      kiyanLend: kiyanLend.address
    };
    
  } catch (error) {
    console.error("Deployment failed:", error);
    throw error;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});