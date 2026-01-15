// import { parseEther, formatEther } from 'viem';

export const CONTRACT_ADDRESS = '0x24c23a634dC1dD033Dc2B2063bc689BD35BE610f' as const;

export const USD_TO_ETH_RATE = 4100; // 1 ETH = $4100

export function usdToEth(usdAmount: number): string {
  return (usdAmount / USD_TO_ETH_RATE).toFixed(6);
}

export function ethToUsd(ethAmount: string): number {
  return parseFloat(ethAmount) * USD_TO_ETH_RATE;
}

export function formatUsdAmount(usdAmount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(usdAmount);
}