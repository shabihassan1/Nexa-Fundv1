// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * NexaFundV3 - SIMPLIFIED ESCROW (Backend-Controlled Voting)
 * 
 * Philosophy: Keep it simple
 * - Smart contract = Escrow wallet
 * - Backend = Voting logic & decision making
 * - Contract just executes commands: release or refund
 * 
 * Flow:
 * 1. Backer contributes → Contract holds funds
 * 2. Backend handles voting logic
 * 3a. Backend calls releaseMilestone() → Funds to creator
 * 3b. Backend calls rejectMilestone() → Backers can claim refunds
 * 4. Admin emergency functions for edge cases
 */
contract NexaFundV3 {
    struct Milestone {
        uint256 amount;        // Milestone goal amount (wei)
        bool released;         // Funds sent to creator
        bool rejected;         // Voting failed, refunds available
    }

    // Roles
    address public admin;          // Platform admin
    address public creator;        // Campaign creator/recipient

    // Campaign info
    uint256 public immutable goal;     // Total campaign goal (wei)
    uint256 public raised;             // Total contributed so far
    bool public cancelled;             // Campaign cancellation flag

    // Contributions tracking
    mapping(address => uint256) public contributions; // backer -> total contributed
    address[] public backerList;       // List of all backers
    mapping(address => bool) private isBackerRegistered;

    // Refunds tracking per milestone
    mapping(address => mapping(uint256 => bool)) public refundClaimed; // backer -> milestone -> claimed
    
    // Milestones
    Milestone[] public milestones;

    // Events
    event Contributed(address indexed backer, uint256 amount);
    event MilestoneReleased(uint256 indexed milestoneIndex, uint256 amount, address indexed to);
    event MilestoneRejected(uint256 indexed milestoneIndex);
    event RefundIssued(address indexed backer, uint256 indexed milestoneIndex, uint256 amount);
    event CampaignCancelled();
    event CancellationRefundIssued(address indexed backer, uint256 amount);

    modifier onlyAdmin() { 
        require(msg.sender == admin, "ONLY_ADMIN"); 
        _; 
    }
    
    modifier notCancelled() { 
        require(!cancelled, "CAMPAIGN_CANCELLED"); 
        _; 
    }

    constructor(
        address _creator,
        uint256 _goal,
        uint256[] memory _milestoneAmounts
    ) {
        require(_creator != address(0), "INVALID_CREATOR");
        require(_milestoneAmounts.length > 0, "NO_MILESTONES");
        
        creator = _creator;
        admin = msg.sender;
        goal = _goal;

        // Create milestones
        uint256 sum = 0;
        for (uint256 i = 0; i < _milestoneAmounts.length; i++) {
            require(_milestoneAmounts[i] > 0, "ZERO_MILESTONE");
            milestones.push(Milestone({
                amount: _milestoneAmounts[i],
                released: false,
                rejected: false
            }));
            sum += _milestoneAmounts[i];
        }
        
        require(sum == _goal, "MILESTONES_SUM_MISMATCH");
    }

    /**
     * Contribute to the campaign
     * Anyone can contribute, funds held in escrow
     */
    function contribute() external payable notCancelled {
        require(msg.value > 0, "ZERO_CONTRIBUTION");
        require(raised + msg.value <= goal, "EXCEEDS_GOAL");

        // Track contribution
        contributions[msg.sender] += msg.value;
        raised += msg.value;

        // Add to backer list if first contribution
        if (!isBackerRegistered[msg.sender]) {
            backerList.push(msg.sender);
            isBackerRegistered[msg.sender] = true;
        }

        emit Contributed(msg.sender, msg.value);
    }

    /**
     * Release milestone funds to creator
     * Called by backend after voting approval
     */
    function releaseMilestone(uint256 milestoneIndex) external onlyAdmin notCancelled {
        require(milestoneIndex < milestones.length, "INVALID_MILESTONE");
        Milestone storage m = milestones[milestoneIndex];
        
        require(!m.released, "ALREADY_RELEASED");
        require(!m.rejected, "ALREADY_REJECTED");
        require(address(this).balance >= m.amount, "INSUFFICIENT_BALANCE");

        m.released = true;

        // Send funds to creator
        (bool success, ) = creator.call{value: m.amount}("");
        require(success, "TRANSFER_FAILED");

        emit MilestoneReleased(milestoneIndex, m.amount, creator);
    }

    /**
     * Reject milestone and enable refunds
     * Called by backend after voting rejection
     */
    function rejectMilestone(uint256 milestoneIndex) external onlyAdmin notCancelled {
        require(milestoneIndex < milestones.length, "INVALID_MILESTONE");
        Milestone storage m = milestones[milestoneIndex];
        
        require(!m.released, "ALREADY_RELEASED");
        require(!m.rejected, "ALREADY_REJECTED");

        m.rejected = true;

        emit MilestoneRejected(milestoneIndex);
    }

    /**
     * Claim refund for rejected milestone
     * Backer gets proportional share of rejected milestone amount
     */
    function claimRefund(uint256 milestoneIndex) external {
        require(milestoneIndex < milestones.length, "INVALID_MILESTONE");
        Milestone storage m = milestones[milestoneIndex];
        
        require(m.rejected, "NOT_REJECTED");
        require(!refundClaimed[msg.sender][milestoneIndex], "ALREADY_CLAIMED");
        require(contributions[msg.sender] > 0, "NO_CONTRIBUTION");

        // Calculate proportional refund
        uint256 refundAmount = (m.amount * contributions[msg.sender]) / raised;
        require(refundAmount > 0, "ZERO_REFUND");
        require(address(this).balance >= refundAmount, "INSUFFICIENT_BALANCE");

        refundClaimed[msg.sender][milestoneIndex] = true;

        // Send refund
        (bool success, ) = msg.sender.call{value: refundAmount}("");
        require(success, "REFUND_FAILED");

        emit RefundIssued(msg.sender, milestoneIndex, refundAmount);
    }

    /**
     * Cancel campaign and enable full refunds
     * Only admin, only if no milestones released yet
     */
    function cancelCampaign() external onlyAdmin notCancelled {
        // Check no milestones have been released
        for (uint256 i = 0; i < milestones.length; i++) {
            require(!milestones[i].released, "MILESTONE_ALREADY_RELEASED");
        }

        cancelled = true;
        emit CampaignCancelled();
    }

    /**
     * Claim full refund after campaign cancellation
     */
    function claimCancellationRefund() external {
        require(cancelled, "NOT_CANCELLED");
        uint256 contribution = contributions[msg.sender];
        require(contribution > 0, "NO_CONTRIBUTION");

        contributions[msg.sender] = 0;

        (bool success, ) = msg.sender.call{value: contribution}("");
        require(success, "REFUND_FAILED");

        emit CancellationRefundIssued(msg.sender, contribution);
    }

    /**
     * Get total number of milestones
     */
    function getMilestonesCount() external view returns (uint256) {
        return milestones.length;
    }

    /**
     * Get milestone details
     */
    function getMilestone(uint256 index) external view returns (
        uint256 amount,
        bool released,
        bool rejected
    ) {
        require(index < milestones.length, "INVALID_MILESTONE");
        Milestone storage m = milestones[index];
        return (m.amount, m.released, m.rejected);
    }

    /**
     * Get pending refund for a backer on a specific milestone
     */
    function getPendingRefund(address backer, uint256 milestoneIndex) external view returns (uint256) {
        require(milestoneIndex < milestones.length, "INVALID_MILESTONE");
        Milestone storage m = milestones[milestoneIndex];
        
        if (!m.rejected || refundClaimed[backer][milestoneIndex] || contributions[backer] == 0) {
            return 0;
        }

        return (m.amount * contributions[backer]) / raised;
    }

    /**
     * Get all pending refunds for a backer across all milestones
     */
    function getAllPendingRefunds(address backer) external view returns (uint256 total) {
        for (uint256 i = 0; i < milestones.length; i++) {
            Milestone storage m = milestones[i];
            if (m.rejected && !refundClaimed[backer][i] && contributions[backer] > 0) {
                total += (m.amount * contributions[backer]) / raised;
            }
        }
        return total;
    }

    /**
     * Get total number of backers
     */
    function getBackerCount() external view returns (uint256) {
        return backerList.length;
    }

    /**
     * Get backer address by index
     */
    function getBackerAddress(uint256 index) external view returns (address) {
        require(index < backerList.length, "INVALID_INDEX");
        return backerList[index];
    }

    /**
     * Transfer admin role
     */
    function transferAdmin(address newAdmin) external onlyAdmin {
        require(newAdmin != address(0), "INVALID_ADMIN");
        admin = newAdmin;
    }

    /**
     * Get contract balance
     */
    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }
}
