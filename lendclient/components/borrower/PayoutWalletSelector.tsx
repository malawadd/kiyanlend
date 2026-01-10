'use client';

import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { NeoCard } from '../ui/NeoCard';
import { NeoBadge } from '../ui/NeoBadge';

interface PayoutWalletSelectorProps {
  selectedWallet?: Id<"wallets">;
  onWalletSelect: (walletId: Id<"wallets"> | undefined) => void;
  label?: string;
  showNoneOption?: boolean;
}

export function PayoutWalletSelector({ 
  selectedWallet, 
  onWalletSelect, 
  label = "Payout Wallet",
  showNoneOption = true 
}: PayoutWalletSelectorProps) {
  const wallets = useQuery(api.wallets.listWallets);

  if (!wallets) {
    return (
      <div className="space-y-2">
        <label className="font-bold text-sm uppercase tracking-wide">
          {label}
        </label>
        <div className="p-4 border-4 border-foreground bg-gray-100">
          <p className="text-sm font-semibold text-gray-600">Loading wallets...</p>
        </div>
      </div>
    );
  }

  if (wallets.length === 0) {
    return (
      <div className="space-y-2">
        <label className="font-bold text-sm uppercase tracking-wide">
          {label}
        </label>
        <NeoCard bg="bg-accent" className="bg-opacity-30">
          <p className="text-sm font-semibold">
            No wallets connected. Connect a wallet first to receive payments.
          </p>
        </NeoCard>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className="font-bold text-sm uppercase tracking-wide">
        {label}
      </label>
      <div className="space-y-2">
        {showNoneOption && (
          <button
            type="button"
            className={`w-full p-4 border-4 text-left transition-colors ${
              !selectedWallet 
                ? 'border-red bg-primary bg-opacity-20 border-2 ' 
                : 'border-foreground bg-gray-50 hover:bg-gray-100'
            }`}
            onClick={() => onWalletSelect(undefined)}
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold">No wallet selected</span>
              {!selectedWallet && <span className="text-primary font-black">✓</span>}
            </div>
            <p className="text-xs font-semibold text-gray-600 mt-1">
              Choose a wallet later
            </p>
          </button>
        )}
        
        {wallets.map((wallet) => (
          <button
            key={wallet._id}
            type="button"
            className={`w-full p-4 border-4 text-left transition-colors ${
              selectedWallet === wallet._id 
                ? ' bg-green-400 bg-opacity-20 border-2' 
                : 'border-foreground bg-white hover:bg-gray-50'
            }`}
            onClick={() => onWalletSelect(wallet._id)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold">{wallet.nickname}</span>
                  {wallet.isPrimary && (
                    <NeoBadge variant="success">Primary</NeoBadge>
                  )}
                  {selectedWallet === wallet._id && (
                    <span className="text-primary font-black">✓</span>
                  )}
                </div>
                <p className="text-xs font-mono text-gray-600 mb-1">
                  {wallet.address.slice(0, 16)}...{wallet.address.slice(-8)}
                </p>
                <p className="text-xs font-semibold text-gray-500">
                  Connected {new Date(wallet.connectedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>
      
      <p className="text-xs font-semibold text-gray-600 mt-2">
        Select the wallet where you want to receive loan payments. You can change this later.
      </p>
    </div>
  );
}