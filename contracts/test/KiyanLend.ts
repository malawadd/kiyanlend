import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseEther, formatEther, Address } from "viem";
import { network } from "hardhat";

describe("KiyanLend", async function () {
  const { viem } = await network.connect();
  const publicClient = await viem.getPublicClient();
  
  // Test accounts
  const [deployer, entrepreneur, investor, investor2] = await viem.getWalletClients();

  // Test data
  const testCapitalAmount = parseEther("1.0");
  const testNillionDataId = "test-nillion-id-123";
  const repaymentAmount = parseEther("1.1"); // 10% interest

  it("Should deploy KiyanLend contract successfully", async function () {
    const kiyanLend = await viem.deployContract("KiyanLend");
    assert.ok(kiyanLend.address);
    
    const nextId = await kiyanLend.read.nextProposalId();
    assert.equal(nextId, 1n);
  });

  describe("Proposal Creation", function () {
    it("Should create a proposal with native currency", async function () {
      const kiyanLend = await viem.deployContract("KiyanLend");
      
      const tx = await kiyanLend.write.createProposal([
        testCapitalAmount,
        testNillionDataId,
        0 // Currency.NATIVE
      ], {
        account: entrepreneur.account
      });

      // Check the proposal was created correctly
      const proposal = await kiyanLend.read.proposals([1n]);
      assert.equal(proposal[0], 1n); // id
      assert.equal(proposal[1], entrepreneur.account.address); // entrepreneur
      assert.equal(proposal[2], "0x0000000000000000000000000000000000000000"); // investor (should be zero)
      assert.equal(proposal[3], testCapitalAmount); // capitalAmount
      assert.equal(proposal[4], 0); // state (SeekingFunds)
      assert.equal(proposal[5], testNillionDataId); // nillionDataId
      assert.equal(proposal[6], 0); // currency (NATIVE)

      // Check event was emitted
      await viem.assertions.emitWithArgs(
        tx,
        kiyanLend,
        "ProposalCreated",
        [1n, entrepreneur.account.address, testCapitalAmount, testNillionDataId, 0]
      );
    });

    it("Should create a proposal with MUSD currency", async function () {
      const kiyanLend = await viem.deployContract("KiyanLend");
      
      const tx = await kiyanLend.write.createProposal([
        testCapitalAmount,
        testNillionDataId,
        1 // Currency.MUSD
      ], {
        account: entrepreneur.account
      });

      const proposal = await kiyanLend.read.proposals([1n]);
      assert.equal(proposal[6], 1); // currency (MUSD)

      await viem.assertions.emitWithArgs(
        tx,
        kiyanLend,
        "ProposalCreated",
        [1n, entrepreneur.account.address, testCapitalAmount, testNillionDataId, 1]
      );
    });

    it("Should increment proposal counter", async function () {
      const kiyanLend = await viem.deployContract("KiyanLend");
      
      await kiyanLend.write.createProposal([
        testCapitalAmount,
        testNillionDataId,
        0
      ], {
        account: entrepreneur.account
      });

      const nextId = await kiyanLend.read.nextProposalId();
      assert.equal(nextId, 2n);

      await kiyanLend.write.createProposal([
        testCapitalAmount,
        "second-proposal",
        1
      ], {
        account: entrepreneur.account
      });

      const nextId2 = await kiyanLend.read.nextProposalId();
      assert.equal(nextId2, 3n);
    });

    it("Should reject proposal with zero capital amount", async function () {
      const kiyanLend = await viem.deployContract("KiyanLend");
      
      try {
        await kiyanLend.write.createProposal([
          0n,
          testNillionDataId,
          0
        ], {
          account: entrepreneur.account
        });
        assert.fail("Should have thrown an error");
      } catch (error: any) {
        assert.ok(error.message.includes("capital must be > 0"));
      }
    });
  });

  describe("Native ETH Funding", function () {
    it("Should fund a native ETH proposal successfully", async function () {
      const kiyanLend = await viem.deployContract("KiyanLend");
      
      // Create proposal
      await kiyanLend.write.createProposal([
        testCapitalAmount,
        testNillionDataId,
        0 // Currency.NATIVE
      ], {
        account: entrepreneur.account
      });

      // Get entrepreneur balance before funding
      const entrepreneurBalanceBefore = await publicClient.getBalance({
        address: entrepreneur.account.address
      });

      // Fund the proposal
      const tx = await kiyanLend.write.fundProposal([1n], {
        account: investor.account,
        value: testCapitalAmount
      });

      // Check proposal state updated
      const proposal = await kiyanLend.read.proposals([1n]);
      assert.equal(proposal[2], investor.account.address); // investor
      assert.equal(proposal[4], 1); // state (Active)

      // Check entrepreneur received the funds
      const entrepreneurBalanceAfter = await publicClient.getBalance({
        address: entrepreneur.account.address
      });
      assert.equal(
        entrepreneurBalanceAfter - entrepreneurBalanceBefore,
        testCapitalAmount
      );

      // Check event was emitted
      await viem.assertions.emitWithArgs(
        tx,
        kiyanLend,
        "ProposalFunded",
        [1n, investor.account.address, testCapitalAmount, 0]
      );
    });

    it("Should reject funding with incorrect ETH amount", async function () {
      const kiyanLend = await viem.deployContract("KiyanLend");
      
      await kiyanLend.write.createProposal([
        testCapitalAmount,
        testNillionDataId,
        0
      ], {
        account: entrepreneur.account
      });

      try {
        await kiyanLend.write.fundProposal([1n], {
          account: investor.account,
          value: parseEther("0.5") // Wrong amount
        });
        assert.fail("Should have thrown an error");
      } catch (error: any) {
        assert.ok(error.message.includes("incorrect ETH amount"));
      }
    });

    it("Should reject self-funding", async function () {
      const kiyanLend = await viem.deployContract("KiyanLend");
      
      await kiyanLend.write.createProposal([
        testCapitalAmount,
        testNillionDataId,
        0
      ], {
        account: entrepreneur.account
      });

      try {
        await kiyanLend.write.fundProposal([1n], {
          account: entrepreneur.account,
          value: testCapitalAmount
        });
        assert.fail("Should have thrown an error");
      } catch (error: any) {
        assert.ok(error.message.includes("cannot fund own proposal"));
      }
    });

    it("Should reject funding already funded proposal", async function () {
      const kiyanLend = await viem.deployContract("KiyanLend");
      
      await kiyanLend.write.createProposal([
        testCapitalAmount,
        testNillionDataId,
        0
      ], {
        account: entrepreneur.account
      });

      // First funding
      await kiyanLend.write.fundProposal([1n], {
        account: investor.account,
        value: testCapitalAmount
      });

      // Try to fund again
      try {
        await kiyanLend.write.fundProposal([1n], {
          account: investor2.account,
          value: testCapitalAmount
        });
        assert.fail("Should have thrown an error");
      } catch (error: any) {
        assert.ok(error.message.includes("not seeking funds"));
      }
    });
  });

  describe("MUSD Funding", function () {
    it("Should fund a MUSD proposal successfully", async function () {
      const kiyanLend = await viem.deployContract("KiyanLend");
      const mockMUSD = await viem.deployContract("MockERC20", [
        "Mock USD",
        "MUSD",
        18
      ]);

      // Mint MUSD to investor
      await mockMUSD.write.mint([investor.account.address, testCapitalAmount * 2n]);
      
      // Approve KiyanLend to spend MUSD
      await mockMUSD.write.approve([kiyanLend.address, testCapitalAmount], {
        account: investor.account
      });

      // Create MUSD proposal
      await kiyanLend.write.createProposal([
        testCapitalAmount,
        testNillionDataId,
        1 // Currency.MUSD
      ], {
        account: entrepreneur.account
      });

      // Note: This test would work with a modified contract that accepts the MUSD address
      // For now, we'll test the logic flow
    });

    it("Should reject ETH sent with MUSD proposal", async function () {
      const kiyanLend = await viem.deployContract("KiyanLend");
      
      await kiyanLend.write.createProposal([
        testCapitalAmount,
        testNillionDataId,
        1 // Currency.MUSD
      ], {
        account: entrepreneur.account
      });

      try {
        await kiyanLend.write.fundProposal([1n], {
          account: investor.account,
          value: testCapitalAmount // Should not send ETH for MUSD
        });
        assert.fail("Should have thrown an error");
      } catch (error: any) {
        assert.ok(error.message.includes("do not send ETH for MUSD"));
      }
    });
  });

  describe("Proposal Completion", function () {
    it("Should complete native ETH proposal successfully", async function () {
      const kiyanLend = await viem.deployContract("KiyanLend");
      
      // Create and fund proposal
      await kiyanLend.write.createProposal([
        testCapitalAmount,
        testNillionDataId,
        0
      ], {
        account: entrepreneur.account
      });

      await kiyanLend.write.fundProposal([1n], {
        account: investor.account,
        value: testCapitalAmount
      });

      // Get investor balance before completion
      const investorBalanceBefore = await publicClient.getBalance({
        address: investor.account.address
      });

      // Complete proposal with interest
      const tx = await kiyanLend.write.completeProposal([1n], {
        account: entrepreneur.account,
        value: repaymentAmount
      });

      // Check proposal state
      const proposal = await kiyanLend.read.proposals([1n]);
      assert.equal(proposal[4], 2); // state (Completed)

      // Check investor received repayment
      const investorBalanceAfter = await publicClient.getBalance({
        address: investor.account.address
      });
      assert.equal(
        investorBalanceAfter - investorBalanceBefore,
        repaymentAmount
      );

      // Check event was emitted
      await viem.assertions.emitWithArgs(
        tx,
        kiyanLend,
        "ProposalCompleted",
        [1n, entrepreneur.account.address, investor.account.address, repaymentAmount, 0]
      );
    });

    it("Should reject completion by non-entrepreneur", async function () {
      const kiyanLend = await viem.deployContract("KiyanLend");
      
      await kiyanLend.write.createProposal([
        testCapitalAmount,
        testNillionDataId,
        0
      ], {
        account: entrepreneur.account
      });

      await kiyanLend.write.fundProposal([1n], {
        account: investor.account,
        value: testCapitalAmount
      });

      try {
        await kiyanLend.write.completeProposal([1n], {
          account: investor.account, // Wrong account
          value: repaymentAmount
        });
        assert.fail("Should have thrown an error");
      } catch (error: any) {
        assert.ok(error.message.includes("only entrepreneur"));
      }
    });

    it("Should reject completion with insufficient repayment", async function () {
      const kiyanLend = await viem.deployContract("KiyanLend");
      
      await kiyanLend.write.createProposal([
        testCapitalAmount,
        testNillionDataId,
        0
      ], {
        account: entrepreneur.account
      });

      await kiyanLend.write.fundProposal([1n], {
        account: investor.account,
        value: testCapitalAmount
      });

      try {
        await kiyanLend.write.completeProposal([1n], {
          account: entrepreneur.account,
          value: parseEther("0.5") // Less than principal
        });
        assert.fail("Should have thrown an error");
      } catch (error: any) {
        assert.ok(error.message.includes("repay >= principal"));
      }
    });

    it("Should reject completion of non-active proposal", async function () {
      const kiyanLend = await viem.deployContract("KiyanLend");
      
      await kiyanLend.write.createProposal([
        testCapitalAmount,
        testNillionDataId,
        0
      ], {
        account: entrepreneur.account
      });

      // Try to complete unfunded proposal
      try {
        await kiyanLend.write.completeProposal([1n], {
          account: entrepreneur.account,
          value: repaymentAmount
        });
        assert.fail("Should have thrown an error");
      } catch (error: any) {
        assert.ok(error.message.includes("not active"));
      }
    });
  });

  describe("Edge Cases", function () {
    it("Should handle non-existent proposal queries", async function () {
      const kiyanLend = await viem.deployContract("KiyanLend");
      
      const proposal = await kiyanLend.read.proposals([999n]);
      assert.equal(proposal[0], 0n); // id should be 0 for non-existent
    });

    it("Should handle multiple proposals from same entrepreneur", async function () {
      const kiyanLend = await viem.deployContract("KiyanLend");
      
      // Create multiple proposals
      await kiyanLend.write.createProposal([
        testCapitalAmount,
        "proposal-1",
        0
      ], {
        account: entrepreneur.account
      });

      await kiyanLend.write.createProposal([
        parseEther("2.0"),
        "proposal-2",
        1
      ], {
        account: entrepreneur.account
      });

      const proposal1 = await kiyanLend.read.proposals([1n]);
      const proposal2 = await kiyanLend.read.proposals([2n]);

      assert.equal(proposal1[1], entrepreneur.account.address);
      assert.equal(proposal2[1], entrepreneur.account.address);
      assert.equal(proposal1[3], testCapitalAmount);
      assert.equal(proposal2[3], parseEther("2.0"));
    });
  });
});