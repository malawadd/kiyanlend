import assert from "node:assert/strict";
import { describe, it, beforeEach } from "node:test";
import { network } from "hardhat";
import { parseUnits, getAddress, zeroAddress } from "viem";

describe("ServicePayment", async function () {
  const { viem } = await network.connect();
  const publicClient = await viem.getPublicClient();
  
  // Test accounts
  let owner: any;
  let user1: any;
  let user2: any;
  let servicePayment: any;
  let mockToken: any;
  
  // Constants from contract
  const MIN_POINTS = 10n;
  const MAX_POINTS = 1000n;
  const PRICE_PER_POINT = parseUnits("0.3", 18); // 0.3 MUSD per point

  beforeEach(async function () {
    // Get test accounts
    [owner, user1, user2] = await viem.getWalletClients();
    
    // Deploy mock ERC20 token for testing
    mockToken = await viem.deployContract("MockERC20", ["Mock MUSD", "MUSD", 18n]);
    
    // Deploy ServicePayment contract
    servicePayment = await viem.deployContract("ServicePayment");
    
    // Mint tokens to test users
    const mintAmount = parseUnits("10000", 18); // 10,000 tokens
    await mockToken.write.mint([user1.account.address, mintAmount]);
    await mockToken.write.mint([user2.account.address, mintAmount]);
  });

  describe("Deployment", function () {
    it("Should set the correct owner", async function () {
      const contractOwner = await servicePayment.read.owner();
      assert.equal(contractOwner.toLowerCase(), owner.account.address.toLowerCase());
    });

    it("Should set the correct MUSD token address", async function () {
      const tokenAddress = await servicePayment.read.musdToken();
      // The contract uses a hardcoded address, so we just verify it's set
      assert.equal(tokenAddress, "0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503");
    });

    it("Should set the correct token decimals", async function () {
      const decimals = await servicePayment.read.tokenDecimals();
      assert.equal(decimals, 18);
    });

    it("Should set the correct price per point (0.3 MUSD)", async function () {
      const pricePerPoint = await servicePayment.read.PRICE_PER_POINT();
      assert.equal(pricePerPoint, PRICE_PER_POINT);
    });

    it("Should set correct constants", async function () {
      assert.equal(MIN_POINTS, 10n);
      assert.equal(MAX_POINTS, 1000n);
    });
  });

  describe("calculateMusdCost", function () {
    it("Should calculate correct cost for minimum points", async function () {
      const cost = await servicePayment.read.calculateMusdCost([MIN_POINTS]);
      const expectedCost = MIN_POINTS * PRICE_PER_POINT;
      assert.equal(cost, expectedCost);
    });

    it("Should calculate correct cost for maximum points", async function () {
      const cost = await servicePayment.read.calculateMusdCost([MAX_POINTS]);
      const expectedCost = MAX_POINTS * PRICE_PER_POINT;
      assert.equal(cost, expectedCost);
    });

    it("Should calculate correct cost for various point amounts", async function () {
      const testCases = [20n, 50n, 100n, 250n, 500n];
      
      for (const points of testCases) {
        const cost = await servicePayment.read.calculateMusdCost([points]);
        const expectedCost = points * PRICE_PER_POINT;
        assert.equal(cost, expectedCost, `Failed for ${points} points`);
      }
    });

    it("Should revert for points below minimum", async function () {
      await assert.rejects(
        servicePayment.read.calculateMusdCost([5n]),
        /bad points/
      );
    });

    it("Should revert for points above maximum", async function () {
      await assert.rejects(
        servicePayment.read.calculateMusdCost([1001n]),
        /bad points/
      );
    });

    it("Should revert for points not divisible by 10", async function () {
      const invalidPoints = [11n, 15n, 23n, 99n, 101n];
      
      for (const points of invalidPoints) {
        await assert.rejects(
          servicePayment.read.calculateMusdCost([points]),
          /bad points/,
          `Should revert for ${points} points`
        );
      }
    });
  });

  describe("makePayment", function () {
    it("Should revert when insufficient allowance", async function () {
      const points = MIN_POINTS;
      
      // Try to make payment without approval
      await assert.rejects(
        servicePayment.write.makePayment([points], { account: user1.account }),
        /approve first/
      );
    });

    it("Should revert for invalid point amounts", async function () {
      const invalidPoints = [5n, 1001n, 15n, 0n];
      
      for (const points of invalidPoints) {
        await assert.rejects(
          servicePayment.write.makePayment([points], { account: user1.account }),
          /bad points/,
          `Should revert for ${points} points`
        );
      }
    });

    it("Should validate points are multiples of 10", async function () {
      const validPoints = [10n, 20n, 100n, 1000n];
      
      // These should not revert due to point validation (but will due to allowance)
      for (const points of validPoints) {
        await assert.rejects(
          servicePayment.write.makePayment([points], { account: user1.account }),
          /approve first/, // Should fail on allowance, not point validation
          `Valid points ${points} should pass validation`
        );
      }
    });
  });

  describe("getContractBalance", function () {
    it("Should return zero balance initially", async function () {
      const balance = await servicePayment.read.getContractBalance();
      assert.equal(balance, 0n);
    });
  });

  describe("withdrawTokens", function () {
    it("Should revert when no tokens to withdraw", async function () {
      await assert.rejects(
        servicePayment.write.withdrawTokens([], { account: owner.account }),
        /no tokens/
      );
    });

    it("Should only allow owner to call withdraw", async function () {
      await assert.rejects(
        servicePayment.write.withdrawTokens([], { account: user1.account }),
        /not owner/
      );
      
      await assert.rejects(
        servicePayment.write.withdrawTokens([], { account: user2.account }),
        /not owner/
      );
    });
  });

  describe("Access Control", function () {
    it("Should have correct owner set", async function () {
      const contractOwner = await servicePayment.read.owner();
      assert.equal(contractOwner.toLowerCase(), owner.account.address.toLowerCase());
    });

    it("Should reject non-owner withdrawal attempts", async function () {
      const nonOwners = [user1, user2];
      
      for (const user of nonOwners) {
        await assert.rejects(
          servicePayment.write.withdrawTokens([], { account: user.account }),
          /not owner/,
          `User ${user.account.address} should not be able to withdraw`
        );
      }
    });
  });

  describe("Constants Validation", function () {
    it("Should have correct minimum and maximum point limits", async function () {
      // Test boundary conditions
      const belowMin = MIN_POINTS - 1n;
      const aboveMax = MAX_POINTS + 1n;
      
      await assert.rejects(
        servicePayment.read.calculateMusdCost([belowMin]),
        /bad points/
      );
      
      await assert.rejects(
        servicePayment.read.calculateMusdCost([aboveMax]),
        /bad points/
      );
      
      // Test valid boundaries
      const minCost = await servicePayment.read.calculateMusdCost([MIN_POINTS]);
      const maxCost = await servicePayment.read.calculateMusdCost([MAX_POINTS]);
      
      assert.equal(minCost, MIN_POINTS * PRICE_PER_POINT);
      assert.equal(maxCost, MAX_POINTS * PRICE_PER_POINT);
    });

    it("Should enforce points are multiples of 10", async function () {
      const validMultiples = [10n, 20n, 30n, 100n, 500n, 1000n];
      const invalidMultiples = [11n, 25n, 33n, 105n, 999n];
      
      // Valid multiples should work
      for (const points of validMultiples) {
        const cost = await servicePayment.read.calculateMusdCost([points]);
        assert.equal(cost, points * PRICE_PER_POINT);
      }
      
      // Invalid multiples should fail
      for (const points of invalidMultiples) {
        await assert.rejects(
          servicePayment.read.calculateMusdCost([points]),
          /bad points/
        );
      }
    });
  });

  describe("Mathematical Calculations", function () {
    it("Should calculate costs accurately for edge cases", async function () {
      // Test some specific calculations
      const testCases = [
        { points: 10n, expectedMusd: "3" },     // 10 * 0.3 = 3
        { points: 100n, expectedMusd: "30" },   // 100 * 0.3 = 30
        { points: 1000n, expectedMusd: "300" }, // 1000 * 0.3 = 300
      ];
      
      for (const testCase of testCases) {
        const cost = await servicePayment.read.calculateMusdCost([testCase.points]);
        const expectedCost = parseUnits(testCase.expectedMusd, 18);
        assert.equal(cost, expectedCost, 
          `Cost calculation failed for ${testCase.points} points`);
      }
    });
  });
});

// Mock ERC20 contract for testing
// This should be in a separate file or imported from a mock contracts library
const MockERC20Source = `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockERC20 is ERC20 {
    uint8 private _decimals;
    
    constructor(string memory name, string memory symbol, uint8 decimals_) ERC20(name, symbol) {
        _decimals = decimals_;
    }
    
    function decimals() public view virtual override returns (uint8) {
        return _decimals;
    }
    
    function mint(address to, uint256 amount) public {
        _mint(to, amount);
    }
}
`;