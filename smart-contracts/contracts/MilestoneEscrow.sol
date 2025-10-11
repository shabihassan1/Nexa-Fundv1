// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * MilestoneEscrow
 * - Holds all contributions for a campaign in escrow
 * - Funds are released milestone-by-milestone
 * - Voting is recorded off-chain (backend) and a privileged account (admin) executes releases
 * - Supports refunds for unspent funds if campaign is cancelled
 */
contract MilestoneEscrow {
    address public immutable campaignOwner;     // project creator
    address public immutable platformAdmin;     // backend-controlled executor

    struct Milestone {
        uint256 amount;        // amount reserved for this milestone (in wei)
        bool released;         // has milestone been released
    }

    Milestone[] public milestones;
    uint256 public totalDeposited;              // total contributed
    uint256 public totalReleased;               // sum released to date
    bool public cancelled;                      // campaign cancelled flag

    event Contributed(address indexed backer, uint256 amount);
    event MilestoneAdded(uint256 indexed index, uint256 amount);
    event MilestoneReleased(uint256 indexed index, uint256 amount, address to);
    event Refunded(address indexed to, uint256 amount);
    event Cancelled();

    modifier onlyAdmin() {
        require(msg.sender == platformAdmin, "ONLY_ADMIN");
        _;
    }

    modifier notCancelled() {
        require(!cancelled, "CANCELLED");
        _;
    }

    constructor(address _campaignOwner, address _platformAdmin) {
        require(_campaignOwner != address(0) && _platformAdmin != address(0), "BAD_ADDR");
        campaignOwner = _campaignOwner;
        platformAdmin = _platformAdmin;
    }

    // Admin can configure milestones before/after funding starts
    function addMilestone(uint256 amountWei) external onlyAdmin {
        milestones.push(Milestone({amount: amountWei, released: false}));
        emit MilestoneAdded(milestones.length - 1, amountWei);
    }

    // Anyone can contribute; all funds remain escrowed in the contract
    function contribute() external payable notCancelled {
        require(msg.value > 0, "ZERO");
        totalDeposited += msg.value;
        emit Contributed(msg.sender, msg.value);
    }

    // Admin executes a release when off-chain voting approves the milestone
    function releaseMilestone(uint256 index) external onlyAdmin notCancelled {
        require(index < milestones.length, "OOB");
        Milestone storage m = milestones[index];
        require(!m.released, "ALREADY");
        require(address(this).balance >= m.amount, "INSUFFICIENT");

        m.released = true;
        totalReleased += m.amount;
        (bool ok, ) = payable(campaignOwner).call{value: m.amount}("");
        require(ok, "TRANSFER_FAIL");
        emit MilestoneReleased(index, m.amount, campaignOwner);
    }

    // Admin can cancel; remaining funds become refundable
    function cancelCampaign() external onlyAdmin {
        require(!cancelled, "ALREADY");
        cancelled = true;
        emit Cancelled();
    }

    // Admin refunds any remaining balance to a specified backer wallet (off-chain keeps shares)
    function adminRefund(address to, uint256 amountWei) external onlyAdmin {
        require(cancelled, "NOT_CANCELLED");
        require(address(this).balance >= amountWei, "INSUFFICIENT");
        (bool ok, ) = payable(to).call{value: amountWei}("");
        require(ok, "REFUND_FAIL");
        emit Refunded(to, amountWei);
    }

    // View helpers
    function milestonesCount() external view returns (uint256) { return milestones.length; }
    function escrowBalance() external view returns (uint256) { return address(this).balance; }
}


