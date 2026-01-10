'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { NeoCard } from '@/components/ui/NeoCard';
import { NeoButton } from '@/components/ui/NeoButton';
import { NeoInput } from '@/components/ui/NeoInput';
import { PayoutWalletSelector } from '@/components/borrower/PayoutWalletSelector';
import { LoanRequestUploadPanel } from '@/components/borrower/LoanRequestUploadPanel';
import { useToast } from '@/components/ui/NeoToast';

export default function NewBorrowRequestPage() {
  const router = useRouter();
  const { showToast } = useToast();
  
  // Form state
  const [amount, setAmount] = useState('');
  const [duration, setDuration] = useState('6');
  const [purpose, setPurpose] = useState('');
  const [note, setNote] = useState('');
  const [allowAssessments, setAllowAssessments] = useState(true);
  const [payoutWallet, setPayoutWallet] = useState<Id<"wallets"> | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdRequestId, setCreatedRequestId] = useState<Id<"loanRequests"> | null>(null);
  const [step, setStep] = useState<'details' | 'documents'>('details');

  const createLoanRequest = useMutation(api.loanRequests.createLoanRequest);

  const handleCreateRequest = async () => {
    if (!amount || !purpose) {
      showToast('Please fill in all required fields', 'danger');
      return;
    }

    setIsSubmitting(true);
    
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
      setCreatedRequestId(result.id);
      setStep('documents');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to create request', 'danger');
      setIsSubmitting(false);
    }
  };

  const handleFinish = () => {
    if (createdRequestId) {
      // Get the shortId from the result to navigate properly
      router.push(`/borrow`); // Could also navigate to specific request if we stored shortId
    }
  };

  return (
    <main className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 border-2 border-foreground"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-3xl font-black uppercase">Create Loan Request</h1>
              <p className="text-lg font-semibold text-gray-600">
                {step === 'details' ? 'Step 1: Basic Details' : 'Step 2: Supporting Documents'}
              </p>
            </div>
          </div>

          {/* Progress Indicator */}
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 ${step === 'details' ? 'text-primary' : 'text-success'}`}>
              <div className={`w-8 h-8 rounded-full border-4 border-current flex items-center justify-center font-black text-sm ${step === 'details' ? 'bg-primary text-white' : 'bg-success text-white'}`}>
                {step === 'details' ? '1' : '✓'}
              </div>
              <span className="font-bold">Request Details</span>
            </div>
            <div className="flex-1 h-1 bg-gray-300">
              <div className={`h-full transition-all duration-300 ${step === 'documents' ? 'bg-success w-full' : 'bg-primary w-0'}`}></div>
            </div>
            <div className={`flex items-center gap-2 ${step === 'documents' ? 'text-primary' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full border-4 border-current flex items-center justify-center font-black text-sm ${step === 'documents' ? 'bg-primary text-white' : ''}`}>
                2
              </div>
              <span className="font-bold">Documents</span>
            </div>
          </div>
        </div>

        {step === 'details' ? (
          <div className="space-y-8">
            {/* Basic Details */}
            <NeoCard bg="bg-white">
              <h2 className="text-2xl font-black uppercase mb-6">Loan Details</h2>
              
              <div className="space-y-6">
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
              </div>
            </NeoCard>

            {/* Payout Settings */}
            <NeoCard bg="bg-white">
              <h2 className="text-2xl font-black uppercase mb-6">Payout Settings</h2>
              
              <PayoutWalletSelector
                selectedWallet={payoutWallet}
                onWalletSelect={setPayoutWallet}
                label="Choose Payout Wallet"
              />
            </NeoCard>

            {/* Privacy & Assessment Settings */}
            <NeoCard bg="bg-accent" className="bg-opacity-30">
              <h2 className="text-2xl font-black uppercase mb-6">Privacy Settings</h2>
              
              <div className="space-y-4">
                <div className="p-4 border-4 border-foreground bg-white">
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
                    <span>
                      Privacy Note: Lenders will only see your Trust Score, loan amount, purpose, and connected wallets. 
                      Your raw documents remain encrypted in your SecretVault.
                    </span>
                  </p>
                </div>
              </div>
            </NeoCard>

            {/* Navigation */}
            <NeoCard bg="bg-white">
              <div className="flex flex-col sm:flex-row gap-4 justify-between">
                <NeoButton
                  type="button"
                  variant="secondary"
                  size="lg"
                  onClick={() => router.back()}
                  disabled={isSubmitting}
                >
                  Cancel
                </NeoButton>
                
                <NeoButton
                  type="button"
                  variant="primary"
                  size="lg"
                  disabled={isSubmitting || !amount || !purpose}
                  onClick={handleCreateRequest}
                >
                  {isSubmitting ? 'Creating...' : 'Continue to Documents'}
                </NeoButton>
              </div>
              
              <p className="text-xs font-semibold text-gray-600 mt-3 text-center">
                Next: Upload supporting documents to strengthen your application
              </p>
            </NeoCard>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Document Upload */}
            <div>
              <div className="mb-6">
                <h2 className="text-3xl font-black uppercase mb-2">Upload Supporting Documents</h2>
                <p className="text-lg font-semibold text-gray-600">
                  Add financial documents to support your loan request (optional but recommended)
                </p>
              </div>

              {createdRequestId && (
                <LoanRequestUploadPanel 
                  loanRequestId={createdRequestId}
                  compact={false}
                />
              )}
            </div>

            {/* Getting Started Tips */}
            <NeoCard bg="bg-secondary" className="bg-opacity-30">
              <h3 className="text-xl font-black uppercase mb-4">Tips for Better Success</h3>
              
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <span className="text-success text-xl">💡</span>
                  <div>
                    <p className="font-bold text-sm">Upload Recent Bank Statements</p>
                    <p className="text-xs font-semibold text-gray-600">
                      3-6 months of statements show consistent income and spending patterns
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <span className="text-success text-xl">💡</span>
                  <div>
                    <p className="font-bold text-sm">Include Income Verification</p>
                    <p className="text-xs font-semibold text-gray-600">
                      Pay stubs, invoices, or employment letters build lender confidence
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <span className="text-success text-xl">💡</span>
                  <div>
                    <p className="font-bold text-sm">Add Utility Bills</p>
                    <p className="text-xs font-semibold text-gray-600">
                      Regular bill payments demonstrate financial responsibility
                    </p>
                  </div>
                </div>
              </div>
            </NeoCard>

            {/* Finish Actions */}
            <NeoCard bg="bg-white">
              <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
                <div>
                  <h4 className="font-black text-lg mb-1">Ready to Publish?</h4>
                  <p className="text-sm font-semibold text-gray-600">
                    You can always add more documents later from the request management page
                  </p>
                </div>
                
                <div className="flex gap-3">
                  <NeoButton
                    variant="secondary"
                    size="lg"
                    onClick={handleFinish}
                  >
                    Save as Draft
                  </NeoButton>
                  
                  <NeoButton
                    variant="primary"
                    size="lg"
                    onClick={handleFinish}
                  >
                    Finish & Review Request
                  </NeoButton>
                </div>
              </div>
            </NeoCard>
          </div>
        )}
      </div>
    </main>
  );
}