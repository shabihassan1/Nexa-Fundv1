import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Heart, Wallet, Gift, Info, AlertCircle, Target } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useWallet } from '@/contexts/WalletContext';
import { toast } from '@/hooks/use-toast';
import { createContribution } from '@/services/contributionService';
import { fetchActiveMilestone } from '@/services/campaignService';
import { ethers } from 'ethers';
import { getNativeCurrencySymbol } from '@/lib/web3';

interface Campaign {
  id: string;
  title: string;
  creatorId: string;
  requiresMilestones?: boolean;
  creator?: {
    walletAddress: string;
  };
  rewardTiers?: RewardTier[];
}

interface RewardTier {
  id: string;
  title: string;
  description: string;
  minimumAmount: number;
}

interface BackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaign: Campaign;
  onContributionSuccess?: () => void;
}

const BackingModal = ({ isOpen, onClose, campaign, onContributionSuccess }: BackingModalProps) => {
  const { user, token, isAuthenticated } = useAuth();
  const { wallet, connect, contribute } = useWallet();
  const [amount, setAmount] = useState<string>('');
  const [selectedRewardTier, setSelectedRewardTier] = useState<RewardTier | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeMilestone, setActiveMilestone] = useState<any>(null);
  const [loadingMilestone, setLoadingMilestone] = useState(true);
  
  // Get native currency symbol (POL for Tenderly VTN)
  const currencySymbol = getNativeCurrencySymbol();

  // Check if user is trying to back their own campaign
  const isSelfBacking = user?.id === campaign.creatorId;

  // Fetch active milestone when modal opens
  useEffect(() => {
    if (isOpen && campaign.id) {
      setLoadingMilestone(true);
      fetchActiveMilestone(campaign.id)
        .then(milestone => {
          console.log('Active Milestone Data:', milestone);
          setActiveMilestone(milestone);
        })
        .catch(err => {
          console.error('Failed to fetch active milestone:', err);
          setActiveMilestone(null);
        })
        .finally(() => {
          setLoadingMilestone(false);
        });
    }
  }, [isOpen, campaign.id]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleAmountChange = (value: string) => {
    // Only allow numbers and decimal point
    if (/^\d*\.?\d*$/.test(value)) {
      setAmount(value);
      
      // Auto-select reward tier based on amount
      if (campaign.rewardTiers && value) {
        const numericAmount = parseFloat(value);
        const eligibleTiers = campaign.rewardTiers
          .filter(tier => numericAmount >= tier.minimumAmount)
          .sort((a, b) => b.minimumAmount - a.minimumAmount);
        
        if (eligibleTiers.length > 0) {
          setSelectedRewardTier(eligibleTiers[0]);
        } else {
          setSelectedRewardTier(null);
        }
      }
    }
  };

  const handleSelectRewardTier = (tier: RewardTier) => {
    setSelectedRewardTier(tier);
    if (!amount || parseFloat(amount) < tier.minimumAmount) {
      setAmount(tier.minimumAmount.toString());
    }
  };

  const handleContribute = async () => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please log in to back this campaign.",
        variant: "destructive",
      });
      return;
    }

    if (isSelfBacking) {
      toast({
        title: "Self-Backing Not Allowed",
        description: "You cannot back your own campaign.",
        variant: "destructive",
      });
      return;
    }

    // Check if campaign is active - only active campaigns can be backed
    if ((campaign as any).status !== 'ACTIVE') {
      toast({
        title: "Campaign Not Available",
        description: "Only active campaigns can be backed. This campaign is currently pending approval.",
        variant: "destructive",
      });
      return;
    }

    const numericAmount = parseFloat(amount);

    if (!amount || numericAmount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid contribution amount.",
        variant: "destructive",
      });
      return;
    }

    // Validate milestone funding limits
    if (activeMilestone) {
      if (activeMilestone.currentAmount >= activeMilestone.amount) {
        toast({
          title: "Milestone Fully Funded",
          description: `Milestone "${activeMilestone.title}" has reached its funding goal. Please wait for the next milestone to be activated.`,
          variant: "destructive",
        });
        return;
      }

      const remainingAmount = activeMilestone.amount - activeMilestone.currentAmount;
      if (numericAmount > remainingAmount) {
        toast({
          title: "Amount Exceeds Milestone Goal",
          description: `This contribution would exceed the milestone target. Maximum contribution allowed: ${formatCurrency(remainingAmount)}`,
          variant: "destructive",
        });
        return;
      }
    }

    if (!wallet.connected) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your MetaMask wallet to make a contribution.",
        variant: "destructive",
      });
      await connect();
      return;
    }

    if (!campaign.creator?.walletAddress) {
      toast({
        title: "Creator Wallet Not Found",
        description: "Cannot find the campaign creator's wallet address.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const numericAmount = parseFloat(amount);
      
      // Debug: Log network information
      console.log("Wallet info:", {
        connected: wallet.connected,
        address: wallet.address,
        chainId: wallet.chainId
      });
      
      // Check if we're on a supported network (including local development networks)
      const supportedNetworks = [
        1,        // Ethereum Mainnet
        3,        // Ropsten (deprecated but still listed)
        4,        // Rinkeby (deprecated but still listed)
        5,        // Goerli Testnet
        42,       // Kovan (deprecated but still listed)
        11155111, // Sepolia Testnet
        80001,    // Polygon Mumbai Testnet
        1337,     // Ganache/Local development
        31337,    // Hardhat local development
        1338,     // Elysium Testnet
        73571,    // Tenderly Virtual TestNet (NexaFund VTN)
      ];
      
      if (wallet.chainId && !supportedNetworks.includes(wallet.chainId)) {
        toast({
          title: "Unsupported Network",
          description: `Please switch to a supported network. Current network: ${wallet.chainId}`,
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }
      
      // Debug: Log campaign data to understand the structure
      console.log("Campaign data:", campaign);
      console.log("Creator data:", campaign.creator);
      console.log("Creator wallet address:", campaign.creator?.walletAddress);
      
      // Validate that we have a valid recipient address
      if (!campaign.creator?.walletAddress) {
        throw new Error("Campaign creator's wallet address not found. Please contact the campaign creator to set up their wallet.");
      }

      // Check if the wallet address is still a temporary placeholder
      if (campaign.creator.walletAddress.startsWith('temp-')) {
        const refreshMessage = "The campaign creator hasn't connected their wallet yet. Please ask them to connect their MetaMask wallet to receive contributions.";
        throw new Error(refreshMessage);
      }

      // Validate Ethereum address format
      if (!/^0x[a-fA-F0-9]{40}$/.test(campaign.creator.walletAddress)) {
        throw new Error("The campaign creator's wallet address is invalid. Please contact the campaign creator to update their wallet address.");
      }

      // First, make the blockchain transaction
      toast({
        title: "Processing Transaction",
        description: "Please confirm the transaction in MetaMask...",
      });

      const { txHash, amountInETH } = await contribute(
        campaign.id,
        numericAmount,
        campaign.creator.walletAddress
      );

      toast({
        title: "Transaction Confirmed",
        description: `Successfully sent ${amountInETH} ${currencySymbol} to escrow contract.`,
      });

      // Then record the contribution in our database
      const contributionData = {
        campaignId: campaign.id,
        amount: numericAmount,
        transactionHash: txHash,
        rewardTierId: selectedRewardTier?.id || null,
      };

      await createContribution(contributionData, token!);

      toast({
        title: "🎉 Contribution Successful!",
        description: `You've successfully backed "${campaign.title}" with ${formatCurrency(numericAmount)} (${amountInETH} ${currencySymbol}). Funds are held in escrow.`,
      });

      // Reset form
      setAmount('');
      setSelectedRewardTier(null);
      
      // Call success callback to refresh campaign data
      if (onContributionSuccess) {
        onContributionSuccess();
      }
      
      onClose();
    } catch (error: any) {
      console.error("Contribution error:", error);
      
      let errorMessage = "Failed to process contribution. Please try again.";
      
      if (error.message.includes("Network mismatch") || error.message.includes("circuit breaker")) {
        errorMessage = "Network Compatibility Issue: You're trying to send ETH between different networks. " +
                      "Both your wallet and the campaign creator's wallet must be on the same network. " +
                      "Please either switch to the same network or ask the campaign creator to use a wallet on your current network.";
      } else if (error.message.includes("Insufficient funds")) {
        errorMessage = error.message;
      } else if (error.message.includes("rejected")) {
        errorMessage = "Transaction was cancelled by user.";
      } else if (error.message.includes("Invalid recipient")) {
        errorMessage = "The campaign creator's wallet address is invalid. Please contact the campaign creator to update their wallet address.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Contribution Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Heart className="h-5 w-5 mr-2 text-green-600" />
              Back This Project
            </DialogTitle>
            <DialogDescription>
              You need to log in to back this campaign.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col space-y-4">
            <Button onClick={onClose} className="w-full">
              Log In to Continue
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (isSelfBacking) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <AlertCircle className="h-5 w-5 mr-2 text-red-600" />
              Self-Backing Not Allowed
            </DialogTitle>
            <DialogDescription>
              Campaign creators cannot back their own campaigns. You can promote your campaign through other means!
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col space-y-4">
            <Button onClick={onClose} variant="outline" className="w-full">
              Got it
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Heart className="h-5 w-5 mr-2 text-green-600" />
            Back This Project
          </DialogTitle>
          <DialogDescription>
            Support "{campaign.title}" by sending {currencySymbol} to the escrow contract. Funds are released to the creator after milestone approvals.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Active Milestone Info */}
          {!loadingMilestone && activeMilestone && (
            <div className={`border rounded-lg p-4 ${
              activeMilestone.currentAmount >= activeMilestone.amount 
                ? 'bg-green-50 border-green-200' 
                : 'bg-blue-50 border-blue-200'
            }`}>
              <div className="flex items-start">
                <Target className={`h-5 w-5 mr-3 mt-0.5 flex-shrink-0 ${
                  activeMilestone.currentAmount >= activeMilestone.amount 
                    ? 'text-green-600' 
                    : 'text-blue-600'
                }`} />
                <div className="flex-1">
                  <h4 className={`font-semibold mb-1 ${
                    activeMilestone.currentAmount >= activeMilestone.amount 
                      ? 'text-green-900' 
                      : 'text-blue-900'
                  }`}>
                    {activeMilestone.currentAmount >= activeMilestone.amount 
                      ? '✅ Milestone Fully Funded' 
                      : `Contributing to Milestone #${activeMilestone.order}`
                    }
                  </h4>
                  <p className={`text-sm font-medium ${
                    activeMilestone.currentAmount >= activeMilestone.amount 
                      ? 'text-green-800' 
                      : 'text-blue-800'
                  }`}>
                    {activeMilestone.title}
                  </p>
                  <p className={`text-xs mt-2 ${
                    activeMilestone.currentAmount >= activeMilestone.amount 
                      ? 'text-green-700' 
                      : 'text-blue-700'
                  }`}>
                    {activeMilestone.description}
                  </p>
                  
                  {/* Funding Progress */}
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className={(activeMilestone.currentAmount || 0) >= activeMilestone.amount ? 'text-green-600' : 'text-blue-600'}>
                        ${(activeMilestone.currentAmount || 0).toLocaleString()} raised of ${(activeMilestone.amount || 0).toLocaleString()}
                      </span>
                      <span className={(activeMilestone.currentAmount || 0) >= activeMilestone.amount ? 'text-green-600 font-semibold' : 'text-blue-600'}>
                        {activeMilestone.amount > 0 
                          ? (((activeMilestone.currentAmount || 0) / activeMilestone.amount) * 100).toFixed(0)
                          : 0
                        }%
                      </span>
                    </div>
                    <div className="h-2 bg-white rounded-full overflow-hidden border border-gray-200">
                      <div 
                        className={`h-full transition-all ${
                          (activeMilestone.currentAmount || 0) >= activeMilestone.amount 
                            ? 'bg-green-500' 
                            : 'bg-blue-500'
                        }`}
                        style={{ 
                          width: activeMilestone.amount > 0 
                            ? `${Math.min(((activeMilestone.currentAmount || 0) / activeMilestone.amount) * 100, 100)}%`
                            : '0%'
                        }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-2 text-xs">
                    <span className={(activeMilestone.currentAmount || 0) >= activeMilestone.amount ? 'text-green-600' : 'text-blue-600'}>
                      {(activeMilestone.currentAmount || 0) >= activeMilestone.amount 
                        ? 'Waiting for next milestone' 
                        : `Remaining: ${formatCurrency(Math.max(0, activeMilestone.amount - (activeMilestone.currentAmount || 0)))}`
                      }
                    </span>
                    <span className={(activeMilestone.currentAmount || 0) >= activeMilestone.amount ? 'text-green-600' : 'text-blue-600'}>
                      Deadline: {new Date(activeMilestone.deadline).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
              <div className={`mt-3 pt-3 border-t ${
                activeMilestone.currentAmount >= activeMilestone.amount 
                  ? 'border-green-200' 
                  : 'border-blue-200'
              }`}>
                <p className={`text-xs ${
                  activeMilestone.currentAmount >= activeMilestone.amount 
                    ? 'text-green-600' 
                    : 'text-blue-600'
                }`}>
                  {activeMilestone.currentAmount >= activeMilestone.amount 
                    ? '🎉 This milestone is fully funded! Waiting for creator submission and backer approval.' 
                    : '💡 Your contribution will be held in escrow until this milestone is completed and approved by backers through voting.'
                  }
                </p>
              </div>
            </div>
          )}

          {!loadingMilestone && !activeMilestone && campaign.requiresMilestones && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-amber-600 mr-3 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h4 className="font-semibold text-amber-900 mb-1">
                    No Active Milestone
                  </h4>
                  <p className="text-xs text-amber-700">
                    This campaign requires milestones, but there is currently no active milestone accepting contributions. The previous milestone may be under review, or the creator needs to activate the next milestone.
                  </p>
                </div>
              </div>
            </div>
          )}

          {!loadingMilestone && !activeMilestone && !campaign.requiresMilestones && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-start">
                <Info className="h-5 w-5 text-gray-600 mr-3 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 mb-1">
                    Contributing to Campaign Goal
                  </h4>
                  <p className="text-xs text-gray-600">
                    This campaign doesn't have milestones. Your contribution will support the overall campaign goal.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Wallet Status */}
          {!wallet.connected && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-amber-600 mr-2" />
                <span className="text-amber-800">
                  Connect your MetaMask wallet to make a contribution
                </span>
              </div>
              <Button 
                onClick={connect} 
                className="mt-2 w-full bg-amber-600 hover:bg-amber-700"
              >
                Connect Wallet
              </Button>
            </div>
          )}

          {/* Debug Info for Ganache */}
          {wallet.connected && wallet.chainId === 1337 && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-xs">
              <div className="font-medium text-gray-700 mb-2">🔧 Debug Information</div>
              <div className="space-y-1 text-gray-600">
                <div>Your Wallet: {wallet.address}</div>
                <div>Creator Wallet: {campaign.creator?.walletAddress || 'Not set'}</div>
                <div>Network: Chain ID {wallet.chainId} (Ganache)</div>
                <div>RPC: {wallet.provider ? 'Connected' : 'Not connected'}</div>
              </div>
              {campaign.creator?.walletAddress && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    try {
                      if (wallet.provider) {
                        const balance = await wallet.provider.getBalance(campaign.creator.walletAddress);
                        toast({
                          title: "Recipient Balance Check",
                          description: `Creator has ${ethers.utils.formatEther(balance)} ETH on current network`,
                        });
                      }
                    } catch (error) {
                      toast({
                        title: "Balance Check Failed",
                        description: `Cannot access creator's address: ${error.message}`,
                        variant: "destructive",
                      });
                    }
                  }}
                  className="mt-2 h-6 px-2 text-xs"
                >
                  Test Creator Address
                </Button>
              )}
            </div>
          )}

          {/* Debug Info for Ganache */}
          {wallet.connected && wallet.chainId === 1337 && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-xs">
              <div className="font-medium text-gray-700 mb-2">🔧 Debug Information</div>
              <div className="space-y-1 text-gray-600">
                <div>Your Wallet: {wallet.address}</div>
                <div>Creator Wallet: {campaign.creator?.walletAddress || 'Not set'}</div>
                <div>Network: Chain ID {wallet.chainId} (Ganache)</div>
                <div>RPC: {wallet.provider ? 'Connected' : 'Not connected'}</div>
              </div>
              {campaign.creator?.walletAddress && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    try {
                      if (wallet.provider) {
                        const balance = await wallet.provider.getBalance(campaign.creator.walletAddress);
                        toast({
                          title: "Recipient Balance Check",
                          description: `Creator has ${ethers.utils.formatEther(balance)} ETH on current network`,
                        });
                      }
                    } catch (error) {
                      toast({
                        title: "Balance Check Failed",
                        description: `Cannot access creator's address: ${error.message}`,
                        variant: "destructive",
                      });
                    }
                  }}
                  className="mt-2 h-6 px-2 text-xs"
                >
                  Test Creator Address
                </Button>
              )}
            </div>
          )}

          {/* Network Compatibility Warning */}
          {wallet.connected && wallet.chainId === 1337 && campaign.creator?.walletAddress && 
           !campaign.creator.walletAddress.startsWith('temp-') && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
                <span className="text-yellow-800 font-medium">
                  Network Compatibility Check
                </span>
              </div>
              <p className="text-sm text-yellow-700 mt-2">
                You're on Ganache (local network) but the campaign creator's wallet might be on a different network. 
                If the transaction fails, both wallets need to be on the same network.
              </p>
              <div className="mt-3 p-2 bg-yellow-100 rounded border">
                <div className="flex items-center justify-between">
                  <div className="text-xs text-yellow-600">
                    Creator's wallet: {campaign.creator.walletAddress.slice(0, 10)}...{campaign.creator.walletAddress.slice(-8)}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(campaign.creator.walletAddress);
                      toast({
                        title: "Address Copied",
                        description: "You can now import this address into Ganache or ask the creator to switch networks.",
                      });
                    }}
                    className="h-6 px-2 text-xs"
                  >
                    Copy Address
                  </Button>
                </div>
              </div>
              <p className="text-xs text-yellow-600 mt-2">
                💡 <strong>Solution:</strong> Either import this address into Ganache, or ask the campaign creator to connect a Ganache wallet.
              </p>
              <details className="mt-2">
                <summary className="text-xs text-yellow-700 cursor-pointer hover:text-yellow-800">
                  📋 Click for step-by-step instructions
                </summary>
                <div className="mt-2 p-2 bg-white rounded border text-xs text-gray-700">
                  <p className="font-medium mb-1">Option 1: Import address to Ganache</p>
                  <ol className="list-decimal list-inside space-y-1 ml-2">
                    <li>Open Ganache desktop app</li>
                    <li>Click "Add Account" or the key icon</li>
                    <li>Paste the copied address</li>
                    <li>The account will be added with 0 ETH</li>
                    <li>You can now send ETH to this address</li>
                  </ol>
                  <p className="font-medium mt-2 mb-1">Option 2: Ask creator to switch</p>
                  <p className="ml-2">Ask the campaign creator to connect a Ganache wallet instead.</p>
                </div>
              </details>
              <details className="mt-2">
                <summary className="text-xs text-yellow-700 cursor-pointer hover:text-yellow-800">
                  📋 Click for step-by-step instructions
                </summary>
                <div className="mt-2 p-2 bg-white rounded border text-xs text-gray-700">
                  <p className="font-medium mb-1">Option 1: Import address to Ganache</p>
                  <ol className="list-decimal list-inside space-y-1 ml-2">
                    <li>Open Ganache desktop app</li>
                    <li>Click "Add Account" or the key icon</li>
                    <li>Paste the copied address</li>
                    <li>The account will be added with 0 ETH</li>
                    <li>You can now send ETH to this address</li>
                  </ol>
                  <p className="font-medium mt-2 mb-1">Option 2: Ask creator to switch</p>
                  <p className="ml-2">Ask the campaign creator to connect a Ganache wallet instead.</p>
                </div>
              </details>
            </div>
          )}

          {/* Network Info for Local Development */}
          {wallet.connected && wallet.chainId === 1337 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center">
                <Info className="h-5 w-5 text-blue-600 mr-2" />
                <span className="text-blue-800">
                  Connected to Ganache local development network
                </span>
              </div>
              <p className="text-sm text-blue-700 mt-1">
                You're using test ETH on a local blockchain. Perfect for development!
              </p>
            </div>
          )}

          {/* Contribution Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">Contribution Amount (USD)</Label>
            <div className="relative">
              <span className="absolute left-3 top-3 text-gray-500">$</span>
              <Input
                id="amount"
                type="text"
                placeholder="25.00"
                value={amount}
                onChange={(e) => handleAmountChange(e.target.value)}
                className="pl-8"
              />
            </div>
            <p className="text-sm text-gray-600">
              <Info className="h-4 w-4 inline mr-1" />
              Will be converted to ETH and sent to creator's wallet (Rate: 1 ETH = $2000)
            </p>
          </div>

          {/* Quick Amount Buttons */}
          <div className="space-y-2">
            <Label>Quick Select</Label>
            <div className="grid grid-cols-4 gap-2">
              {[25, 50, 100, 250].map((quickAmount) => (
                <Button
                  key={quickAmount}
                  variant="outline"
                  size="sm"
                  onClick={() => handleAmountChange(quickAmount.toString())}
                  className={amount === quickAmount.toString() ? 'bg-green-50 border-green-500' : ''}
                >
                  ${quickAmount}
                </Button>
              ))}
            </div>
          </div>

          {/* Reward Tiers */}
          {campaign.rewardTiers && campaign.rewardTiers.length > 0 && (
            <div className="space-y-2">
              <Label>Reward Tiers</Label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {campaign.rewardTiers
                  .sort((a, b) => a.minimumAmount - b.minimumAmount)
                  .map((tier) => {
                    const isSelected = selectedRewardTier?.id === tier.id;
                    const isEligible = amount && parseFloat(amount) >= tier.minimumAmount;
                    
                    return (
                      <Card 
                        key={tier.id} 
                        className={`cursor-pointer transition-colors ${
                          isSelected 
                            ? 'border-green-500 bg-green-50' 
                            : isEligible 
                              ? 'border-green-200 hover:border-green-300' 
                              : 'border-gray-200 opacity-60'
                        }`}
                        onClick={() => isEligible && handleSelectRewardTier(tier)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center">
                              <Gift className="h-4 w-4 mr-2 text-green-600" />
                              <span className="font-medium">{tier.title}</span>
                            </div>
                            <span className="font-bold text-green-600">
                              {formatCurrency(tier.minimumAmount)}+
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">{tier.description}</p>
                          {!isEligible && amount && (
                            <p className="text-xs text-red-500 mt-1">
                              Minimum ${tier.minimumAmount} required
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
              </div>
            </div>
          )}

          <Separator />

          {/* Summary */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            <div className="flex justify-between">
              <span>Contribution Amount:</span>
              <span className="font-medium">
                {amount ? formatCurrency(parseFloat(amount)) : '$0.00'}
              </span>
            </div>
            {amount && (
              <div className="flex justify-between text-sm text-gray-600">
                <span>ETH Amount (approx):</span>
                <span>{amount ? (parseFloat(amount) / 2000).toFixed(6) : '0'} ETH</span>
              </div>
            )}
            {selectedRewardTier && (
              <div className="flex justify-between text-green-600">
                <span>Reward Tier:</span>
                <span className="font-medium">{selectedRewardTier.title}</span>
              </div>
            )}
            {wallet.connected && (
              <div className="flex justify-between text-sm">
                <span>Your Wallet:</span>
                <span className="font-mono">{wallet.address?.slice(0, 6)}...{wallet.address?.slice(-4)}</span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={handleContribute}
              disabled={
                !amount || 
                parseFloat(amount) <= 0 || 
                isSubmitting || 
                !wallet.connected ||
                (campaign.requiresMilestones && !activeMilestone) ||
                (activeMilestone && activeMilestone.currentAmount >= activeMilestone.amount)
              }
              className="flex-1 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Wallet className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (campaign.requiresMilestones && !activeMilestone) ? (
                <>
                  <AlertCircle className="h-4 w-4 mr-2" />
                  No Active Milestone
                </>
              ) : (activeMilestone && activeMilestone.currentAmount >= activeMilestone.amount) ? (
                <>
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Milestone Fully Funded
                </>
              ) : (
                <>
                  <Wallet className="h-4 w-4 mr-2" />
                  Send {amount ? (parseFloat(amount) / 2000).toFixed(6) : '0'} ETH
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BackingModal; 