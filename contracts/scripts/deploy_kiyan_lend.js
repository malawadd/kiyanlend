import { network } from "hardhat";
import { parseEther } from "viem";

async function main() {
  console.log("Starting KiyanLend deployment...");
  
  const { viem } = await network.connect();
  const [deployer] = await viem.getWalletClients();
  const publicClient = await viem.getPublicClient();
  
  console.log("Deploying from account:", deployer.account.address);
  
  // Get deployer balance
  const balance = await publicClient.getBalance({
    address: deployer.account.address
  });
  console.log("Deployer balance:", balance.toString(), "wei");
  
  try {
    console.log("\n1. Deploying MockERC20 (MUSD) contract...");
    const mockMUSD = await viem.deployContract("MockERC20", [
      "Mock USD",
      "MUSD", 
      18
    ]);
    console.log("MockERC20 (MUSD) deployed to:", mockMUSD.address);
    
    // Mint some initial tokens for testing
    const initialSupply = parseEther("1000000"); // 1M tokens
    await mockMUSD.write.mint([deployer.account.address, initialSupply]);
    console.log("Minted", initialSupply.toString(), "MUSD tokens to deployer");
    
    console.log("\n2. Deploying KiyanLend contract...");
    const kiyanLend = await viem.deployContract("KiyanLend");
    console.log("KiyanLend deployed to:", kiyanLend.address);
    
    // Verify deployment by checking initial state
    const nextProposalId = await kiyanLend.read.nextProposalId();
    console.log("Next proposal ID:", nextProposalId.toString());
    
    console.log("\n3. Deployment Summary:");
    console.log("======================");
    console.log("MockERC20 (MUSD):", mockMUSD.address);
    console.log("KiyanLend:", kiyanLend.address);
    console.log("Network:", await publicClient.getChainId());
    
    // Create a test proposal for verification
    console.log("\n4. Creating test proposal...");
    const testCapital = parseEther("1.0");
    const testDataId = "test-deployment-proposal";
    
    const createTx = await kiyanLend.write.createProposal([
      testCapital,
      testDataId,
      0 // Currency.NATIVE
    ]);
    
    console.log("Test proposal created in tx:", createTx);
    
    const proposal = await kiyanLend.read.proposals([1n]);
    console.log("Test proposal details:");
    console.log("- ID:", proposal[0].toString());
    console.log("- Entrepreneur:", proposal[1]);
    console.log("- Capital Amount:", proposal[3].toString());
    console.log("- State:", proposal[4]); // 0 = SeekingFunds
    console.log("- Nillion Data ID:", proposal[5]);
    console.log("- Currency:", proposal[6]); // 0 = NATIVE
    
    console.log("\n✅ Deployment completed successfully!");
    
    return {
      mockMUSD: mockMUSD.address,
      kiyanLend: kiyanLend.address,
      testProposalId: 1n
    };
    
  } catch (error) {
    console.error("❌ Deployment failed:", error);
    throw error;
  }
}

// Handle both direct execution and module import
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
    .then((result) => {
      console.log("\nDeployment addresses:", result);
      process.exit(0);
    })
    .catch((error) => {
      console.error("Deployment error:", error);
      process.exit(1);
    });
}

export { main as deployKiyanLend };