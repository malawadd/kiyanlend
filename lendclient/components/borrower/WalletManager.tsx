'use client';

import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { NeoCard } from '../ui/NeoCard';
import { NeoButton } from '../ui/NeoButton';
import { NeoBadge } from '../ui/NeoBadge';
import { useToast } from '../ui/NeoToast';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useDisconnect } from 'wagmi';
import { useEffect } from 'react';
import type { Id } from '@/convex/_generated/dataModel';

export function WalletManager() {
  const { address, isConnected, connector } = useAccount();
  const { disconnect } = useDisconnect();
  const wallets = useQuery(api.wallets.listWallets);
  const addWallet = useMutation(api.wallets.addWallet);
  const setPrimaryWallet = useMutation(api.wallets.setPrimaryWallet);
  const removeWallet = useMutation(api.wallets.removeWallet);
  const { showToast } = useToast();

  // Auto-add connected wallet to database
  useEffect(() => {
    if (isConnected && address && wallets) {
      const existingWallet = wallets.find(w => w.address.toLowerCase() === address.toLowerCase());
      if (!existingWallet) {
        addWallet({
          address,
          nickname: `${connector?.name || 'Wallet'} ${wallets.length + 1}`,
        }).then(() => {
          showToast('Wallet connected successfully', 'success');
        }).catch((error: unknown) => {
          showToast(error instanceof Error ? error.message : 'Failed to add wallet', 'danger');
        });
      }
    }
  }, [isConnected, address, wallets, addWallet, connector?.name, showToast]);

  const handleSetPrimary = async (walletId: Id<"wallets">) => {
    try {
      await setPrimaryWallet({ walletId });
      showToast('Primary wallet updated', 'success');
    } catch (error: unknown) {
      showToast(error instanceof Error ? error.message : 'Failed to update primary wallet', 'danger');
    }
  };

  const handleRemove = async (walletId: Id<"wallets">, walletAddress: string) => {
    try {
      // If removing the currently connected wallet, disconnect it first
      if (address?.toLowerCase() === walletAddress.toLowerCase()) {
        disconnect();
      }
      await removeWallet({ walletId });
      showToast('Wallet removed', 'info');
    } catch (error: unknown) {
      showToast(error instanceof Error ? error.message : 'Failed to remove wallet', 'danger');
    }
  };

  const copyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    showToast('Address copied to clipboard', 'success');
  };

  if (!wallets) {
    return (
      <NeoCard bg="bg-white">
        <p className="text-lg font-semibold">Loading wallets...</p>
      </NeoCard>
    );
  }

  return (
    <NeoCard bg="bg-white">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-black uppercase">Connected Wallets</h3>
        <div className="flex items-center gap-3">
          <ConnectButton.Custom>
            {({
              account,
              chain,
              openAccountModal,
              openChainModal,
              openConnectModal,
              authenticationStatus,
              mounted,
            }) => {
              const ready = mounted && authenticationStatus !== 'loading';
              const connected =
                ready &&
                account &&
                chain &&
                (!authenticationStatus ||
                  authenticationStatus === 'authenticated');

              return (
                <div
                  {...(!ready && {
                    'aria-hidden': true,
                    'style': {
                      opacity: 0,
                      pointerEvents: 'none',
                      userSelect: 'none',
                    },
                  })}
                >
                  {(() => {
                    if (!connected) {
                      return (
                        <NeoButton
                          size="sm"
                          variant="secondary"
                          onClick={openConnectModal}
                        >
                          + Connect Wallet
                        </NeoButton>
                      );
                    }

                    if (chain.unsupported) {
                      return (
                        <NeoButton
                          size="sm"
                          variant="danger"
                          onClick={openChainModal}
                        >
                          Wrong network
                        </NeoButton>
                      );
                    }

                    return (
                      <div className="flex gap-2">
                        <NeoButton
                          size="sm"
                          variant="accent"
                          onClick={openChainModal}
                        >
                          {chain.hasIcon && (
                            <div
                              style={{
                                background: chain.iconBackground,
                                width: 12,
                                height: 12,
                                borderRadius: 999,
                                overflow: 'hidden',
                                marginRight: 4,
                              }}
                            >
                              {chain.iconUrl && (
                                <img
                                  alt={chain.name ?? 'Chain icon'}
                                  src={chain.iconUrl}
                                  style={{ width: 12, height: 12 }}
                                />
                              )}
                            </div>
                          )}
                          {chain.name}
                        </NeoButton>

                        <NeoButton
                          size="sm"
                          variant="primary"
                          onClick={openAccountModal}
                        >
                          {account.displayName}
                          {account.displayBalance
                            ? ` (${account.displayBalance})`
                            : ''}
                        </NeoButton>
                      </div>
                    );
                  })()}
                </div>
              );
            }}
          </ConnectButton.Custom>
        </div>
      </div>

      <div className="space-y-4">
        {wallets.map(wallet => {
          const isCurrentlyConnected = isConnected && address?.toLowerCase() === wallet.address.toLowerCase();
          
          return (
            <div key={wallet._id} className="p-4 border-4 border-foreground bg-white">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <p className="font-black text-lg">{wallet.nickname}</p>
                    {wallet.isPrimary && (
                      <NeoBadge variant="accent">Primary</NeoBadge>
                    )}
                    {isCurrentlyConnected && (
                      <NeoBadge variant="success">Connected</NeoBadge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="text-xs sm:text-sm font-bold font-mono bg-gray-100 px-2 py-1 border-2 border-foreground">
                      {wallet.address.slice(0, 10)}...{wallet.address.slice(-8)}
                    </code>
                    <button
                      onClick={() => copyAddress(wallet.address)}
                      className="p-1 hover:bg-accent transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                  </div>
                  <p className="text-xs font-semibold text-gray-600 mt-1">
                    Connected {new Date(wallet.connectedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                {!wallet.isPrimary && (
                  <NeoButton
                    size="sm"
                    variant="success"
                    onClick={() => handleSetPrimary(wallet._id)}
                  >
                    Set as Primary
                  </NeoButton>
                )}
                <NeoButton
                  size="sm"
                  variant="danger"
                  onClick={() => handleRemove(wallet._id, wallet.address)}
                  disabled={wallet.isPrimary && wallets.length === 1}
                >
                  Remove
                </NeoButton>
              </div>
            </div>
          );
        })}
      </div>

      {wallets.length === 0 && (
        <div className="text-center py-8 border-4 border-foreground bg-gray-50">
          <p className="font-semibold text-gray-600">No wallets connected yet</p>
          <p className="text-sm font-semibold text-gray-500 mt-2">
            Click &quot;Connect Wallet&quot; above to add your first wallet
          </p>
        </div>
      )}

      <div className="mt-6 p-4 bg-secondary bg-opacity-30 border-4 border-foreground">
        <p className="text-sm font-bold">
          Connect multiple wallets to verify ownership and build trust. Your primary wallet is shown to lenders.
        </p>
      </div>
    </NeoCard>
  );
}
