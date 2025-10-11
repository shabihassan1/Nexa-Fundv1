import React, { createContext, useContext, useState, useEffect } from "react";
import { toast } from "@/hooks/use-toast";
import { updateProfile } from "@/services/authService";
import { useAuth } from "@/contexts/AuthContext";
import {
  connectWallet,
  handleAccountsChanged,
  handleChainChanged,
  initialWalletState,
  isMetaMaskInstalled,
  WalletState,
  createCampaignOnChain,
  contributeToChain,
  fetchCampaignsFromChain
} from "@/utils/walletConnector";

interface WalletContextType {
  wallet: WalletState;
  connect: () => Promise<void>;
  disconnect: () => void;
  isLoading: boolean;
  createCampaign: (campaignData: {
    title: string;
    description: string;
    goal: number;
    duration: number;
    ipfsHash: string;
  }) => Promise<{ txHash: string }>;
  contribute: (campaignId: string, amountInUSD: number, recipientAddress: string) => Promise<{ txHash: string; amountInETH: string }>;
  fetchChainCampaigns: () => Promise<any[]>;
}

// Create the context with a meaningful default value
const WalletContext = createContext<WalletContextType>({
  wallet: initialWalletState,
  connect: async () => {},
  disconnect: () => {},
  isLoading: false,
  createCampaign: async () => ({ txHash: "" }),
  contribute: async () => ({ txHash: "", amountInETH: "" }),
  fetchChainCampaigns: async () => []
});

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [wallet, setWallet] = useState<WalletState>(initialWalletState);
  const [isLoading, setIsLoading] = useState(false);
  const { refreshUser } = useAuth();

  // Load previous wallet connection if exists
  useEffect(() => {
    const checkPreviousConnection = async () => {
      const storedAddress = localStorage.getItem("walletAddress");
      if (isMetaMaskInstalled() && storedAddress) {
        try {
          // Check if MetaMask still has this account connected
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts && accounts.length > 0 && accounts.includes(storedAddress)) {
            console.log("Reconnecting to previously connected wallet:", storedAddress);
            handleConnect(false);
          } else {
            console.log("Previously connected wallet not found in MetaMask, clearing localStorage");
            localStorage.removeItem("walletAddress");
          }
        } catch (error) {
          console.error("Failed to check previous connection:", error);
          localStorage.removeItem("walletAddress");
        }
      }
    };
    
    // Add a small delay to prevent immediate reconnection after disconnect
    const timeoutId = setTimeout(checkPreviousConnection, 1000);
    return () => clearTimeout(timeoutId);
  }, []);

  // Set up event listeners
  useEffect(() => {
    if (!isMetaMaskInstalled()) return;

    const handleAccountsChangedCallback = (accounts: string[]) => {
      handleAccountsChanged(accounts, (address) => {
        if (address) {
          setWallet(prev => ({ ...prev, address, connected: true }));
          localStorage.setItem("walletAddress", address);
          
          // Try to update the user's wallet address in their profile
          updateUserWalletAddress(address);
          
          toast({
            title: "Account changed",
            description: `Connected to: ${address.substring(0, 6)}...${address.substring(address.length - 4)}`,
          });
        } else {
          disconnect();
          toast({
            title: "Disconnected",
            description: "Your wallet has been disconnected",
            variant: "destructive",
          });
        }
      });
    };

    const handleChainChangedCallback = (chainId: string) => {
      handleChainChanged(chainId, (newChainId) => {
        setWallet(prev => ({ ...prev, chainId: newChainId }));
        toast({
          title: "Network changed",
          description: `Switched to network with Chain ID: ${newChainId}`,
        });
      });
    };

    // Use the correct event handling for MetaMask
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", handleAccountsChangedCallback);
      window.ethereum.on("chainChanged", handleChainChangedCallback);
      
      // Check if already connected when component mounts
      window.ethereum.request({ method: 'eth_accounts' })
        .then((accounts: string[]) => {
          if (accounts && accounts.length > 0) {
            handleConnect(false);
          }
        })
        .catch(console.error);
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener("accountsChanged", handleAccountsChangedCallback);
        window.ethereum.removeListener("chainChanged", handleChainChangedCallback);
      }
    };
  }, []);

  // Helper function to update user's wallet address in their profile
  const updateUserWalletAddress = async (walletAddress: string) => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        await updateProfile({ walletAddress: walletAddress }, token);
        console.log(`Successfully updated wallet address in profile: ${walletAddress}`);
      }
    } catch (error) {
      console.log("Could not update wallet address in profile:", error.message);
      // Don't show error to user as this is a background operation
    }
  };

  const handleConnect = async (showToasts = true) => {
    try {
      setIsLoading(true);

      if (!isMetaMaskInstalled()) {
        if (showToasts) {
          toast({
            title: "MetaMask not installed",
            description: "Please install MetaMask extension to connect your wallet",
            variant: "destructive",
          });
        }
        return;
      }

      const walletState = await connectWallet();

      if (walletState.connected && walletState.address) {
        setWallet(walletState);
        localStorage.setItem("walletAddress", walletState.address);
        
        // Try to update the user's wallet address in their profile
        updateUserWalletAddress(walletState.address);
        
        if (showToasts) {
          toast({
            title: "Connected successfully",
            description: `Connected to: ${walletState.address.substring(0, 6)}...${walletState.address.substring(walletState.address.length - 4)}`,
          });
        }
      } else if (showToasts) {
        toast({
          title: "Connection failed",
          description: "Failed to connect to MetaMask",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error in connect:", error);
      if (showToasts) {
        toast({
          title: "Connection error",
          description: error instanceof Error ? error.message : "An error occurred while connecting to MetaMask",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const disconnect = async () => {
    // Clear wallet state immediately
    setWallet(initialWalletState);
    localStorage.removeItem("walletAddress");
    
    // Try to revoke MetaMask permissions to prevent auto-reconnection
    try {
      if (window.ethereum && window.ethereum.isMetaMask) {
        await window.ethereum.request({
          method: "wallet_revokePermissions",
          params: [{ eth_accounts: {} }],
        });
        console.log("MetaMask permissions revoked successfully");
      }
    } catch (error) {
      console.log("Could not revoke MetaMask permissions:", error.message);
      // This is experimental, so it's okay if it fails
    }
    
    // Also try to clear the user's wallet address from their profile
    const clearUserWalletAddress = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          console.log("Clearing wallet address from user profile");
          // Always update to a new temp address when disconnecting
          const tempAddress = `temp-${Date.now()}`;
          await updateProfile({ walletAddress: tempAddress }, token);
          console.log("Profile updated with temp address:", tempAddress);
          
          // Use refreshUser to update the auth context
          await refreshUser();
          console.log("User profile refreshed successfully");
          
          // Show success message
          toast({
            title: "Disconnected",
            description: "Your wallet has been disconnected successfully. You can now connect a different wallet.",
          });
        }
      } catch (error) {
        console.log("Could not clear wallet address from profile:", error.message);
        toast({
          title: "Partially Disconnected",
          description: "Wallet disconnected from MetaMask, but profile update failed. Please refresh the page.",
          variant: "destructive",
        });
      }
    };
    
    toast({
      title: "Disconnecting...",
      description: "Clearing wallet connection and updating your profile...",
    });
    
    // Execute the profile update
    await clearUserWalletAddress();
  };

  const handleCreateCampaign = async (campaignData: {
    title: string;
    description: string;
    goal: number;
    duration: number;
    ipfsHash: string;
  }) => {
    if (!wallet.connected || !wallet.provider) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet first",
        variant: "destructive",
      });
      throw new Error("Wallet not connected");
    }

    try {
      return await createCampaignOnChain(wallet.provider, campaignData);
    } catch (error) {
      console.error("Error in createCampaign:", error);
      toast({
        title: "Campaign creation failed",
        description: error instanceof Error ? error.message : "Failed to create campaign on blockchain",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleContribute = async (campaignId: string, amountInUSD: number, recipientAddress: string) => {
    if (!wallet.connected || !wallet.provider) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet first",
        variant: "destructive",
      });
      throw new Error("Wallet not connected");
    }

    try {
      return await contributeToChain(wallet.provider, campaignId, amountInUSD, recipientAddress);
    } catch (error) {
      console.error("Error in contribute:", error);
      toast({
        title: "Contribution failed",
        description: error instanceof Error ? error.message : "Failed to contribute on blockchain",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleFetchChainCampaigns = async () => {
    if (!wallet.connected || !wallet.provider) {
      console.log("Wallet not connected, cannot fetch blockchain campaigns");
      return [];
    }

    try {
      return await fetchCampaignsFromChain(wallet.provider);
    } catch (error) {
      console.error("Error fetching blockchain campaigns:", error);
      return [];
    }
  };

  const contextValue = {
    wallet,
    connect: handleConnect,
    disconnect,
    isLoading,
    createCampaign: handleCreateCampaign,
    contribute: handleContribute,
    fetchChainCampaigns: handleFetchChainCampaigns
  };

  return (
    <WalletContext.Provider value={contextValue}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = (): WalletContextType => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
};
