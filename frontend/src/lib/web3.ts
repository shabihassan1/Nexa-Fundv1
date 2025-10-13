import { ethers } from "ethers";

/**
 * Web3 Network Configuration
 * Handles network switching and provider setup for Tenderly VTN
 */

// Network configuration from environment
export const NETWORK_CONFIG = {
  chainId: parseInt(import.meta.env.VITE_CHAIN_ID_DEC || "73571"),
  chainIdHex: import.meta.env.VITE_CHAIN_ID_HEX || "0x11F63",
  chainName: import.meta.env.VITE_NETWORK_NAME || "NexaFund VTN",
  rpcUrl: import.meta.env.VITE_RPC_URL || "",
  nativeCurrency: {
    name: "POL",
    symbol: import.meta.env.VITE_NATIVE_SYMBOL || "POL",
    decimals: 18,
  },
  blockExplorerUrls: [] // Tenderly has its own dashboard
};

/**
 * Add Tenderly VTN network to MetaMask
 */
export async function addTenderlyVTNNetwork(): Promise<boolean> {
  if (!window.ethereum) {
    console.error("MetaMask not installed");
    return false;
  }

  try {
    await window.ethereum.request({
      method: "wallet_addEthereumChain",
      params: [
        {
          chainId: NETWORK_CONFIG.chainIdHex,
          chainName: NETWORK_CONFIG.chainName,
          nativeCurrency: NETWORK_CONFIG.nativeCurrency,
          rpcUrls: [NETWORK_CONFIG.rpcUrl],
        },
      ],
    });
    console.log("✅ Tenderly VTN network added successfully");
    return true;
  } catch (error: any) {
    console.error("Failed to add network:", error);
    throw error;
  }
}

/**
 * Switch to Tenderly VTN network
 */
export async function switchToTenderlyVTN(): Promise<boolean> {
  if (!window.ethereum) {
    console.error("MetaMask not installed");
    return false;
  }

  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: NETWORK_CONFIG.chainIdHex }],
    });
    console.log("✅ Switched to Tenderly VTN");
    return true;
  } catch (error: any) {
    // Error code 4902 means the network hasn't been added yet
    if (error.code === 4902) {
      console.log("Network not found, adding it...");
      return await addTenderlyVTNNetwork();
    }
    console.error("Failed to switch network:", error);
    throw error;
  }
}

/**
 * Check if currently on Tenderly VTN
 */
export async function isOnTenderlyVTN(): Promise<boolean> {
  if (!window.ethereum) return false;

  try {
    const chainId = await window.ethereum.request({ method: "eth_chainId" });
    const currentChainId = parseInt(chainId, 16);
    return currentChainId === NETWORK_CONFIG.chainId;
  } catch (error) {
    console.error("Failed to check network:", error);
    return false;
  }
}

/**
 * Ensure user is on Tenderly VTN network
 * Will prompt user to switch if on wrong network
 */
export async function ensureTenderlyVTN(): Promise<boolean> {
  const isCorrectNetwork = await isOnTenderlyVTN();
  
  if (!isCorrectNetwork) {
    console.log("Wrong network detected, switching to Tenderly VTN...");
    return await switchToTenderlyVTN();
  }
  
  return true;
}

/**
 * Get native currency symbol (POL)
 */
export function getNativeCurrencySymbol(): string {
  return NETWORK_CONFIG.nativeCurrency.symbol;
}

/**
 * Format currency with correct symbol
 */
export function formatCurrency(amount: number): string {
  return `${amount.toFixed(2)} ${getNativeCurrencySymbol()}`;
}

/**
 * Get the deployed contract address
 */
export function getContractAddress(): string {
  const address = import.meta.env.VITE_CONTRACT_ADDRESS;
  if (!address) {
    throw new Error("VITE_CONTRACT_ADDRESS not set in environment");
  }
  return address;
}

/**
 * Get ethers provider for Tenderly VTN
 */
export function getTenderlyProvider(): ethers.providers.JsonRpcProvider {
  return new ethers.providers.JsonRpcProvider(NETWORK_CONFIG.rpcUrl);
}
