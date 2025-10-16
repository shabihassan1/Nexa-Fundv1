// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title UniversalEscrow
 * @notice Simple escrow contract - receives payments, releases to anyone, refunds to backers
 * @dev Backend tracks campaigns/milestones. Contract is just a wallet with admin controls.
 */
contract UniversalEscrow {
    address public admin;
    
    // Track total deposited by each backer
    mapping(address => uint256) public deposits;
    
    // Track all backers for enumeration
    address[] public backers;
    mapping(address => bool) public isBackerRegistered;
    
    // Events
    event Deposited(address indexed backer, uint256 amount);
    event Released(address indexed receiver, uint256 amount, string reason);
    event Refunded(address indexed backer, uint256 amount, string reason);
    event AdminChanged(address indexed oldAdmin, address indexed newAdmin);
    
    modifier onlyAdmin() {
        require(msg.sender == admin, "ONLY_ADMIN");
        _;
    }
    
    constructor() {
        admin = msg.sender;
    }
    
    /**
     * @notice Receive payment from any backer
     * @dev Anyone can send funds - contract tracks who sent what
     */
    receive() external payable {
        require(msg.value > 0, "ZERO_AMOUNT");
        
        // Track deposit
        deposits[msg.sender] += msg.value;
        
        // Register backer if first time
        if (!isBackerRegistered[msg.sender]) {
            backers.push(msg.sender);
            isBackerRegistered[msg.sender] = true;
        }
        
        emit Deposited(msg.sender, msg.value);
    }
    
    /**
     * @notice Release funds to any address (milestone approved)
     * @param receiver Address to receive funds (campaign creator)
     * @param amount Amount to release
     * @param reason Description (e.g., "Milestone 1 approved")
     */
    function release(address payable receiver, uint256 amount, string calldata reason) external onlyAdmin {
        require(receiver != address(0), "ZERO_ADDRESS");
        require(amount > 0, "ZERO_AMOUNT");
        require(address(this).balance >= amount, "INSUFFICIENT_BALANCE");
        
        receiver.transfer(amount);
        
        emit Released(receiver, amount, reason);
    }
    
    /**
     * @notice Refund to a specific backer (milestone rejected)
     * @param backer Address to refund
     * @param amount Amount to refund
     * @param reason Description (e.g., "Milestone 1 rejected")
     */
    function refund(address payable backer, uint256 amount, string calldata reason) external onlyAdmin {
        require(backer != address(0), "ZERO_ADDRESS");
        require(amount > 0, "ZERO_AMOUNT");
        require(address(this).balance >= amount, "INSUFFICIENT_BALANCE");
        
        backer.transfer(amount);
        
        emit Refunded(backer, amount, reason);
    }
    
    /**
     * @notice Batch refund to multiple backers
     * @param backerAddresses Array of backer addresses
     * @param amounts Array of amounts to refund (must match backerAddresses length)
     * @param reason Description
     */
    function batchRefund(
        address payable[] calldata backerAddresses, 
        uint256[] calldata amounts,
        string calldata reason
    ) external onlyAdmin {
        require(backerAddresses.length == amounts.length, "LENGTH_MISMATCH");
        
        for (uint256 i = 0; i < backerAddresses.length; i++) {
            require(backerAddresses[i] != address(0), "ZERO_ADDRESS");
            require(amounts[i] > 0, "ZERO_AMOUNT");
            
            backerAddresses[i].transfer(amounts[i]);
            emit Refunded(backerAddresses[i], amounts[i], reason);
        }
    }
    
    /**
     * @notice Get contract balance
     * @return Current balance in wei
     */
    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }
    
    /**
     * @notice Get backer's total deposits
     * @param backer Address to query
     * @return Total deposited by this backer
     */
    function getBackerDeposit(address backer) external view returns (uint256) {
        return deposits[backer];
    }
    
    /**
     * @notice Get all backers
     * @return Array of all backer addresses
     */
    function getAllBackers() external view returns (address[] memory) {
        return backers;
    }
    
    /**
     * @notice Get number of backers
     * @return Count of unique backers
     */
    function getBackerCount() external view returns (uint256) {
        return backers.length;
    }
    
    /**
     * @notice Change admin (emergency only)
     * @param newAdmin New admin address
     */
    function changeAdmin(address newAdmin) external onlyAdmin {
        require(newAdmin != address(0), "ZERO_ADDRESS");
        address oldAdmin = admin;
        admin = newAdmin;
        emit AdminChanged(oldAdmin, newAdmin);
    }
    
    /**
     * @notice Emergency withdraw (only if contract needs to be upgraded)
     * @param receiver Address to receive all funds
     */
    function emergencyWithdraw(address payable receiver) external onlyAdmin {
        require(receiver != address(0), "ZERO_ADDRESS");
        uint256 balance = address(this).balance;
        receiver.transfer(balance);
        emit Released(receiver, balance, "EMERGENCY_WITHDRAWAL");
    }
}
