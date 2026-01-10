'use client';

import '@rainbow-me/rainbowkit/styles.css';
import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { sepolia } from 'wagmi/chains';

export const config = getDefaultConfig({
  appName: 'KiyanLend',
  projectId: 'YOUR_PROJECT_ID', // Get this from WalletConnect Cloud
  chains: [sepolia], // Start with mainnet
  multiInjectedProviderDiscovery: true,
  ssr: true,
});

// Enable automatic chain detection for any EVM chain
export const chainConfig = {
  // This allows the app to work with any chain the wallet connects to
  autoConnect: true,
  // Enable chain switching
  enableChainSwitching: true,
};