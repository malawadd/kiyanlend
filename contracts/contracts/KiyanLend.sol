// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract KiyanLend {
    using SafeERC20 for IERC20;

    
    IERC20 public constant MUSD = IERC20(0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503);

    uint256 private _proposalCounter;

    enum ProposalState { SeekingFunds, Active, Completed, Defaulted }
    enum Currency { NATIVE, MUSD }

    struct Proposal {
        uint256 id;
        address payable entrepreneur;
        address investor;
        uint256 capitalAmount;   
        ProposalState state;
        string nillionDataId;
        Currency currency;
    }

    mapping(uint256 => Proposal) public proposals;

    event ProposalCreated(
        uint256 indexed id,
        address indexed entrepreneur,
        uint256 capitalAmount,
        string nillionDataId,
        Currency currency
    );
    event ProposalFunded(
        uint256 indexed id,
        address indexed investor,
        uint256 capitalAmount,
        Currency currency
    );
    event ProposalCompleted(
        uint256 indexed id,
        address entrepreneur,
        address investor,
        uint256 payAmount,
        Currency currency
    );
    event ProposalDefaulted(uint256 indexed id, address indexed entrepreneur);

    // -------------------------
    // Create
    // -------------------------
    function createProposal(
        uint256 _capitalAmount,
        string memory _nillionDataId,
        Currency _currency
    ) external {
        require(_capitalAmount > 0, "KiyanLend: capital must be > 0");

        _proposalCounter++;
        uint256 newId = _proposalCounter;

        proposals[newId] = Proposal({
            id: newId,
            entrepreneur: payable(msg.sender),
            investor: address(0),
            capitalAmount: _capitalAmount,
            state: ProposalState.SeekingFunds,
            nillionDataId: _nillionDataId,
            currency: _currency
        });

        emit ProposalCreated(newId, msg.sender, _capitalAmount, _nillionDataId, _currency);
    }

    // -------------------------
    // Fund
    // -------------------------
    function fundProposal(uint256 _proposalId) external payable {
        Proposal storage p = proposals[_proposalId];

        require(p.state == ProposalState.SeekingFunds, "KiyanLend: not seeking funds");
        require(msg.sender != p.entrepreneur, "KiyanLend: cannot fund own proposal");

        if (p.currency == Currency.NATIVE) {
            require(msg.value == p.capitalAmount, "KiyanLend: incorrect ETH amount");
            p.investor = msg.sender;
            p.state = ProposalState.Active;

            (bool ok, ) = p.entrepreneur.call{value: msg.value}("");
            require(ok, "KiyanLend: ETH transfer failed");
        } else {
            require(msg.value == 0, "KiyanLend: do not send ETH for MUSD");
            p.investor = msg.sender;
            p.state = ProposalState.Active;

            // Pull MUSD from investor and send directly to entrepreneur
            MUSD.safeTransferFrom(msg.sender, p.entrepreneur, p.capitalAmount);
        }

        emit ProposalFunded(_proposalId, msg.sender, p.capitalAmount, p.currency);
    }

    // -------------------------
    // Complete
    // -------------------------
    function completeProposal(uint256 _proposalId) external payable {
        Proposal storage p = proposals[_proposalId];

        require(msg.sender == p.entrepreneur, "KiyanLend: only entrepreneur");
        require(p.state == ProposalState.Active, "KiyanLend: not active");
        require(p.currency == Currency.NATIVE, "KiyanLend: use completeProposalWithMusd");
        require(msg.value >= p.capitalAmount, "KiyanLend: repay >= principal");

        p.state = ProposalState.Completed;

        (bool ok, ) = payable(p.investor).call{value: msg.value}("");
        require(ok, "KiyanLend: ETH payout failed");

        emit ProposalCompleted(_proposalId, p.entrepreneur, p.investor, msg.value, p.currency);
    }

    function completeProposalWithMusd(uint256 _proposalId, uint256 _payAmount) external {
        Proposal storage p = proposals[_proposalId];

        require(msg.sender == p.entrepreneur, "KiyanLend: only entrepreneur");
        require(p.state == ProposalState.Active, "KiyanLend: not active");
        require(p.currency == Currency.MUSD, "KiyanLend: not a MUSD proposal");
        require(_payAmount >= p.capitalAmount, "KiyanLend: repay >= principal");

        p.state = ProposalState.Completed;

        // Pull MUSD from entrepreneur to investor
        MUSD.safeTransferFrom(msg.sender, p.investor, _payAmount);

        emit ProposalCompleted(_proposalId, p.entrepreneur, p.investor, _payAmount, p.currency);
    }

    // -------------------------
    // View helpers
    // -------------------------
    function nextProposalId() external view returns (uint256) {
        return _proposalCounter + 1;
    }
}
