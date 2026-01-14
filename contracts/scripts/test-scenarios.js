import { network } from "hardhat";
import { parseEther } from "viem";

async function main() {
  console.log("🧪 KiyanLend Test Scenarios Runner");
  console.log("==================================");
  
  const { viem } = await network.connect();
  const [deployer, entrepreneur, investor1, investor2] = await viem.getWalletClients();
  const publicClient = await viem.getPublicClient();
  
  try {
    // Deploy contracts
    console.log("\n📦 Deploying contracts...");
    const mockMUSD = await viem.deployContract("MockERC20", [
      "Mock USD", "MUSD", 18
    ]);
    const kiyanLend = await viem.deployContract("KiyanLend");
    
    console.log("MockERC20:", mockMUSD.address);
    console.log("KiyanLend:", kiyanLend.address);
    
    // Setup: Mint tokens to accounts
    const tokenAmount = parseEther("10000");
    await mockMUSD.write.mint([investor1.account.address, tokenAmount]);
    await mockMUSD.write.mint([investor2.account.address, tokenAmount]);
    console.log("✅ Minted MUSD tokens to investors");
    
    // Scenario 1: Native ETH Proposal
    console.log("\n🏦 Scenario 1: Native ETH Lending");
    const ethAmount = parseEther("1.0");
    
    await kiyanLend.write.createProposal([
      ethAmount,
      "eth-business-plan-data",
      0 // Currency.NATIVE
    ], { account: entrepreneur.account });
    
    console.log("📝 Created ETH proposal (ID: 1)");
    
    await kiyanLend.write.fundProposal([1n], {
      account: investor1.account,
      value: ethAmount
    });
    console.log("💰 Funded ETH proposal");
    
    // Check balances
    const entrepreneurBalance = await publicClient.getBalance({
      address: entrepreneur.account.address
    });
    console.log("Entrepreneur received:", entrepreneurBalance.toString(), "wei");
    
    // Complete the proposal with interest
    const repayAmount = parseEther("1.1"); // 10% interest
    await kiyanLend.write.completeProposal([1n], {
      account: entrepreneur.account,
      value: repayAmount
    });
    console.log("✅ Completed ETH proposal with 10% interest");
    
    // Scenario 2: MUSD Proposal (demonstrating the flow)
    console.log("\n🏛️ Scenario 2: MUSD Lending Flow");
    
    await kiyanLend.write.createProposal([
      parseEther("500"),
      "musd-expansion-plan",
      1 // Currency.MUSD
    ], { account: entrepreneur.account });
    
    console.log("📝 Created MUSD proposal (ID: 2)");
    
    // Note: For MUSD funding to work, we'd need to modify the contract
    // to accept the MockERC20 address or use a factory pattern
    console.log("ℹ️  MUSD funding would require contract modification to accept token address");
    
    // Scenario 3: Multiple proposals from same entrepreneur
    console.log("\n🔄 Scenario 3: Multiple Proposals");
    
    for (let i = 0; i < 3; i++) {
      await kiyanLend.write.createProposal([
        parseEther((i + 1).toString()),
        `proposal-${i + 3}`,
        i % 2 // Alternate between NATIVE and MUSD
      ], { account: entrepreneur.account });
    }
    
    const nextId = await kiyanLend.read.nextProposalId();
    console.log(`📊 Created multiple proposals, next ID: ${nextId}`);
    
    // Show proposal states
    console.log("\n📋 Final Proposal Summary:");
    for (let id = 1n; id <= 5n; id++) {
      const proposal = await kiyanLend.read.proposals([id]);
      const states = ["SeekingFunds", "Active", "Completed", "Defaulted"];
      const currencies = ["NATIVE", "MUSD"];
      
      console.log(`Proposal ${id}:`);
      console.log(`  - Capital: ${proposal[3]} wei`);
      console.log(`  - State: ${states[proposal[4]]}`);
      console.log(`  - Currency: ${currencies[proposal[6]]}`);
      console.log(`  - Data ID: ${proposal[5]}`);
    }
    
    console.log("\n🎉 All test scenarios completed successfully!");
    
  } catch (error) {
    console.error("❌ Test scenario failed:", error);
    throw error;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});