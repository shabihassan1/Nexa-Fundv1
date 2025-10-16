// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * NexaFundWeightedV2 - TRUE ESCROW WITH AUTO-RELEASE & REFUNDS
 * 
 * Key Changes from V1:
 * ✅ Auto-release to creator when milestone approved (no creator action needed)
 * ✅ Auto-refund system for rejected milestones
 * ✅ Backer-initiated refund claims for rejected milestones
 * ✅ Full campaign refund on cancellation
 * ✅ Admin emergency force-release (reconciliation)
 * ✅ Proper escrow behavior - funds move automatically based on voting results
 * 
 * Flow:
 * 1. Backer contributes (signs with their key)
 * 2. Voting happens
 * 3a. APPROVED → Contract auto-sends to creator ✅
 * 3b. REJECTED → Contract marks for refund, backers claim back 🔄
 * 4. Admin can force-release if auto-release fails 🔧
 */
contract NexaFundWeightedV2 {
    struct Milestone {
        string description;
        uint256 amount;        // reserved amount for this milestone (wei)
        bool released;         // funds sent to creator
        bool rejected;         // voting failed, funds available for refund
        uint256 yesPower;      // stake‑weighted yes votes
        uint256 noPower;       // stake‑weighted no votes
        uint64 voteStart;      // unix seconds (0 = not opened)
        uint64 voteEnd;        // unix seconds (0 = not opened)
    }

    // Roles
    address public admin;          // platform/admin
    address public creator;        // campaign owner/recipient

    // Funding
    uint256 public immutable goal;     // total goal in wei (sum of milestone amounts)
    uint256 public raised;             // total contributed
    bool public cancelled;             // cancellation flag

    // Voters & Contributions
    mapping(address => uint256) public contributions; // backer -> total stake
    mapping(address => mapping(uint256 => bool)) public hasVoted; // backer -> milestone -> voted
    
    // Refunds
    mapping(address => mapping(uint256 => bool)) public refundClaimed; // backer -> milestone -> claimed
    mapping(uint256 => uint256) public totalRefunded; // milestone -> total refunded so far

    // Milestones
    Milestone[] public milestones;

    // Governance params
    uint256 public constant YES_THRESHOLD_PCT = 60;      // >=60% yes among cast power
    uint256 public immutable MIN_QUORUM_POWER;           // min voting power required

    // Events
    event Contributed(address indexed backer, uint256 amount);
    event VotingOpened(uint256 indexed milestone, uint64 start, uint64 end);
    event Voted(address indexed backer, uint256 indexed milestone, bool approve, uint256 power);
    event MilestoneReleased(uint256 indexed milestone, uint256 amount, address indexed to);
    event MilestoneRejected(uint256 indexed milestone, string reason);
    event RefundIssued(address indexed backer, uint256 indexed milestone, uint256 amount);
    event Cancelled();
    event AdminTransferred(address indexed oldAdmin, address indexed newAdmin);

    modifier onlyAdmin() { require(msg.sender == admin, "ONLY_ADMIN"); _; }
    modifier notCancelled() { require(!cancelled, "CANCELLED"); _; }

    constructor(
        address _creator,
        uint256 _goal,
        string[] memory _descriptions,
        uint256[] memory _amounts,
        uint256 _minQuorumPower
    ) {
        require(_creator != address(0), "BAD_CREATOR");
        require(_descriptions.length == _amounts.length, "LENGTH_MISMATCH");
        creator = _creator;
        admin = msg.sender;
        goal = _goal;

        uint256 sum;
        for (uint256 i = 0; i < _descriptions.length; i++) {
            milestones.push(Milestone({
                description: _descriptions[i],
                amount: _amounts[i],
                released: false,
                rejected: false,
                yesPower: 0,
                noPower: 0,
                voteStart: 0,
                voteEnd: 0
            }));
            sum += _amounts[i];
        }
        require(sum == _goal, "MILESTONES_MUST_EQUAL_GOAL");

        MIN_QUORUM_POWER = _minQuorumPower;
    }

    // --- Funding ---
    function contribute() external payable notCancelled {
        require(msg.value > 0, "ZERO");
        require(raised + msg.value <= goal, "EXCEEDS_GOAL");
        contributions[msg.sender] += msg.value;
        raised += msg.value;
        emit Contributed(msg.sender, msg.value);
    }

    // --- Governance & Voting ---
    function openVoting(uint256 milestoneIndex, uint64 start, uint64 end) external onlyAdmin notCancelled {
        require(milestoneIndex < milestones.length, "OOB");
        require(end > start && start >= block.timestamp, "BAD_WINDOW");
        Milestone storage m = milestones[milestoneIndex];
        require(!m.released && !m.rejected, "ALREADY_FINALIZED");
        m.voteStart = start;
        m.voteEnd = end;
        emit VotingOpened(milestoneIndex, start, end);
    }

    function voteMilestone(uint256 milestoneIndex, bool approve) external notCancelled {
        require(milestoneIndex < milestones.length, "OOB");
        Milestone storage m = milestones[milestoneIndex];
        require(!m.released && !m.rejected, "ALREADY_FINALIZED");
        require(m.voteStart != 0 && block.timestamp >= m.voteStart && block.timestamp <= m.voteEnd, "NOT_IN_WINDOW");
        require(!hasVoted[msg.sender][milestoneIndex], "ALREADY_VOTED");

        uint256 power = contributions[msg.sender];
        require(power > 0, "NOT_BACKER");

        hasVoted[msg.sender][milestoneIndex] = true;
        if (approve) m.yesPower += power; else m.noPower += power;
        emit Voted(msg.sender, milestoneIndex, approve, power);

        _checkAndFinalizeVote(milestoneIndex, m);
    }

    function finalize(uint256 milestoneIndex) external onlyAdmin {
        Milestone storage m = milestones[milestoneIndex];
        require(!m.released && !m.rejected, "ALREADY_FINALIZED");
        require(m.voteEnd != 0 && block.timestamp > m.voteEnd, "NOT_ENDED");
        _checkAndFinalizeVote(milestoneIndex, m);
    }

    // --- Refund System for Rejected Milestones ---
    /**
     * @notice Backer claims refund for a rejected milestone
     * @dev Backer gets proportional refund based on their contribution
     */
    function claimRefund(uint256 milestoneIndex) external notCancelled {
        require(milestoneIndex < milestones.length, "OOB");
        Milestone storage m = milestones[milestoneIndex];
        require(m.rejected, "NOT_REJECTED");
        require(!refundClaimed[msg.sender][milestoneIndex], "ALREADY_CLAIMED");
        
        uint256 backerContribution = contributions[msg.sender];
        require(backerContribution > 0, "NO_CONTRIBUTION");

        // Calculate proportional refund: (backer's contribution / total raised) * milestone amount
        uint256 refundAmount = (backerContribution * m.amount) / raised;
        require(address(this).balance >= refundAmount, "INSUFFICIENT_BALANCE");

        refundClaimed[msg.sender][milestoneIndex] = true;
        totalRefunded[milestoneIndex] += refundAmount;

        (bool ok, ) = payable(msg.sender).call{value: refundAmount}("");
        require(ok, "REFUND_TRANSFER_FAIL");

        emit RefundIssued(msg.sender, milestoneIndex, refundAmount);
    }

    /**
     * @notice Admin marks milestone as rejected and opens it for refunds
     * @dev Called when voting fails or milestone cannot be completed
     */
    function adminRejectMilestone(uint256 milestoneIndex, string calldata reason) external onlyAdmin notCancelled {
        require(milestoneIndex < milestones.length, "OOB");
        Milestone storage m = milestones[milestoneIndex];
        require(!m.released && !m.rejected, "ALREADY_FINALIZED");

        m.rejected = true;
        emit MilestoneRejected(milestoneIndex, reason);
    }

    // --- Admin Emergency Force Release ---
    /**
     * @notice Admin force-releases milestone funds to creator
     * @dev For reconciliation when auto-release fails
     */
    function adminForceRelease(uint256 milestoneIndex) external onlyAdmin notCancelled {
        require(milestoneIndex < milestones.length, "OOB");
        Milestone storage m = milestones[milestoneIndex];
        require(!m.released, "ALREADY_RELEASED");
        require(!m.rejected, "MILESTONE_REJECTED");
        
        _releaseToCreator(milestoneIndex, m);
    }

    // --- Campaign Cancellation & Full Refund ---
    /**
     * @notice Cancel campaign and enable full refunds for all backers
     * @dev Called when campaign fails to reach goal or creator abandons
     */
    function cancel() external onlyAdmin {
        require(!cancelled, "ALREADY_CANCELLED");
        cancelled = true;
        emit Cancelled();
    }

    /**
     * @notice Backer claims full refund when campaign is cancelled
     * @dev Returns full contribution amount to backer
     */
    function claimCancellationRefund() external {
        require(cancelled, "NOT_CANCELLED");
        
        uint256 backerContribution = contributions[msg.sender];
        require(backerContribution > 0, "NO_CONTRIBUTION");
        
        contributions[msg.sender] = 0; // Prevent re-entrancy
        
        (bool ok, ) = payable(msg.sender).call{value: backerContribution}("");
        require(ok, "REFUND_TRANSFER_FAIL");
        
        emit RefundIssued(msg.sender, type(uint256).max, backerContribution); // max uint = full refund
    }

    /**
     * @notice Admin manually refunds specific backer (emergency)
     * @dev For edge cases or dispute resolution
     */
    function adminRefund(address to, uint256 amountWei) external onlyAdmin {
        require(cancelled, "NOT_CANCELLED");
        require(to != address(0), "BAD_ADDRESS");
        
        (bool ok, ) = payable(to).call{value: amountWei}("");
        require(ok, "REFUND_TRANSFER_FAIL");
        
        emit RefundIssued(to, type(uint256).max, amountWei);
    }

    function transferAdmin(address newAdmin) external onlyAdmin {
        require(newAdmin != address(0), "BAD_ADMIN");
        emit AdminTransferred(admin, newAdmin);
        admin = newAdmin;
    }

    // --- Internal helpers ---
    /**
     * @notice Check voting results and finalize (release or reject)
     * @dev Called after each vote and when admin finalizes
     */
    function _checkAndFinalizeVote(uint256 milestoneIndex, Milestone storage m) internal {
        uint256 totalPower = m.yesPower + m.noPower;
        
        // Check if quorum met
        if (totalPower < MIN_QUORUM_POWER) return;
        
        // Calculate yes percentage
        uint256 yesPct = (m.yesPower * 100) / totalPower;
        
        if (yesPct >= YES_THRESHOLD_PCT) {
            // APPROVED - Auto-release to creator
            _releaseToCreator(milestoneIndex, m);
        } else {
            // REJECTED - Mark for refund
            m.rejected = true;
            emit MilestoneRejected(milestoneIndex, "Voting failed to reach approval threshold");
        }
    }

    /**
     * @notice Release milestone funds to creator
     * @dev Automatically sends funds - creator doesn't need to do anything
     */
    function _releaseToCreator(uint256 milestoneIndex, Milestone storage m) internal {
        require(address(this).balance >= m.amount, "INSUFFICIENT_BALANCE");
        
        m.released = true;
        
        (bool ok, ) = payable(creator).call{value: m.amount}("");
        require(ok, "TRANSFER_TO_CREATOR_FAIL");
        
        emit MilestoneReleased(milestoneIndex, m.amount, creator);
    }

    // --- Views ---
    function getMilestoneCount() external view returns (uint256) { 
        return milestones.length; 
    }
    
    function getMilestone(uint256 i) external view returns (
        string memory description,
        uint256 amount,
        bool released,
        bool rejected,
        uint256 yesPower,
        uint256 noPower,
        uint64 voteStart,
        uint64 voteEnd
    ) {
        Milestone memory m = milestones[i];
        return (m.description, m.amount, m.released, m.rejected, m.yesPower, m.noPower, m.voteStart, m.voteEnd);
    }

    /**
     * @notice Get refund amount available for backer for specific milestone
     */
    function getRefundAmount(address backer, uint256 milestoneIndex) external view returns (uint256) {
        if (milestoneIndex >= milestones.length) return 0;
        Milestone memory m = milestones[milestoneIndex];
        if (!m.rejected) return 0;
        if (refundClaimed[backer][milestoneIndex]) return 0;
        
        uint256 backerContribution = contributions[backer];
        if (backerContribution == 0) return 0;
        
        return (backerContribution * m.amount) / raised;
    }

    /**
     * @notice Get all rejected milestones with pending refunds for a backer
     */
    function getPendingRefunds(address backer) external view returns (
        uint256[] memory milestoneIndices,
        uint256[] memory refundAmounts
    ) {
        uint256 count = 0;
        for (uint256 i = 0; i < milestones.length; i++) {
            if (milestones[i].rejected && !refundClaimed[backer][i] && contributions[backer] > 0) {
                count++;
            }
        }

        milestoneIndices = new uint256[](count);
        refundAmounts = new uint256[](count);
        uint256 idx = 0;

        for (uint256 i = 0; i < milestones.length; i++) {
            if (milestones[i].rejected && !refundClaimed[backer][i] && contributions[backer] > 0) {
                milestoneIndices[idx] = i;
                refundAmounts[idx] = (contributions[backer] * milestones[i].amount) / raised;
                idx++;
            }
        }
    }

    // block accidental ether sends
    receive() external payable { revert("USE_CONTRIBUTE"); }
    fallback() external payable { revert(); }
}
