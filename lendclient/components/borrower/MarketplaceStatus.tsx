'use client';

import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { NeoCard } from '@/components/ui/NeoCard';
import { NeoButton } from '@/components/ui/NeoButton';
import { useToast } from '@/components/ui/NeoToast';
import { BlockchainPublish } from './BlockchainPublish';

interface MarketplaceStatusProps {
  loanRequest: {
    shortId: string;
    status: string;
    amount: number;
    isPublished?: boolean;
    blockchainTxHash?: string;
    isOnChain?: boolean;
  };
}

export function MarketplaceStatus({ loanRequest }: MarketplaceStatusProps) {
  const { showToast } = useToast();
  const updateLoanRequest = useMutation(api.loanRequests.updateLoanRequest);

  const handlePublishToMarketplace = async () => {
    try {
      await updateLoanRequest({
        shortId: loanRequest.shortId,
        status: 'active',
        isPublished: true,
      });
      showToast('Request published to marketplace!', 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to publish request', 'danger');
    }
  };

  const handleUnpublish = async () => {
    try {
      await updateLoanRequest({
        shortId: loanRequest.shortId,
        status: 'paused',
        isPublished: false,
      });
      showToast('Request removed from marketplace', 'info');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to unpublish request', 'danger');
    }
  };

  const isPublished = (loanRequest.isPublished ?? false) && loanRequest.status === 'active';
  const isOnBlockchain = loanRequest.isOnChain && loanRequest.blockchainTxHash;

  return (
    <NeoCard bg="bg-primary" className="bg-opacity-20">
      <h3 className="text-xl font-black uppercase mb-4">Marketplace Status</h3>
      
      {/* Not on blockchain yet - need initial blockchain publication */}
      {!isOnBlockchain ? (
        <div className="space-y-4">
          <p className="font-semibold">
            {loanRequest.status === 'draft' 
              ? 'This request is in draft mode. Publish it to blockchain to make it visible to lenders.'
              : 'Complete blockchain publication to enable marketplace listing.'
            }
          </p>
          <BlockchainPublish 
            loanRequest={loanRequest}
            onSuccess={() => showToast('Request published to blockchain & marketplace!', 'success')}
          />
        </div>
      ) : (
        /* On blockchain - can toggle marketplace visibility */
        <div className="space-y-4">
          {/* Show blockchain confirmation */}
          {/* <div className="p-3 bg-green-50  border-2 border-green-400 rounded">
            <p className="text-xs font-bold text-green-800  mb-1">
              ✅ Published on Blockchain
            </p>
            <p className="text-xs text-green-700  font-mono">
              Tx: {loanRequest.blockchainTxHash?.slice(0, 20)}...
            </p>
          </div> */}

          {isPublished ? (
            <div className="space-y-3">
              <p className="font-semibold">
                🟢 This request is live on the marketplace. Lenders can see and fund your proposal.
              </p>
              <NeoButton variant="danger" onClick={handleUnpublish}>
                Remove from Marketplace
              </NeoButton>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="font-semibold">
                ⏸️ This request is paused from marketplace but remains on blockchain. You can republish anytime.
              </p>
              <NeoButton variant="primary" onClick={handlePublishToMarketplace}>
                Add to Marketplace
              </NeoButton>
            </div>
          )}

          <div className="text-xs text-gray-600  mt-2">
            💡 Since your request is on blockchain, you can toggle marketplace visibility as many times as needed.
          </div>
        </div>
      )}
    </NeoCard>
  );
}