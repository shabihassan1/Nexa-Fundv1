import { ethers } from "ethers";
import { contributeToContract } from "@/lib/contractInteraction";
import { ensureTenderlyVTN } from "@/lib/web3";

export type WalletState = {
  address: string | null;
  connected: boolean;
  chainId: number | null;
  provider: ethers.providers.Web3Provider | null;
};

export const initialWalletState: WalletState = {
  address: null,
  connected: false,
  chainId: null,
  provider: null,
};

// Check if MetaMask is installed
export const isMetaMaskInstalled = (): boolean => {
  return typeof window !== "undefined" && 
         typeof window.ethereum !== "undefined" && 
         window.ethereum.isMetaMask === true;
};

// Get Ethereum provider
export const getProvider = (): ethers.providers.Web3Provider | null => {
  if (!isMetaMaskInstalled()) return null;
  try {
    // Create provider with "any" network to avoid ENS issues on local networks
    const provider = new ethers.providers.Web3Provider(window.ethereum, "any");
    
    // Override getNetwork to handle local development networks properly
    const originalGetNetwork = provider.getNetwork.bind(provider);
    provider.getNetwork = async () => {
      try {
        const network = await originalGetNetwork();
        // For local development networks (Ganache, Hardhat), disable ENS
        if (network.chainId === 1337 || network.chainId === 31337) {
          return {
            ...network,
            name: network.chainId === 1337 ? "ganache" : "hardhat",
            ensAddress: null // Disable ENS for local networks
          };
        }
        return network;
      } catch (error) {
        console.warn("Network detection failed, creating fallback network info");
        // Fallback for when network detection fails
        const chainIdHex = await window.ethereum.request({ method: 'eth_chainId' });
        const chainId = parseInt(chainIdHex, 16);
        return {
          chainId,
          name: chainId === 1337 ? "ganache" : chainId === 31337 ? "hardhat" : "unknown",
          ensAddress: null
        };
      }
    };
    
    return provider;
  } catch (error) {
    console.error("Error creating provider:", error);
    return null;
  }
};

// Connect to MetaMask
export const connectWallet = async (): Promise<WalletState> => {
  try {
    if (!isMetaMaskInstalled()) {
      console.error("MetaMask is not installed");
      throw new Error("MetaMask is not installed");
    }

    const provider = getProvider();
    if (!provider) {
      console.error("Failed to get provider");
      throw new Error("Failed to get provider");
    }

    // Request account access
    await provider.send("eth_requestAccounts", []);
    const signer = provider.getSigner();
    const address = await signer.getAddress();
    
    // Get network information with fallback
    let chainId = 1; // Default to mainnet
    try {
    const network = await provider.getNetwork();
      chainId = network.chainId;
    } catch (networkError) {
      console.warn("Could not detect network, using default:", networkError);
      // Try to get chainId directly from MetaMask
      try {
        const hexChainId = await window.ethereum.request({ method: 'eth_chainId' });
        chainId = parseInt(hexChainId, 16);
      } catch (chainError) {
        console.warn("Could not get chainId, using default mainnet");
      }
    }
    
    console.log("Connected successfully:", { address, chainId });

    return {
      address,
      connected: true,
      chainId,
      provider,
    };
  } catch (error) {
    console.error("Error connecting to MetaMask:", error);
    return initialWalletState;
  }
};

// Handle account change events
export const handleAccountsChanged = (
  accounts: string[],
  callback: (address: string | null) => void
): void => {
  if (accounts.length === 0) {
    callback(null);
  } else {
    callback(accounts[0]);
  }
};

// Handle chain change events
export const handleChainChanged = (
  chainId: string,
  callback: (chainId: number) => void
): void => {
  callback(parseInt(chainId, 16));
};

