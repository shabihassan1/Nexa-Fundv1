import { ethers } from "ethers";
import { NEXA_WEIGHTED_ABI } from "@/abi/nexafundWeightedAbi";
import { getContractAddress } from "./web3";

/**
 * Contract Interaction Helper
 * Provides easy-to-use functions for interacting with NexaFundWeighted contract
 */

/**
 * Get contract instance with signer (for write operations)
 */
export function getContractWithSigner(
  provider: ethers.providers.Web3Provider
): ethers.Contract {
  const signer = provider.getSigner();
  return new ethers.Contract(getContractAddress(), NEXA_WEIGHTED_ABI, signer);
}

/**
 * Get contract instance with provider (for read operations)
 */
export function getContractReadOnly(
  provider: ethers.providers.Provider
): ethers.Contract {
  return new ethers.Contract(getContractAddress(), NEXA_WEIGHTED_ABI, provider);
}

/**
 * Contribute POL to the campaign
 * @param provider Web3Provider from wallet
 * @param amountInPOL Amount to contribute in POL
 * @returns Transaction hash
 */
export async function contributeToContract(
  provider: ethers.providers.Web3Provider,
  amountInPOL: number
): Promise<{ txHash: string; amountInPOL: string }> {
  try {
    const contract = getContractWithSigner(provider);
    const amountInWei = ethers.utils.parseEther(amountInPOL.toString());

    console.log("Contributing to contract:", {
      contract: getContractAddress(),
      amountInPOL,
      amountInWei: amountInWei.toString(),
    });

    // PRE-CHECK: Validate contribution won't exceed goal
    try {
      const [goal, raised] = await Promise.all([
        contract.goal(),
        contract.raised(),
      ]);
      
      const goalBN = ethers.BigNumber.from(goal);
      const raisedBN = ethers.BigNumber.from(raised);
      const remaining = goalBN.sub(raisedBN);
      
      console.log("Campaign status:", {
        goal: ethers.utils.formatEther(goal) + " POL",
        raised: ethers.utils.formatEther(raised) + " POL",
        remaining: ethers.utils.formatEther(remaining) + " POL",
        attempting: amountInPOL + " POL"
      });
      
      if (amountInWei.gt(remaining)) {
        const remainingPOL = parseFloat(ethers.utils.formatEther(remaining));
        throw new Error(
          `Contribution exceeds campaign goal! Only ${remainingPOL.toFixed(4)} POL remaining. ` +
          `You're trying to contribute ${amountInPOL} POL. Please reduce your contribution amount.`
        );
      }
    } catch (error: any) {
      // If it's our custom error, re-throw it
      if (error.message?.includes("exceeds campaign goal")) {
        throw error;
      }
      // Otherwise continue - maybe contract doesn't support these methods
      console.warn("Could not pre-check campaign state:", error.message);
    }

    // Call the contribute() function
    const tx = await contract.contribute({ value: amountInWei });
    
    console.log("Transaction sent:", tx.hash);
    
    // Wait for confirmation
    const receipt = await tx.wait();
    
    console.log("Transaction confirmed:", {
      hash: receipt.transactionHash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
    });

    return {
      txHash: receipt.transactionHash,
      amountInPOL: amountInPOL.toFixed(6),
    };
  } catch (error: any) {
    console.error("Error contributing to contract:", error);
    
    // Decode revert reason from error data
    let revertReason = "";
    if (error.error?.data?.data) {
      try {
        // Decode the hex data (0x08c379a0... is the signature for Error(string))
        const hexData = error.error.data.data;
        if (hexData.startsWith("0x08c379a0")) {
          // Remove function signature (first 4 bytes / 8 hex chars after 0x)
          const dataWithoutSig = "0x" + hexData.slice(10);
          const decoded = ethers.utils.defaultAbiCoder.decode(["string"], dataWithoutSig);
          revertReason = decoded[0];
          console.log("Decoded revert reason:", revertReason);
        }
      } catch (decodeError) {
        console.warn("Could not decode revert reason:", decodeError);
      }
    }
    
    // Provide user-friendly error messages
    if (error.code === "INSUFFICIENT_FUNDS") {
      throw new Error("Insufficient POL balance to complete this transaction");
    } else if (error.code === 4001 || error.code === "ACTION_REJECTED") {
      throw new Error("Transaction rejected by user");
    } else if (revertReason === "EXCEEDS_GOAL" || error.message?.includes("exceeds goal") || error.message?.includes("EXCEEDS_GOAL")) {
      throw new Error("Contribution would exceed the campaign goal. Please reduce your contribution amount.");
    } else if (revertReason === "CANCELLED") {
      throw new Error("This campaign has been cancelled and can no longer accept contributions");
    } else if (revertReason === "ZERO") {
      throw new Error("Contribution amount must be greater than zero");
    } else if (error.message?.includes("exceeds campaign goal")) {
      // Our custom pre-check error
      throw error;
    } else {
      throw new Error(error.reason || error.message || "Failed to contribute to campaign");
    }
  }
}

