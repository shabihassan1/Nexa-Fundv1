// ABI for NexaFundWeighted (trimmed to functions/events used by the UI)
// Source: smart-contracts/artifacts/contracts/NexaFundWeighted.sol/NexaFundWeighted.json
export const NEXA_WEIGHTED_ABI = [
	{
		"inputs": [
			{ "internalType": "address", "name": "_creator", "type": "address" },
			{ "internalType": "uint256", "name": "_goal", "type": "uint256" },
			{ "internalType": "string[]", "name": "_descriptions", "type": "string[]" },
			{ "internalType": "uint256[]", "name": "_amounts", "type": "uint256[]" },
			{ "internalType": "uint256", "name": "_minQuorumPower", "type": "uint256" }
		],
		"stateMutability": "nonpayable",
		"type": "constructor"
	},
	{ "anonymous": false, "inputs": [], "name": "Cancelled", "type": "event" },
	{
		"anonymous": false,
		"inputs": [
			{ "indexed": true, "internalType": "address", "name": "backer", "type": "address" },
			{ "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" }
		],
		"name": "Contributed",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{ "indexed": true, "internalType": "uint256", "name": "milestone", "type": "uint256" },
			{ "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" },
			{ "indexed": false, "internalType": "address", "name": "to", "type": "address" }
		],
		"name": "MilestoneReleased",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{ "indexed": true, "internalType": "uint256", "name": "milestone", "type": "uint256" },
			{ "indexed": false, "internalType": "uint64", "name": "start", "type": "uint64" },
			{ "indexed": false, "internalType": "uint64", "name": "end", "type": "uint64" }
		],
		"name": "VotingOpened",
		"type": "event"
	},
	{ "stateMutability": "payable", "type": "receive" },
	{ "inputs": [], "name": "admin", "outputs": [{ "internalType": "address", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" },
	{ "inputs": [], "name": "creator", "outputs": [{ "internalType": "address", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" },
	{ "inputs": [], "name": "goal", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" },
	{ "inputs": [], "name": "raised", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" },
	{ "inputs": [], "name": "getMilestoneCount", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" },
	{
		"inputs": [{ "internalType": "uint256", "name": "i", "type": "uint256" }],
		"name": "getMilestone",
		"outputs": [
			{ "internalType": "string", "name": "description", "type": "string" },
			{ "internalType": "uint256", "name": "amount", "type": "uint256" },
			{ "internalType": "bool", "name": "released", "type": "bool" },
			{ "internalType": "uint256", "name": "yesPower", "type": "uint256" },
			{ "internalType": "uint256", "name": "noPower", "type": "uint256" },
			{ "internalType": "uint64", "name": "voteStart", "type": "uint64" },
			{ "internalType": "uint64", "name": "voteEnd", "type": "uint64" }
		],
		"stateMutability": "view",
		"type": "function"
	},
	{ "inputs": [], "name": "contribute", "outputs": [], "stateMutability": "payable", "type": "function" },
	{
		"inputs": [
			{ "internalType": "uint256", "name": "milestoneIndex", "type": "uint256" },
			{ "internalType": "uint64", "name": "start", "type": "uint64" },
			{ "internalType": "uint64", "name": "end", "type": "uint64" }
		],
		"name": "openVoting",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{ "internalType": "uint256", "name": "milestoneIndex", "type": "uint256" },
			{ "internalType": "bool", "name": "approve", "type": "bool" }
		],
		"name": "voteMilestone",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{ "inputs": [{ "internalType": "uint256", "name": "milestoneIndex", "type": "uint256" }], "name": "finalize", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
	{ "inputs": [{ "internalType": "uint256", "name": "milestoneIndex", "type": "uint256" }], "name": "adminRelease", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
	{ "inputs": [], "name": "cancel", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
	{ "inputs": [{ "internalType": "address", "name": "to", "type": "address" }, { "internalType": "uint256", "name": "amountWei", "type": "uint256" }], "name": "adminRefund", "outputs": [], "stateMutability": "nonpayable", "type": "function" }
];

export type { };


