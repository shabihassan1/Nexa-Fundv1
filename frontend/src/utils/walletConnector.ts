import { ethers } from "ethers";

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

// Real contract interaction - Contribute to Campaign with ETH
export const contributeToChain = async (
  provider: ethers.providers.Web3Provider,
  campaignId: string,
  amountInUSD: number,
  recipientAddress: string
): Promise<{ txHash: string; amountInETH: string }> => {
  try {
    // Validate recipient address format first
    if (!ethers.utils.isAddress(recipientAddress)) {
      throw new Error("Invalid recipient address format");
    }

    const signer = provider.getSigner();
    const address = await signer.getAddress();
    
    // Get network information to validate transaction compatibility
    let network;
    try {
      network = await provider.getNetwork();
    } catch (error) {
      console.warn("Could not get network info, attempting direct chainId fetch");
      const hexChainId = await window.ethereum.request({ method: 'eth_chainId' });
      const chainId = parseInt(hexChainId, 16);
      network = { chainId, name: chainId === 1337 ? "ganache" : "unknown" };
    }
    
    console.log("Current network:", network);
    
    // Check if we're on a local development network
    const isLocalNetwork = network.chainId === 1337 || network.chainId === 31337;
    
    console.log("Network analysis:", {
      chainId: network.chainId,
      isLocalNetwork,
      contributorAddress: address,
      recipientAddress,
      networkName: network.name
    });
    
    // For local networks, we need to ensure both sender and recipient are on the same network
    if (isLocalNetwork) {
      console.log("Detected local development network (Ganache/Hardhat)");
      
      // Check if recipient address looks like a real Ethereum address (starts with common patterns)
      // This is a heuristic check - real mainnet addresses often start with certain patterns
      const isLikelyMainnetAddress = recipientAddress.toLowerCase().startsWith('0x') && 
                                   recipientAddress.length === 42 &&
                                   !recipientAddress.toLowerCase().startsWith('0x0000');
      
      console.log("Address analysis:", {
        recipientAddress,
        isLikelyMainnetAddress,
        addressLength: recipientAddress.length,
        startsWithOx: recipientAddress.toLowerCase().startsWith('0x')
      });
      
      if (isLikelyMainnetAddress) {
        // Try to get the balance of the recipient address on the current network
        try {
          const recipientBalance = await provider.getBalance(recipientAddress);
          const contributorBalance = await provider.getBalance(address);
          
          console.log("Balance check:", {
            recipientAddress,
            recipientBalance: ethers.utils.formatEther(recipientBalance),
            contributorAddress: address,
            contributorBalance: ethers.utils.formatEther(contributorBalance)
          });
          
          // For Ganache-to-Ganache transactions, both addresses should exist
          // But recipient can have 0 balance, that's fine
          console.log("✅ Both addresses are accessible on the current network");
          
        } catch (balanceError) {
          console.error("❌ Balance check failed - this indicates a network issue:", balanceError);
          throw new Error(
            `Cannot access recipient address on current network. This usually means:\n` +
            `1. The recipient address (${recipientAddress.slice(0, 10)}...${recipientAddress.slice(-8)}) is not on Ganache\n` +
            `2. Your MetaMask is not properly connected to Ganache\n` +
            `3. There's a network configuration mismatch\n\n` +
            `Please verify both wallets are connected to the same Ganache instance at http://127.0.0.1:7545`
          );
        }
      }
    }
    
    // Get current ETH price in USD (you could use a price oracle in production)
    // For demo purposes, let's assume 1 ETH = $2000 USD
    const ethPriceInUSD = 2000;
    const amountInETH = amountInUSD / ethPriceInUSD;
    const amountInWei = ethers.utils.parseEther(amountInETH.toString());
    
    console.log("Preparing transaction:", {
      contributor: address,
      campaignId,
      amountInUSD,
      amountInETH,
      amountInWei: amountInWei.toString(),
      recipientAddress,
      network: network.name || `Chain ID: ${network.chainId}`
    });
    
    // Check sender balance
    const senderBalance = await provider.getBalance(address);
    if (senderBalance.lt(amountInWei)) {
      throw new Error(`Insufficient funds. You need ${ethers.utils.formatEther(amountInWei)} ETH but only have ${ethers.utils.formatEther(senderBalance)} ETH.`);
    }
    
    // Create the transaction with minimal configuration to avoid ENS issues
    const transaction = {
      to: recipientAddress,
      value: amountInWei,
      gasLimit: 21000, // Standard ETH transfer gas limit
    };
    
    console.log("Sending transaction:", transaction);
    
    // Send the transaction
    const tx = await signer.sendTransaction(transaction);
    
    console.log("Transaction sent:", {
      hash: tx.hash,
      contributor: address,
      campaignId,
      amountInETH,
      recipientAddress,
      network: network.name || `Chain ID: ${network.chainId}`
    });
    
    // Wait for transaction confirmation
    const receipt = await tx.wait();
    
    console.log("Transaction confirmed:", {
      hash: receipt.transactionHash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
      status: receipt.status
    });
    
    if (receipt.status !== 1) {
      throw new Error("Transaction failed on blockchain");
    }
    
    return { 
      txHash: receipt.transactionHash,
      amountInETH: amountInETH.toFixed(6)
    };
  } catch (error) {
    console.error("Error contributing on blockchain:", error);
    
    // Provide more specific error messages
    if (error.message && error.message.includes("Network mismatch")) {
      throw error; // Re-throw our custom network mismatch error
    } else if (error.message && error.message.includes("circuit breaker")) {
      throw new Error(
        "Transaction blocked due to network incompatibility. " +
        "This usually happens when trying to send transactions between different networks (e.g., local Ganache to mainnet). " +
        "Please ensure both sender and recipient are on the same network."
      );
    } else if (error.code === 'UNSUPPORTED_OPERATION') {
      throw new Error("This operation is not supported on the current network. Local development networks like Ganache may have limited functionality.");
    } else if (error.code === 'INSUFFICIENT_FUNDS') {
      throw new Error("Insufficient funds in your wallet to complete this transaction.");
    } else if (error.code === 'ACTION_REJECTED' || error.code === 4001) {
      throw new Error("Transaction was rejected by user.");
    } else if (error.code === 'NETWORK_ERROR') {
      throw new Error("Network error occurred. Please check your connection and try again.");
    } else {
      throw new Error(error.message || "Failed to send transaction");
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