// Simulated contract interaction - Create Campaign
export const createCampaignOnChain = async (
  provider: ethers.providers.Web3Provider,
  campaignData: {
    title: string;
    description: string;
    goal: number;
    duration: number;
    ipfsHash: string;
  }
): Promise<{ txHash: string }> => {
  try {
    // In a real implementation, this would:
    // 1. Connect to the actual smart contract
    // 2. Call the createCampaign function with the provided data
    // 3. Return the transaction hash

    // Simulating a transaction for now
    const signer = provider.getSigner();
    const address = await signer.getAddress();
    
    // Simulate a delay to mimic blockchain transaction time
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Generate a fake transaction hash
    const txHash = `0x${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
    
    console.log("Campaign created on blockchain:", {
      creator: address,
      title: campaignData.title,
      goal: campaignData.goal,
      txHash,
    });
    
    return { txHash };
  } catch (error) {
    console.error("Error creating campaign on blockchain:", error);
    throw error;
  }
};

// NEW: Contract-based contribution - Funds go to ESCROW, not creator directly
export const contributeToChain = async (
  provider: ethers.providers.Web3Provider,
  campaignId: string,
  amountInUSD: number,
  recipientAddress: string  // Note: This is now unused - funds go to contract
): Promise<{ txHash: string; amountInETH: string }> => {
  try {
    console.log("🚀 Contributing to contract escrow:", {
      campaignId,
      amountInUSD,
      contractAddress: import.meta.env.VITE_CONTRACT_ADDRESS
    });

    // Ensure on correct network
    await ensureTenderlyVTN();
    
    const signer = provider.getSigner();
    const address = await signer.getAddress();
    
    // Convert USD to POL
    // TODO: Use real price oracle API in production
    const polPriceInUSD = 0.50; // Example: 1 POL = $0.50
    const amountInPOL = amountInUSD / polPriceInUSD;
    
    console.log("💰 Conversion:", {
      amountInUSD,
      polPriceInUSD,
      amountInPOL,
      contributor: address
    });
    
    // Check sender balance
    const senderBalance = await provider.getBalance(address);
    const amountInWei = ethers.utils.parseEther(amountInPOL.toString());
    
    if (senderBalance.lt(amountInWei)) {
      throw new Error(
        `Insufficient POL balance. You need ${amountInPOL.toFixed(4)} POL but only have ${ethers.utils.formatEther(senderBalance)} POL.`
      );
    }
    
    // Send POL directly to UniversalEscrow contract - funds tracked by wallet address
    console.log("📤 Sending POL to UniversalEscrow contract...");
    const result = await contributeToContract(provider, amountInPOL);
    
    console.log("✅ Contribution successful - funds locked in escrow:", {
      txHash: result.txHash,
      amountInPOL: result.amountInPOL,
      contractAddress: import.meta.env.VITE_CONTRACT_ADDRESS
    });
    
    return {
      txHash: result.txHash,
      amountInETH: result.amountInPOL  // Return as "amountInETH" for compatibility
    };
    
  } catch (error) {
    console.error("❌ Error contributing to contract:", error);
    
    // Provide user-friendly error messages
    if (error.code === 'INSUFFICIENT_FUNDS' || error.message?.includes("Insufficient")) {
      throw new Error("Insufficient POL balance to complete this transaction.");
    } else if (error.code === 'ACTION_REJECTED' || error.code === 4001) {
      throw new Error("Transaction was rejected by user.");
    } else if (error.message?.includes("exceeds goal")) {
      throw new Error("Contribution would exceed campaign goal.");
    } else if (error.message?.includes("network")) {
      throw new Error("Please switch to NexaFund VTN network in MetaMask.");
    } else {
      throw new Error(error.message || "Failed to contribute to campaign");
    }
  }
};

// Simulated contract interaction - Fetch Campaign Data
export const fetchCampaignsFromChain = async (
  provider: ethers.providers.Web3Provider
): Promise<any[]> => {
  try {
    // In a real implementation, this would:
    // 1. Connect to the actual smart contract
    // 2. Call a view function to get all campaigns
    // 3. Return the campaign data

    // Simulate a delay to mimic blockchain call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Return simulated data
    return [
      {
        id: "0",
        title: "Blockchain Game Development",
        description: "Creating a new play-to-earn game on Ethereum",
        goal: 50000,
        raised: 12500,
        creator: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
        ipfsHash: "ipfs://QmT7fTc6Zv3RKxjm9Qz4vVkQzgCp5xuvQzPfUJAKoqevio",
        daysLeft: 20,
      },
      {
        id: "1",
        title: "Decentralized Energy Trading",
        description: "A platform for P2P clean energy trading",
        goal: 75000,
        raised: 45000,
        creator: "0x8F174594BA4a0925A9FdF164aBaA4748a566c700",
        ipfsHash: "ipfs://QmUvZR7LRgYS7JZYWse9xDgSsQZ3wxKNj5RVKS52vtVe2q",
        daysLeft: 15,
      }
    ];
  } catch (error) {
    console.error("Error fetching campaigns from blockchain:", error);
    return [];
  }
};
