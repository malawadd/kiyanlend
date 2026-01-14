// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { IERC20Metadata } from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract ServicePayment {
    using SafeERC20 for IERC20;

    IERC20 public immutable musdToken;
    uint8  public immutable tokenDecimals;
    address public owner;

    uint256 public constant MIN_POINTS = 10;
    uint256 public constant MAX_POINTS = 1000;
    uint256 public immutable PRICE_PER_POINT; // 0.3 * 10**decimals

    event PaymentReceived(address indexed user, uint256 pointsPurchased, uint256 musdAmount, uint256 timestamp);
    event TokensWithdrawn(address indexed owner, uint256 amount);

    modifier onlyOwner() { require(msg.sender == owner, "not owner"); _; }

    constructor() {
        musdToken = IERC20(0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503);
        tokenDecimals = IERC20Metadata(0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503).decimals();
        PRICE_PER_POINT = (3 * (10 ** tokenDecimals)) / 10; // 0.3 per point
        owner = msg.sender;
    }

    function makePayment(uint256 points) external {
        require(points >= MIN_POINTS && points <= MAX_POINTS && points % 10 == 0, "bad points");
        uint256 requiredMusd = points * PRICE_PER_POINT;

        require(musdToken.allowance(msg.sender, address(this)) >= requiredMusd, "approve first");

        
        musdToken.safeTransferFrom(msg.sender, address(this), requiredMusd);

        emit PaymentReceived(msg.sender, points, requiredMusd, block.timestamp);
    }

    function calculateMusdCost(uint256 points) external view returns (uint256) {
        require(points >= MIN_POINTS && points <= MAX_POINTS && points % 10 == 0, "bad points");
        return points * PRICE_PER_POINT;
    }

    function getContractBalance() external view returns (uint256) {
        return musdToken.balanceOf(address(this));
    }

    function withdrawTokens() external onlyOwner {
        uint256 bal = musdToken.balanceOf(address(this));
        require(bal > 0, "no tokens");
        musdToken.safeTransfer(owner, bal);
        emit TokensWithdrawn(owner, bal);
    }
}
