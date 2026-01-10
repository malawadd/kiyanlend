'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { NeoCard } from '../ui/NeoCard';
import { NeoButton } from '../ui/NeoButton';
import { NeoInput } from '../ui/NeoInput';
import { PayoutWalletSelector } from './PayoutWalletSelector';
import { useToast } from '../ui/NeoToast';

export function LoanRequestBuilder() {
  const router = useRouter();
  const [amount, setAmount] = useState('');
  const [duration, setDuration] = useState('6');
  const [purpose, setPurpose] = useState('');
  const [note, setNote] = useState('');
  const [allowAssessments, setAllowAssessments] = useState(true);
  const [payoutWallet, setPayoutWallet] = useState<Id<"wallets"> | undefined>();
  const { showToast } = useToast();
  const createLoanRequest = useMutation(api.loanRequests.createLoanRequest);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await createLoanRequest({
        amount: parseFloat(amount),
        duration: parseInt(duration),
        purpose,
        note: note || undefined,
        allowAssessments,
        payoutWallet,
      });
      showToast('Loan request created successfully', 'success');
      
      // Redirect to the detailed page for the new request
      router.push(`/borrow/${result.shortId}`);
      
      // Reset form
      setAmount('');
      setPurpose('');
      setNote('');
    } catch (error: unknown) {
      showToast(error instanceof Error ? error.message : 'Failed to create loan request', 'danger');
    }
  };

  return (
    <NeoCard bg="bg-white">
      <h3 className="text-2xl font-black uppercase mb-6">Quick Create Loan Request</h3>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid md:grid-cols-2 gap-4">
          <NeoInput
            label="Loan Amount (USD)"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="5000"
            required
          />
          <div className="flex flex-col gap-2">
            <label className="font-bold text-sm uppercase tracking-wide">
              Duration (Months)
            </label>
            <select
              className="neo-input px-4 py-3"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
            >
              <option value="3">3 Months</option>
              <option value="6">6 Months</option>
              <option value="12">12 Months</option>
              <option value="18">18 Months</option>
              <option value="24">24 Months</option>
            </select>
          </div>
        </div>

        <NeoInput
          label="Purpose"
          type="text"
          value={purpose}
          onChange={(e) => setPurpose(e.target.value)}
          placeholder="e.g., Business expansion, Education, Emergency"
          required
        />

        <div className="flex flex-col gap-2">
          <label className="font-bold text-sm uppercase tracking-wide">
            Additional Note (Optional)
          </label>
          <textarea
            className="neo-input px-4 py-3 min-h-[100px]"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Any additional information you'd like to share with lenders"
          />
        </div>

        <PayoutWalletSelector
          selectedWallet={payoutWallet}
          onWalletSelect={setPayoutWallet}
          showNoneOption={true}
        />

        <div className="p-4 border-4 border-foreground bg-accent bg-opacity-30">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={allowAssessments}
              onChange={(e) => setAllowAssessments(e.target.checked)}
              className="mt-1 w-5 h-5 border-4 border-foreground"
            />
            <div>
              <p className="font-bold">Allow lenders to request private Trust Score assessments</p>
              <p className="text-sm font-semibold mt-1">
                Lenders will run AI models on your encrypted data. Only the Trust Score is shared, never your files.
              </p>
            </div>
          </label>
        </div>

        <div className="p-4 bg-primary bg-opacity-30 border-4 border-foreground">
          <p className="text-sm font-bold flex items-start gap-2">
            <span>🔒</span>
            <span>Privacy Note: Lenders will only see your Trust Score, loan amount, purpose, and connected wallets. Your raw documents remain encrypted.</span>
          </p>
        </div>

        <div className="flex gap-3">
          <NeoButton type="submit" variant="primary" size="lg" className="flex-1">
            Create Draft Request
          </NeoButton>
          <NeoButton 
            type="button" 
            variant="secondary" 
            size="lg"
            onClick={() => router.push('/borrow/new')}
          >
            Advanced Options
          </NeoButton>
        </div>
      </form>
    </NeoCard>
  );
}
