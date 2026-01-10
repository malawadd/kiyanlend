'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { NeoCard } from '@/components/ui/NeoCard';
import { NeoButton } from '@/components/ui/NeoButton';
import { NeoBadge } from '@/components/ui/NeoBadge';
import { NeoInput } from '@/components/ui/NeoInput';
import { PayoutWalletSelector } from '@/components/borrower/PayoutWalletSelector';
import { useToast } from '@/components/ui/NeoToast';
import { LoanRequestUploadPanel } from '@/components/borrower/LoanRequestUploadPanel';
import { MarketplaceStatus } from '@/components/borrower/MarketplaceStatus';
import { formatCurrency, formatDuration, getStatusColor, getStatusLabel, isValidShortId } from '@/lib/loan-utils';

interface Props {
  params: Promise<{ shortId: string }>;
}

export default function BorrowRequestDetailPage({ params }: Props) {
  const router = useRouter();
  const { showToast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  
  // Unwrap params Promise
  const { shortId } = use(params);
  
  // Form state
  const [amount, setAmount] = useState('');
  const [duration, setDuration] = useState('6');
  const [purpose, setPurpose] = useState('');
  const [note, setNote] = useState('');
  const [allowAssessments, setAllowAssessments] = useState(true);
  const [payoutWallet, setPayoutWallet] = useState<Id<"wallets"> | undefined>();

  const updateLoanRequest = useMutation(api.loanRequests.updateLoanRequest);

  // All hooks must be called before any early returns
  const loanRequest = useQuery(api.loanRequests.getLoanRequestByShortId, { 
    shortId: shortId 
  });

  const assessments = useQuery(api.assessments.listBorrowerAssessments);
  const requestDocuments = useQuery(
    api.documents.listDocumentsForLoanRequest,
    loanRequest?._id ? { loanRequestId: loanRequest._id } : "skip"
  );
  const wallets = useQuery(api.wallets.listWallets);

  // Check if request exists and user owns it
  useEffect(() => {
    if (loanRequest === null) {
      router.push('/404');
    }
  }, [loanRequest, router]);

  // Initialize form when data loads
  useEffect(() => {
    if (loanRequest && !isEditing) {
      setAmount(loanRequest.amount.toString());
      setDuration(loanRequest.duration.toString());
      setPurpose(loanRequest.purpose);
      setNote(loanRequest.note || '');
      setAllowAssessments(loanRequest.allowAssessments);
      setPayoutWallet(loanRequest.payoutWallet || undefined);
    }
  }, [loanRequest, isEditing]);

  // Validate shortId format - now after all hooks
  if (!isValidShortId(shortId)) {
    router.push('/404');
    return null;
  }

  const handleSave = async () => {
    if (!loanRequest) return;
    
    try {
      await updateLoanRequest({
        shortId: shortId,
        amount: parseFloat(amount),
        duration: parseInt(duration),
        purpose,
        note: note || undefined,
        allowAssessments,
        payoutWallet,
      });
      setIsEditing(false);
      showToast('Request updated successfully', 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to update request', 'danger');
    }
  };



  if (loanRequest === undefined) {
    return (
      <main className="min-h-screen py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <NeoCard bg="bg-white">
            <p className="text-lg font-semibold">Loading request details...</p>
          </NeoCard>
        </div>
      </main>
    );
  }

  if (loanRequest === null) {
    return null; // Will redirect to 404
  }

  const isPublished = loanRequest.isPublished && loanRequest.status === 'active';
  const relatedAssessments = assessments?.filter(() => 
    // Note: We'd need to add loanRequestId to assessments to properly filter
    // For now, showing all assessments for this borrower
    true
  ) || [];

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
              <h1 className="text-3xl font-black uppercase">
                {isEditing ? 'Edit Request' : 'Loan Request'} 
              </h1>
              <p className="text-lg font-semibold text-gray-600">ID: {shortId}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <NeoBadge variant={getStatusColor(loanRequest.status)}>
              {getStatusLabel(loanRequest.status)}
            </NeoBadge>
            {isPublished && (
              <NeoBadge variant="success">Live on Marketplace</NeoBadge>
            )}
            <span className="text-sm font-semibold text-gray-600">
              Created {new Date(loanRequest.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>

        <div className="space-y-8">
          {/* Main Request Details */}
          <NeoCard bg="bg-white">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black uppercase">Request Details</h2>
              <div className="flex gap-2">
                {isEditing ? (
                  <>
                    <NeoButton variant="success" onClick={handleSave}>
                      Save Changes
                    </NeoButton>
                    <NeoButton variant="secondary" onClick={() => setIsEditing(false)}>
                      Cancel
                    </NeoButton>
                  </>
                ) : (
                  <NeoButton variant="accent" onClick={() => setIsEditing(true)}>
                    Edit Request
                  </NeoButton>
                )}
              </div>
            </div>

            {isEditing ? (
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <NeoInput
                    label="Loan Amount (USD)"
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
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
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
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
                    placeholder="Any additional information for lenders"
                  />
                </div>

                <PayoutWalletSelector
                  selectedWallet={payoutWallet}
                  onWalletSelect={setPayoutWallet}
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
                      <p className="font-bold">Allow lenders to request private assessments</p>
                      <p className="text-sm font-semibold mt-1">
                        Lenders can run AI models on your encrypted data for Trust Scores
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm font-semibold text-gray-600 mb-1">Amount</p>
                    <p className="text-3xl font-black text-primary">{formatCurrency(loanRequest.amount)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-600 mb-1">Duration</p>
                    <p className="text-2xl font-black">{formatDuration(loanRequest.duration)}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-semibold text-gray-600 mb-1">Purpose</p>
                  <p className="text-lg font-semibold">{loanRequest.purpose}</p>
                </div>

                {loanRequest.note && (
                  <div>
                    <p className="text-sm font-semibold text-gray-600 mb-1">Additional Note</p>
                    <p className="text-sm font-semibold">{loanRequest.note}</p>
                  </div>
                )}

                {loanRequest.payoutWalletAddress && (
                  <div>
                    <p className="text-sm font-semibold text-gray-600 mb-1">Payout Wallet</p>
                    <p className="text-sm font-mono font-bold">{loanRequest.payoutWalletAddress}</p>
                  </div>
                )}

                <div className="p-4 border-4 border-foreground bg-gray-50">
                  <p className="font-bold text-sm mb-1">Assessment Settings</p>
                  <p className="text-sm font-semibold">
                    {loanRequest.allowAssessments ? 
                      '✅ Lenders can request private assessments' : 
                      '❌ Assessments disabled'
                    }
                  </p>
                </div>
              </div>
            )}
          </NeoCard>

          {/* Document Upload Section */}
          {loanRequest && (
            <LoanRequestUploadPanel 
              loanRequestId={loanRequest._id} 
              shortId={loanRequest.shortId}
            />
          )}

          {/* Publishing Controls */}
          {!isEditing && (
            <MarketplaceStatus loanRequest={loanRequest} />
          )}

          {/* Assessment Activity */}
          {relatedAssessments.length > 0 && (
            <NeoCard bg="bg-white">
              <h3 className="text-xl font-black uppercase mb-4">Assessment Activity</h3>
              <div className="space-y-3">
                {relatedAssessments.map((assessment) => (
                  <div key={assessment._id} className="p-4 border-4 border-foreground bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-black">{assessment.lenderName}</h4>
                        <p className="text-sm font-semibold text-gray-600">
                          {new Date(assessment.requestedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <NeoBadge variant={
                        assessment.status === 'completed' ? 'success' :
                        assessment.status === 'pending' ? 'accent' :
                        assessment.status === 'processing' ? 'secondary' : 'danger'
                      }>
                        {assessment.status}
                      </NeoBadge>
                    </div>
                    
                    {assessment.status === 'completed' && assessment.trustScore && (
                      <div className="mt-3 p-3 bg-success bg-opacity-20 border-2 border-foreground">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold">Trust Score</span>
                          <span className="text-xl font-black">{assessment.trustScore}/100</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </NeoCard>
          )}

          {/* Quick Stats */}
          <div className="grid md:grid-cols-3 gap-6">
            <NeoCard bg="bg-secondary">
              <h4 className="font-black text-sm uppercase mb-2">Documents</h4>
              <p className="text-2xl font-black">{requestDocuments?.length || 0}</p>
              <p className="text-xs font-semibold text-gray-600">Supporting this request</p>
            </NeoCard>
            
            <NeoCard bg="bg-accent">
              <h4 className="font-black text-sm uppercase mb-2">Wallets</h4>
              <p className="text-2xl font-black">{wallets?.length || 0}</p>
              <p className="text-xs font-semibold text-gray-600">Connected accounts</p>
            </NeoCard>
            
            <NeoCard bg="bg-success">
              <h4 className="font-black text-sm uppercase mb-2">Assessments</h4>
              <p className="text-2xl font-black">{loanRequest.assessmentCount}</p>
              <p className="text-xs font-semibold text-gray-600">Total requests</p>
            </NeoCard>
          </div>
        </div>
      </div>
    </main>
  );
}