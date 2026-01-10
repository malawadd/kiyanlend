'use client';

import { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { formatEther } from 'viem';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { NeoButton } from '../ui/NeoButton';
import { useToast } from '../ui/NeoToast';
import { CONTRACT_ADDRESS, formatUsdAmount, ethToUsd } from '@/lib/blockchain-utils';
import { getProposalFromTx, type ProposalData } from '@/lib/proposal-utils';
import contractABI from '@/lib/abi.json';

interface FundProposalProps {
  loanRequest: {
    shortId: string;
    amount: number;
    blockchainTxHash?: string;
    borrowerName: string;
    isFunded?: boolean;
    fundedBy?: string;
    fundingTxHash?: string;
  };
  onSuccess?: () => void;
}

export function FundProposal({ loanRequest, onSuccess }: FundProposalProps) {
  const { address, isConnected } = useAccount();
  const { showToast } = useToast();
  const [proposal, setProposal] = useState<ProposalData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [txStep, setTxStep] = useState<'idle' | 'submitting' | 'waiting' | 'confirmed' | 'failed'>('idle');

  const updateLoanRequest = useMutation(api.loanRequests.updateLoanRequest);
  const { writeContract, data: hash, error: writeError, reset } = useWriteContract();
  const { 
    isLoading: isConfirming, 
    isSuccess: isConfirmed,
    error: receiptError 
  } = useWaitForTransactionReceipt({
    hash,
    confirmations: 2,
  });

  // Reset transaction state when component mounts or loan request changes
  useEffect(() => {
    setTxStep('idle');
    reset();
  }, [loanRequest.shortId, reset]);

  // Fetch proposal data from borrower's transaction
  useEffect(() => {
    if (loanRequest.blockchainTxHash) {
      setIsLoading(true);
      getProposalFromTx(loanRequest.blockchainTxHash)
        .then(setProposal)
        .catch(console.error)
        .finally(() => setIsLoading(false));
    }
  }, [loanRequest.blockchainTxHash]);

  // Handle write errors
  useEffect(() => {
    if (writeError) {
      console.error('Write contract error:', writeError);
      showToast(`Transaction failed: ${writeError.message}`, 'danger');
      setTxStep('failed');
      setTimeout(() => setTxStep('idle'), 3000); // Reset after 3 seconds
    }
  }, [writeError, showToast]);

  // Handle receipt errors
  useEffect(() => {
    if (receiptError) {
      console.error('Receipt error:', receiptError);
      showToast(`Transaction confirmation failed: ${receiptError.message}`, 'danger');
      setTxStep('failed');
      setTimeout(() => setTxStep('idle'), 3000); // Reset after 3 seconds
    }
  }, [receiptError, showToast]);

  // Handle transaction confirmation flow
  useEffect(() => {
    if (hash && !isConfirming && !isConfirmed && txStep === 'submitting') {
      setTxStep('waiting');
      showToast('Funding transaction submitted! Waiting for 2 confirmations...', 'info');
    }
  }, [hash, isConfirming, isConfirmed, showToast, txStep]);

  useEffect(() => {
    if (isConfirmed && hash && txStep === 'waiting') {
      setTxStep('confirmed');
      handleFundingConfirmed(hash);
    }
  }, [isConfirmed, hash, txStep]);

  const handleFundingConfirmed = async (txHash: string) => {
    try {
      await updateLoanRequest({
        shortId: loanRequest.shortId,
        isFunded: true,
        fundedBy: address!,
        fundingTxHash: txHash,
        status: 'funded',
      });

      showToast(`✅ Funding confirmed! You've successfully funded ${loanRequest.borrowerName}'s proposal.`, 'success');
      setTxStep('idle');
      onSuccess?.();
    } catch (error) {
      console.error('Backend update error:', error);
      showToast('Failed to update funding status', 'danger');
      setTxStep('failed');
      setTimeout(() => setTxStep('idle'), 3000);
    }
  };

  const handleFundProposal = async () => {
    if (!isConnected || !proposal || !address) return;

    try {
      setTxStep('submitting');
      const ethAmount = formatEther(proposal.capitalAmount);
      showToast(`Submitting funding transaction for ${ethAmount} ETH...`, 'info');

      writeContract({
        address: CONTRACT_ADDRESS,
        abi: contractABI,
        functionName: 'fundProposal',
        args: [proposal.id],
        value: proposal.capitalAmount,
      });
    } catch (error) {
      console.error('Funding error:', error);
      showToast(error instanceof Error ? error.message : 'Failed to fund proposal', 'danger');
      setTxStep('failed');
      setTimeout(() => setTxStep('idle'), 3000);
    }
  };

  // Check if already funded
  if (loanRequest.isFunded) {
    const fundedByCurrentUser = loanRequest.fundedBy === address;
    return (
      <div className="text-center py-4">
        <div className="w-16 h-16 bg-success rounded-full flex items-center justify-center mx-auto mb-3">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="text-sm font-bold  mb-1 text-green-600">
          {fundedByCurrentUser ? '✅ You funded this proposal!' : '✅ Proposal Already Funded'}
        </p>
        <p className="text-xs text-gray-600">
          {fundedByCurrentUser 
            ? `Transaction: ${loanRequest.fundingTxHash?.slice(0, 10)}...`
            : 'This proposal has been funded by another lender'
          }
        </p>
      </div>
    );
  }

  if (!loanRequest.blockchainTxHash) {
    return (
      <div className="text-center py-4">
        <p className="text-sm text-gray-600">Not available - proposal not on blockchain</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="text-center py-4">
        <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
        <p className="text-sm text-gray-600">Loading proposal details...</p>
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="text-center py-4">
        <p className="text-sm text-red-600">Unable to load proposal data</p>
      </div>
    );
  }

  const ethAmount = formatEther(proposal.capitalAmount);
  const usdAmount = ethToUsd(ethAmount);
  const isProcessing = txStep !== 'idle' && txStep !== 'failed';

  const getStatusText = () => {
    if (txStep === 'waiting' || isConfirming) {
      return `⏳ Waiting for 2 confirmations${hash ? ` - Tx: ${hash.slice(0, 10)}...` : ''}`;
    }
    if (txStep === 'confirmed') {
      return '✅ Transaction confirmed! Updating status...';
    }
    if (txStep === 'failed') {
      return '❌ Transaction failed. Try again.';
    }
    return null;
  };

  const getButtonText = () => {
    switch (txStep) {
      case 'submitting': return 'Submitting Transaction...';
      case 'waiting': return 'Confirming...';
      case 'confirmed': return 'Processing...';
      case 'failed': return 'Try Again';
      default: return `💰 Fund ${ethAmount} ETH`;
    }
  };

  return (
    <div className="space-y-4">
      <div className="p-4 bg-green-50 dark:bg-green-900/20 border-2 border-green-400 rounded">
        <h4 className="font-bold text-green-800 dark:text-green-200 mb-2">💰 Fund This Proposal</h4>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-green-700 dark:text-green-300">Amount Required:</span>
            <span className="font-bold">{ethAmount} ETH</span>
          </div>
          <div className="flex justify-between">
            <span className="text-green-700 dark:text-green-300">USD Equivalent:</span>
            <span className="font-bold">{formatUsdAmount(usdAmount)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-green-700 dark:text-green-300">Proposal ID:</span>
            <span className="font-mono text-xs">{proposal.id.toString()}</span>
          </div>
        </div>
      </div>

      {/* Transaction Status */}
      {getStatusText() && (
        <div className={`p-2 border-2 rounded ${
          txStep === 'failed' 
            ? 'bg-red-50  border-red-400' 
            : 'bg-yellow-50  border-yellow-400'
        }`}>
          <p className={`text-xs ${
            txStep === 'failed' 
              ? 'text-red-800 ' 
              : 'text-yellow-800 '
          }`}>
            {getStatusText()}
          </p>
        </div>
      )}

      <NeoButton
        variant={txStep === 'failed' ? 'danger' : 'success'}
        size="lg"
        className="w-full"
        onClick={handleFundProposal}
        disabled={!isConnected || isProcessing}
      >
        {isProcessing ? (
          <>
            <span className="animate-spin mr-2">⏳</span>
            {getButtonText()}
          </>
        ) : (
          getButtonText()
        )}
      </NeoButton>

      {!isConnected && (
        <p className="text-xs text-center text-gray-600">Connect your wallet to fund this proposal</p>
      )}
    </div>
  );
}