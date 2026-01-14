import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import { parseEther } from "viem";

const KiyanLendModule = buildModule("KiyanLendModule", (m) => {
  // Deploy MockERC20 first (for testing purposes)
  const mockMUSD = m.contract("MockERC20", [
    "Mock USD",
    "MUSD", 
    18
  ], {
    id: "MockMUSD"
  });

  // Deploy KiyanLend contract
  const kiyanLend = m.contract("KiyanLend", [], {
    id: "KiyanLend"
  });

  // Optional: Mint initial tokens to deployer for testing
  const initialSupply = parseEther("1000000");
  m.call(mockMUSD, "mint", [m.getAccount(0), initialSupply], {
    id: "MintInitialSupply"
  });

  // Optional: Create a test proposal to verify deployment
  const testCapital = parseEther("1.0");
  const testDataId = "ignition-test-proposal";
  
  m.call(kiyanLend, "createProposal", [
    testCapital,
    testDataId,
    0 // Currency.NATIVE
  ], {
    id: "CreateTestProposal"
  });

  return { 
    mockMUSD, 
    kiyanLend 
  };
});

export default KiyanLendModule;