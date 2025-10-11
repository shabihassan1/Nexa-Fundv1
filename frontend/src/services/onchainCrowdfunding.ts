import { ethers } from "ethers";
import { NEXA_WEIGHTED_ABI } from "@/abi/nexafundWeightedAbi";

export type WeightedMilestone = {
	index: number;
	description: string;
	amountWei: bigint;
	released: boolean;
	yesPower: bigint;
	noPower: bigint;
	voteStart: number; // unix seconds
	voteEnd: number;   // unix seconds
};

export type WeightedCampaignState = {
	contractAddress: string;
	creator: string;
	admin: string;
	goalWei: bigint;
	raisedWei: bigint;
	milestones: WeightedMilestone[];
};
function getProvider(): ethers.providers.Web3Provider {
  if (!window.ethereum) throw new Error("No injected provider (MetaMask) detected");
  return new ethers.providers.Web3Provider(window.ethereum, "any");
}

function getContract(address: string, signerOrProvider: ethers.Signer | ethers.providers.Provider) {
  return new ethers.Contract(address, NEXA_WEIGHTED_ABI as any, signerOrProvider);
}

export async function readCampaignState(contractAddress: string): Promise<WeightedCampaignState> {
  const provider = getProvider();
  const c = getContract(contractAddress, provider);
  const [creator, admin, goalWei, raisedWei, count] = await Promise.all([
    c.creator(),
    c.admin(),
    c.goal(),
    c.raised(),
    c.getMilestoneCount(),
  ]);

  const milestones: WeightedMilestone[] = [];
  for (let i = 0; i < Number(count); i++) {
    const m = await c.getMilestone(i);
    milestones.push({
      index: i,
      description: m[0],
      amountWei: m[1],
      released: m[2],
      yesPower: m[3],
      noPower: m[4],
      voteStart: Number(m[5]),
      voteEnd: Number(m[6]),
    });
  }

  return { contractAddress, creator, admin, goalWei, raisedWei, milestones };
}

export async function contribute(contractAddress: string, amountEth: string) {
  const provider = getProvider();
  const signer = provider.getSigner();
  const c = getContract(contractAddress, signer);
  const tx = await c.contribute({ value: ethers.utils.parseEther(amountEth) });
  return await tx.wait();
}

export async function openVoting(contractAddress: string, milestoneIndex: number, start: number, end: number) {
  const provider = getProvider();
  const signer = provider.getSigner();
  const c = getContract(contractAddress, signer);
  const tx = await c.openVoting(milestoneIndex, start, end);
  return await tx.wait();
}

export async function vote(contractAddress: string, milestoneIndex: number, approve: boolean) {
  const provider = getProvider();
  const signer = provider.getSigner();
  const c = getContract(contractAddress, signer);
  const tx = await c.voteMilestone(milestoneIndex, approve);
  return await tx.wait();
}

export async function finalize(contractAddress: string, milestoneIndex: number) {
  const provider = getProvider();
  const signer = provider.getSigner();
  const c = getContract(contractAddress, signer);
  const tx = await c.finalize(milestoneIndex);
  return await tx.wait();
}

export async function adminRelease(contractAddress: string, milestoneIndex: number) {
  const provider = getProvider();
  const signer = provider.getSigner();
  const c = getContract(contractAddress, signer);
  const tx = await c.adminRelease(milestoneIndex);
  return await tx.wait();
}

export function computeFutureWindow(bufferSeconds = 120, durationSeconds = 3600) {
  const now = Math.floor(Date.now() / 1000);
  const start = now + bufferSeconds;
  const end = start + durationSeconds;
  return { start, end };
}


