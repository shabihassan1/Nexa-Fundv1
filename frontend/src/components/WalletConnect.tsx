import { useState, useEffect } from "react";
import { useWallet } from "@/contexts/WalletContext";
import { useAuth } from "@/contexts/AuthContext";
import { updateProfile } from "@/services/authService";
import { Button } from "@/components/ui/button";
import { Loader2, LogOut, ExternalLink, Wallet } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const WalletConnect = () => {
  const [showAddress, setShowAddress] = useState(false);
  const [isMetaMaskDetected, setIsMetaMaskDetected] = useState(false);
  const [isContextError, setIsContextError] = useState(false);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  
  let walletContextValue = {
    wallet: { connected: false, address: null, chainId: null },
    connect: async () => {},
    disconnect: () => {},
    isLoading: false
  };
  
  try {
    walletContextValue = useWallet();
  } catch (error) {
    console.error("Error accessing wallet context:", error);
    setIsContextError(true);
  }
  
  const { wallet, connect, disconnect, isLoading } = walletContextValue;
  const { user, token } = useAuth();

  useEffect(() => {
    const checkMetaMask = () => {
      const hasMetaMask = typeof window !== "undefined" && 
                         typeof window.ethereum !== "undefined" && 
                         window.ethereum.isMetaMask === true;
      setIsMetaMaskDetected(hasMetaMask);
      console.log("MetaMask detected:", hasMetaMask);
    };
    
    checkMetaMask();
    
    const timeoutId = setTimeout(checkMetaMask, 1000);
    return () => clearTimeout(timeoutId);
  }, []);

  // Auto-update user profile when wallet connects
  useEffect(() => {
    const updateUserWalletAddress = async () => {
      console.log("WalletConnect: Checking if should update wallet address", {
        walletConnected: wallet.connected,
        walletAddress: wallet.address,
        userExists: !!user,
        tokenExists: !!token,
        currentUserWalletAddress: user?.walletAddress
      });

      if (wallet.connected && wallet.address && user && token) {
        // Check if the user's current wallet address is different from the connected one
        if (user.walletAddress !== wallet.address && !user.walletAddress?.startsWith('temp-')) {
          console.log("WalletConnect: User already has a different valid wallet address, not updating");
          return; // Don't update if user already has a different valid wallet address
        }
        
        if (user.walletAddress?.startsWith('temp-') || !user.walletAddress) {
          console.log("WalletConnect: Attempting to update user wallet address from", user.walletAddress, "to", wallet.address);
          try {
            setIsUpdatingProfile(true);
            const result = await updateProfile({ walletAddress: wallet.address }, token);
            console.log("WalletConnect: Profile update successful", result);
            
            // Force a page refresh to update the auth context with new user data
            toast({
              title: "Profile Updated",
              description: "Your wallet address has been saved. The page will refresh to update your profile.",
            });
            
            // Small delay before refresh to show the toast
            setTimeout(() => {
              window.location.reload();
            }, 2000);
            
          } catch (error) {
            console.error("WalletConnect: Failed to update wallet address in profile:", error);
            toast({
              title: "Profile Update Failed",
              description: error.message || "Could not save wallet address to your profile. You can update it manually in your profile settings.",
              variant: "destructive",
            });
          } finally {
            setIsUpdatingProfile(false);
          }
        } else {
          console.log("WalletConnect: User already has a valid wallet address, no update needed");
        }
      }
    };

    updateUserWalletAddress();
  }, [wallet.connected, wallet.address, user, token]);

  const handleConnect = async () => {
    console.log("Connect button clicked, isMetaMaskDetected:", isMetaMaskDetected);
    if (isContextError) {
      console.error("Cannot connect: WalletProvider context is not available");
      return;
    }
    
    try {
      await connect();
    } catch (error) {
      console.error("Failed to connect wallet:", error);
    }
  };

  const handleDisconnect = async () => {
    if (isContextError) return;
    
    const confirmDisconnect = window.confirm(
      "Are you sure you want to disconnect your wallet? This will remove the wallet address from your profile and you'll need to reconnect to make contributions."
    );
    
    if (confirmDisconnect) {
      try {
        await disconnect();
        // The disconnect function now handles the page reload
      } catch (error) {
        console.error("Error during disconnect:", error);
        // Fallback: reload the page anyway
        window.location.reload();
      }
    }
  };

  const shortenAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  const toggleAddressDisplay = () => {
    setShowAddress(!showAddress);
  };

  const viewOnEtherscan = () => {
    if (!wallet.address) return;
    
    const baseUrl = wallet.chainId === 1 
      ? "https://etherscan.io/address/" 
      : wallet.chainId === 5
        ? "https://goerli.etherscan.io/address/"
        : "https://sepolia.etherscan.io/address/";
    
    window.open(`${baseUrl}${wallet.address}`, "_blank");
  };

  const openMetaMaskWebsite = () => {
    window.open("https://metamask.io/download/", "_blank");
  };

  if (isContextError) {
    return (
      <Button
        variant="outline"
        onClick={() => window.location.reload()}
        className="bg-gray-300 text-gray-600 flex items-center gap-2"
      >
        <Wallet className="h-4 w-4" />
        Wallet Unavailable
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {wallet.connected && wallet.address ? (
        <div className="flex items-center gap-2">
          <div 
            className="bg-green-100 text-green-800 px-3 py-1 rounded-md cursor-pointer flex items-center gap-1"
            onClick={toggleAddressDisplay}
          >
            {showAddress ? wallet.address : shortenAddress(wallet.address)}
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={viewOnEtherscan}
            className="h-8 w-8"
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleDisconnect}
            className="h-8 w-8"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <Button 
          variant="outline" 
          onClick={!isMetaMaskDetected ? openMetaMaskWebsite : handleConnect}
          disabled={isLoading}
          className="bg-green-500 hover:bg-green-600 text-white flex items-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Connecting...
            </>
          ) : !isMetaMaskDetected ? (
            <>
              <Wallet className="h-4 w-4" />
              Connect Wallet
            </>
          ) : (
            <>
              <Wallet className="h-4 w-4" />
              Connect to MetaMask
            </>
          )}
        </Button>
      )}
    </div>
  );
};

export default WalletConnect;
