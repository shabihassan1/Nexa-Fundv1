// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * NexaFundWeighted
 * - Escrows all contributions for a single campaign
 * - Milestone release gated by stake‑weighted voting with quorum and threshold
 * - Admin (platform) can open/close voting windows, override release, cancel, and refund
 * - Safer payout using call, events for off-chain indexing, revert on accidental ether
 */
contract NexaFundWeighted {
    struct Milestone {
        string description;
        uint256 amount;        // reserved amount for this milestone (wei)
        bool released;
        uint256 yesPower;      // stake‑weighted
        uint256 noPower;       // stake‑weighted
        uint64 voteStart;      // unix seconds (0 = not opened)
        uint64 voteEnd;        // unix seconds (0 = not opened)
    }

    // Roles
    address public admin;          // platform/admin
    address public creator;        // campaign owner recipient

    // Funding
    uint256 public immutable goal;     // total goal in wei (sum of milestone amounts)
    uint256 public raised;             // total contributed
    bool public cancelled;             // cancellation flag

    // Voters
    mapping(address => uint256) public contributions; // stake
    mapping(address => mapping(uint256 => bool)) public hasVoted; // backer -> milestone -> voted

    // Milestones
    Milestone[] public milestones;

    // Governance params
    uint256 public constant YES_THRESHOLD_PCT = 60;      // >=60% yes among cast power
    uint256 public immutable MIN_QUORUM_POWER;           // min voting power required (e.g., goal/10)

    // Events
    event Contributed(address indexed backer, uint256 amount);
    event VotingOpened(uint256 indexed milestone, uint64 start, uint64 end);
    event Voted(address indexed backer, uint256 indexed milestone, bool approve, uint256 power);
    event MilestoneReleased(uint256 indexed milestone, uint256 amount, address to);
    event Cancelled();
    event Refunded(address indexed to, uint256 amount);
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
                yesPower: 0,
                noPower: 0,
                voteStart: 0,
                voteEnd: 0
            }));
            sum += _amounts[i];
        }
        require(sum == _goal, "MILESTONES_MUST_EQUAL_GOAL");

        MIN_QUORUM_POWER = _minQuorumPower; // suggest goal/10 off-chain
    }

    // --- Funding ---
    function contribute() external payable notCancelled {
        require(msg.value > 0, "ZERO");
        require(raised + msg.value <= goal, "EXCEEDS_GOAL");
        contributions[msg.sender] += msg.value;
        raised += msg.value;
        emit Contributed(msg.sender, msg.value);
    }

    // --- Governance ---
    function openVoting(uint256 milestoneIndex, uint64 start, uint64 end) external onlyAdmin notCancelled {
        require(milestoneIndex < milestones.length, "OOB");
        require(end > start && start >= block.timestamp, "BAD_WINDOW");
        Milestone storage m = milestones[milestoneIndex];
        require(!m.released, "RELEASED");
        m.voteStart = start;
        m.voteEnd = end;
        emit VotingOpened(milestoneIndex, start, end);
    }

    function voteMilestone(uint256 milestoneIndex, bool approve) external notCancelled {
        require(milestoneIndex < milestones.length, "OOB");
        Milestone storage m = milestones[milestoneIndex];
        require(!m.released, "RELEASED");
        require(m.voteStart != 0 && block.timestamp >= m.voteStart && block.timestamp <= m.voteEnd, "NOT_IN_WINDOW");
        require(!hasVoted[msg.sender][milestoneIndex], "ALREADY_VOTED");

        uint256 power = contributions[msg.sender];
        require(power > 0, "NOT_BACKER");

        hasVoted[msg.sender][milestoneIndex] = true;
        if (approve) m.yesPower += power; else m.noPower += power;
        emit Voted(msg.sender, milestoneIndex, approve, power);

        _maybeRelease(milestoneIndex, m);
    }

    function finalize(uint256 milestoneIndex) external onlyAdmin {
        Milestone storage m = milestones[milestoneIndex];
        require(!m.released, "RELEASED");
        require(m.voteEnd != 0 && block.timestamp > m.voteEnd, "NOT_ENDED");
        _maybeRelease(milestoneIndex, m);
    }

    function adminRelease(uint256 milestoneIndex) external onlyAdmin notCancelled {
        _release(milestoneIndex);
    }

    // --- Admin lifecycle ---
    function cancel() external onlyAdmin {
        require(!cancelled, "ALREADY");
        cancelled = true;
        emit Cancelled();
    }

    function adminRefund(address to, uint256 amountWei) external onlyAdmin {
        require(cancelled, "NOT_CANCELLED");
        (bool ok, ) = payable(to).call{value: amountWei}("");
        require(ok, "REFUND_FAIL");
        emit Refunded(to, amountWei);
    }

    function transferAdmin(address newAdmin) external onlyAdmin {
        require(newAdmin != address(0), "BAD_ADMIN");
        emit AdminTransferred(admin, newAdmin);
        admin = newAdmin;
    }

    // --- Internal helpers ---
    function _maybeRelease(uint256 milestoneIndex, Milestone storage m) internal {
        uint256 totalPower = m.yesPower + m.noPower;
        if (totalPower < MIN_QUORUM_POWER) return; // quorum not reached
        uint256 yesPct = (m.yesPower * 100) / totalPower;
        if (yesPct >= YES_THRESHOLD_PCT) {
            _release(milestoneIndex);
        }
    }

    function _release(uint256 milestoneIndex) internal notCancelled {
        require(milestoneIndex < milestones.length, "OOB");
        Milestone storage m = milestones[milestoneIndex];
        require(!m.released, "RELEASED");
        require(address(this).balance >= m.amount, "INSUFFICIENT");
        m.released = true;
        (bool ok, ) = payable(creator).call{value: m.amount}("");
        require(ok, "TRANSFER_FAIL");
        emit MilestoneReleased(milestoneIndex, m.amount, creator);
    }

    // --- Views ---
    function getMilestoneCount() external view returns (uint256) { return milestones.length; }
    function getMilestone(uint256 i) external view returns (
        string memory description,
        uint256 amount,
        bool released,
        uint256 yesPower,
        uint256 noPower,
        uint64 voteStart,
        uint64 voteEnd
    ) {
        Milestone memory m = milestones[i];
        return (m.description, m.amount, m.released, m.yesPower, m.noPower, m.voteStart, m.voteEnd);
    }

    // block accidental ether sends
    receive() external payable { revert("USE_CONTRIBUTE"); }
    fallback() external payable { revert(); }
}