/**
 * Get campaign state from contract
 */
export async function getCampaignState(
  provider: ethers.providers.Provider
): Promise<{
  goal: string;
  raised: string;
  admin: string;
  creator: string;
  cancelled: boolean;
}> {
  const contract = getContractReadOnly(provider);
  
  const [goal, raised, admin, creator, cancelled] = await Promise.all([
    contract.goal(),
    contract.raised(),
    contract.admin(),
    contract.creator(),
    contract.cancelled(),
  ]);

  return {
    goal: ethers.utils.formatEther(goal),
    raised: ethers.utils.formatEther(raised),
    admin,
    creator,
    cancelled,
  };
}

/**
 * Get user's contribution amount
 */
export async function getUserContribution(
  provider: ethers.providers.Provider,
  userAddress: string
): Promise<string> {
  const contract = getContractReadOnly(provider);
  const contribution = await contract.contributions(userAddress);
  return ethers.utils.formatEther(contribution);
}

/**
 * Get milestone details
 */
export async function getMilestone(
  provider: ethers.providers.Provider,
  milestoneIndex: number
): Promise<{
  description: string;
  amount: string;
  released: boolean;
  yesPower: string;
  noPower: string;
  voteStart: number;
  voteEnd: number;
}> {
  const contract = getContractReadOnly(provider);
  const milestone = await contract.getMilestone(milestoneIndex);

  return {
    description: milestone.description,
    amount: ethers.utils.formatEther(milestone.amount),
    released: milestone.released,
    yesPower: ethers.utils.formatEther(milestone.yesPower),
    noPower: ethers.utils.formatEther(milestone.noPower),
    voteStart: milestone.voteStart,
    voteEnd: milestone.voteEnd,
  };
}

/**
 * Get total number of milestones
 */
export async function getMilestoneCount(
  provider: ethers.providers.Provider
): Promise<number> {
  const contract = getContractReadOnly(provider);
  const count = await contract.getMilestoneCount();
  return count.toNumber();
}

/**
 * Vote on a milestone (backers only)
 */
export async function voteOnMilestone(
  provider: ethers.providers.Web3Provider,
  milestoneIndex: number,
  approve: boolean
): Promise<string> {
  try {
    const contract = getContractWithSigner(provider);
    const tx = await contract.voteMilestone(milestoneIndex, approve);
    const receipt = await tx.wait();
    return receipt.transactionHash;
  } catch (error: any) {
    console.error("Error voting on milestone:", error);
    
    if (error.message?.includes("NOT_BACKER")) {
      throw new Error("Only campaign backers can vote");
    } else if (error.message?.includes("ALREADY_VOTED")) {
      throw new Error("You have already voted on this milestone");
    } else if (error.message?.includes("NOT_IN_WINDOW")) {
      throw new Error("Voting window is not open for this milestone");
    } else {
      throw new Error(error.message || "Failed to vote on milestone");
    }
  }
}

/**
 * Check if user has voted on a milestone
 */
export async function hasUserVoted(
  provider: ethers.providers.Provider,
  userAddress: string,
  milestoneIndex: number
): Promise<boolean> {
  const contract = getContractReadOnly(provider);
  return await contract.hasVoted(userAddress, milestoneIndex);
}
