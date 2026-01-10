// import { parseEther, formatEther } from 'viem';

export const CONTRACT_ADDRESS = '0x0b82120940879662aadf043212644567e7416766' as const;

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