'use client';

import { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { NeoButton } from '../ui/NeoButton';
import { useToast } from '../ui/NeoToast';
import { CONTRACT_ADDRESS, usdToEth, formatUsdAmount } from '@/lib/blockchain-utils';
import contractABI from '@/lib/abi.json';

interface BlockchainPublishProps {
  loanRequest: {
    shortId: string;
    amount: number;
    status: string;
    blockchainTxHash?: string;
    isOnChain?: boolean;
  };
  onSuccess?: () => void;
}

export function BlockchainPublish({ loanRequest, onSuccess }: BlockchainPublishProps) {
  const { address, isConnected } = useAccount();
  const { showToast } = useToast();
  const [isPublishing, setIsPublishing] = useState(false);
  const [txStep, setTxStep] = useState<'idle' | 'submitting' | 'waiting' | 'confirmed'>('idle');

  const updateLoanRequest = useMutation(api.loanRequests.updateLoanRequest);
  
  const { writeContract, data: hash, isPending: isWritePending } = useWriteContract();
  
  const { 
    isLoading: isConfirming, 
    isSuccess: isConfirmed,
    data: receipt
  } = useWaitForTransactionReceipt({
    hash,
    confirmations: 2, // Wait for 2 confirmations
  });

  // Handle transaction confirmation with 2 confirmations
  useEffect(() => {
    if (hash && !isConfirming && !isConfirmed) {
      setTxStep('waiting');
      showToast('Transaction submitted! Waiting for 2 confirmations...', 'info');
    }
  }, [hash, isConfirming, isConfirmed, showToast]);

  useEffect(() => {
    if (isConfirmed && receipt && hash) {
      setTxStep('confirmed');
      handleTransactionConfirmed(hash);
    }
  }, [isConfirmed, receipt, hash]);

  const handleTransactionConfirmed = async (txHash: string) => {
    try {
      // Update backend with confirmed transaction
      await updateLoanRequest({
        shortId: loanRequest.shortId,
        blockchainTxHash: txHash,
        isOnChain: true,
        status: 'active',
        isPublished: true,
      });

      showToast('✅ Transaction confirmed with 2 blocks! Request published to marketplace.', 'success');
      setIsPublishing(false);
      setTxStep('idle');
      onSuccess?.();
      
    } catch (error) {
      console.error('Backend update error:', error);
      showToast(
        error instanceof Error ? error.message : 'Failed to update backend after confirmation',
        'danger'
      );
      setIsPublishing(false);
      setTxStep('idle');
    }
  };

  const handlePublishToBlockchain = async () => {
    if (!isConnected || !address) {
      showToast('Please connect your wallet first', 'danger');
      return;
    }

    try {
      setIsPublishing(true);
      setTxStep('submitting');
      
      const ethAmount = usdToEth(loanRequest.amount);
      showToast(`Submitting ${formatUsdAmount(loanRequest.amount)} (${ethAmount} ETH) to blockchain...`, 'info');

      // Create proposal on smart contract
      writeContract({
        address: CONTRACT_ADDRESS,
        abi: contractABI,
        functionName: 'createProposal',
        args: [
          parseEther(ethAmount), // Convert to wei
          loanRequest.shortId     // Use shortId as nillion data ID
        ],
      });
      
    } catch (error) {
      console.error('Blockchain publish error:', error);
      showToast(
        error instanceof Error ? error.message : 'Failed to publish to blockchain',
        'danger'
      );
      setIsPublishing(false);
      setTxStep('idle');
    }
  };

  const isLoading = isPublishing || isWritePending || isConfirming;
  const isOnChain = loanRequest.isOnChain && loanRequest.blockchainTxHash;

  const getButtonText = () => {
    if (txStep === 'submitting' || isWritePending) return 'Submitting Transaction...';
    if (txStep === 'waiting' || isConfirming) return 'Waiting for Confirmations...';
    if (txStep === 'confirmed') return 'Processing...';
    return '💎 Publish to Blockchain';
  };

  const getStatusText = () => {
    if (txStep === 'waiting' || isConfirming) {
      return `⏳ Waiting for 2 confirmations${hash ? ` - Tx: ${hash.slice(0, 10)}...` : ''}`;
    }
    if (txStep === 'confirmed') {
      return '✅ Transaction confirmed! Updating status...';
    }
    return null;
  };

  return (
    <div className="space-y-3">
      <div className="p-3 bg-blue-50  border-2 border-blue-400 rounded">
        <p className="text-xs font-bold text-blue-800  mb-1">
          💎 Blockchain Publication
        </p>
        <p className="text-xs text-blue-700 ">
          Amount: {formatUsdAmount(loanRequest.amount)} ({usdToEth(loanRequest.amount)} ETH)
        </p>
        {isOnChain && (
          <p className="text-xs text-green-700  font-mono mt-1">
            Tx: {loanRequest.blockchainTxHash?.slice(0, 10)}...
          </p>
        )}
      </div>

      {/* Transaction Status */}
      {getStatusText() && (
        <div className="p-2 bg-yellow-50  border-2 border-yellow-400 rounded">
          <p className="text-xs text-yellow-800 ">
            {getStatusText()}
          </p>
        </div>
      )}

      {!isOnChain ? (
        <NeoButton
          variant="primary"
          onClick={handlePublishToBlockchain}
          disabled={isLoading || !isConnected}
        >
          {isLoading ? (
            <>
              <span className="animate-spin mr-2">⏳</span>
              {getButtonText()}
            </>
          ) : (
            getButtonText()
          )}
        </NeoButton>
      ) : (
        <div className="text-xs text-green-600 ">
          ✅ Published on Sepolia blockchain (2+ confirmations)
        </div>
      )}
    </div>
  );
}