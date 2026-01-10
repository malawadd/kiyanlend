'use client';

import { useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useAction } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { NeoCard } from '@/components/ui/NeoCard';
import { NeoButton } from '@/components/ui/NeoButton';
import { NeoBadge } from '@/components/ui/NeoBadge';
import { AssessmentModal } from '@/components/lender/AssessmentModal';
import { FundProposal } from '@/components/lender/FundProposal';
import { useToast } from '@/components/ui/NeoToast';
import { formatCurrency, formatDuration } from '@/lib/loan-utils';

interface Props {
  params: Promise<{ shortId: string }>;
}

export default function LendRequestDetailPage({ params }: Props) {
  const router = useRouter();
  const { showToast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  
  const { shortId } = use(params);
  
  const loanRequest = useQuery(api.loanRequests.getPublicLoanRequestByShortId, { 
    shortId 
  });
  const createAssessment = useMutation(api.assessments.createAssessmentRequest);
  const processAssessment = useAction(api.assessments.processAssessment);

  const handleRequestAssessment = () => {
    if (!loanRequest?.canRequestAssessment) return;
    setModalOpen(true);
  };

  const handleConfirmAssessment = async () => {
    if (!loanRequest) return;
    
    try {
      const assessmentId = await createAssessment({
        borrowerId: loanRequest.userId,
      });
      showToast('Assessment request submitted successfully', 'success');
      setModalOpen(false);
      
      setTimeout(async () => {
        try {
          await processAssessment({ assessmentId });
        } catch (error) {
          console.error('Failed to process assessment:', error);
        }
      }, 100);
    } catch (error: unknown) {
      showToast(error instanceof Error ? error.message : 'Failed to create assessment', 'danger');
    }
  };

  // Loading state
  if (loanRequest === undefined) {
    return (
      <main className="min-h-screen py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <NeoCard bg="bg-white">
            <p className="text-lg font-semibold">Loading request details...</p>
          </NeoCard>
        </div>
      </main>
    );
  }

  // 404 for non-public or non-existent requests
  if (loanRequest === null) {
    return (
      <main className="min-h-screen py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <NeoCard bg="bg-gray-50">
            <div className="text-center py-12">
              <svg className="w-24 h-24 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12a4 4 0 118 0 4 4 0 01-8 0zM9 12a4 4 0 118 0 4 4 0 01-8 0z" />
              </svg>
              <h2 className="text-3xl font-black uppercase mb-2">Request Not Available</h2>
              <p className="text-lg font-semibold text-gray-600 mb-6">
                This loan request is not publicly available or does not exist.
              </p>
              <NeoButton variant="primary" onClick={() => router.push('/lend')}>
                Back to Marketplace
              </NeoButton>
            </div>
          </NeoCard>
        </div>
      </main>
    );
  }

  const humanityScore = loanRequest.borrowerHumanityScore;
  const hasExistingAssessment = !!loanRequest.existingAssessment;
  const assessmentStatus = loanRequest.existingAssessment?.status;

  return (
    <main className="min-h-screen py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
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
              <h1 className="text-3xl font-black uppercase">Loan Request Details</h1>
              <p className="text-lg font-semibold text-gray-600">
                {loanRequest.borrowerName} • ID: {shortId}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <NeoBadge variant="success">Active Request</NeoBadge>
            {hasExistingAssessment && (
              <NeoBadge variant={assessmentStatus === 'completed' ? 'success' : 'accent'}>
                {assessmentStatus === 'completed' ? 'Assessment Complete' : 'Assessment Pending'}
              </NeoBadge>
            )}
            <span className="text-sm font-semibold text-gray-600">
              Posted {new Date(loanRequest.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Loan Details */}
            <NeoCard bg="bg-white">
              <h2 className="text-2xl font-black uppercase mb-4">Request Overview</h2>
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div>
                  <p className="text-sm font-semibold text-gray-600 mb-1">Amount Requested</p>
                  <p className="text-4xl font-black text-primary">{formatCurrency(loanRequest.amount)}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-600 mb-1">Duration</p>
                  <p className="text-2xl font-black">{formatDuration(loanRequest.duration)}</p>
                </div>
              </div>
              
              <div className="mb-6">
                <p className="text-sm font-semibold text-gray-600 mb-2">Purpose</p>
                <p className="text-lg font-bold">{loanRequest.purpose}</p>
              </div>

              {loanRequest.note && (
                <div>
                  <p className="text-sm font-semibold text-gray-600 mb-2">Additional Information</p>
                  <p className="text-sm font-semibold bg-gray-50 p-3 border-2 border-foreground">
                    {loanRequest.note}
                  </p>
                </div>
              )}
            </NeoCard>

            {/* Borrower Profile */}
            <NeoCard bg="bg-white">
              <h2 className="text-2xl font-black uppercase mb-4">Borrower Profile</h2>
              
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div>
                  <p className="text-sm font-semibold text-gray-600 mb-1">Display Name</p>
                  <p className="text-xl font-black">{loanRequest.borrowerName}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-600 mb-1">Connected Wallets</p>
                  <p className="text-xl font-black">{loanRequest.borrowerWalletsCount}</p>
                </div>
              </div>

              {/* Humanity Score */}
              <div className="p-4 bg-secondary bg-opacity-30 border-4 border-foreground mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-black uppercase">Humanity Verification</h3>
                  <div className="text-right">
                    <p className="text-3xl font-black">
                      {humanityScore ? `${humanityScore}/100` : '—'}
                    </p>
                    {loanRequest.borrowerHumanityVerified && (
                      <NeoBadge variant="success" >Verified</NeoBadge>
                    )}
                  </div>
                </div>
                <p className="text-sm font-semibold text-gray-700">
                  {humanityScore 
                    ? `Verified human identity with ${humanityScore}% confidence score`
                    : 'Humanity score not available for this borrower'
                  }
                </p>
              </div>

              {/* Assessment History */}
              {loanRequest.totalAssessments > 0 && (
                <div className="p-3 bg-accent bg-opacity-20 border-2 border-foreground">
                  <p className="text-sm font-bold">
                    📊 This borrower has completed {loanRequest.totalAssessments} assessment{loanRequest.totalAssessments > 1 ? 's' : ''} with other lenders
                  </p>
                </div>
              )}
            </NeoCard>

            <NeoCard bg="bg-success" className="bg-opacity-20">
              <h3 className="text-xl font-black uppercase mb-4">Fund This Proposal</h3>
              <FundProposal 
                loanRequest={{
                  shortId: loanRequest.shortId,
                  amount: loanRequest.amount,
                  blockchainTxHash: loanRequest.blockchainTxHash,
                  borrowerName: loanRequest.borrowerName,
                  isFunded: loanRequest.isFunded,
                  fundedBy: loanRequest.fundedBy,
                  fundingTxHash: loanRequest.fundingTxHash,
                }}
                onSuccess={() => showToast('Proposal funded successfully!', 'success')}
              />
            </NeoCard>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Funding Action */}
            {/* <NeoCard bg="bg-success" className="bg-opacity-20">
              <h3 className="text-xl font-black uppercase mb-4">Fund This Proposal</h3>
              <FundProposal 
                loanRequest={{
                  shortId: loanRequest.shortId,
                  amount: loanRequest.amount,
                  blockchainTxHash: loanRequest.blockchainTxHash,
                  borrowerName: loanRequest.borrowerName,
                  isFunded: loanRequest.isFunded,
                  fundedBy: loanRequest.fundedBy,
                  fundingTxHash: loanRequest.fundingTxHash,
                }}
                onSuccess={() => showToast('Proposal funded successfully!', 'success')}
              />
            </NeoCard> */}

            {/* Assessment Action */}
            <NeoCard bg="bg-primary" className="bg-opacity-20">
              <h3 className="text-xl font-black uppercase mb-4">Private Assessment</h3>
              
              {!loanRequest.allowAssessments ? (
                <div className="text-center py-6">
                  <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L5.636 5.636" />
                    </svg>
                  </div>
                  <p className="text-sm font-bold text-gray-700 mb-2">Assessments Disabled</p>
                  <p className="text-xs font-semibold text-gray-600">
                    The borrower has chosen not to allow private assessments for this request.
                  </p>
                  
                </div>

                
              ) : hasExistingAssessment ? (
                <div className="text-center py-6">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 ${
                    assessmentStatus === 'completed' ? 'bg-success' : 'bg-accent'
                  }`}>
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {assessmentStatus === 'completed' ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      )}
                    </svg>
                  </div>
                  <p className="text-sm font-bold mb-2">
                    {assessmentStatus === 'completed' ? 'Assessment Complete' : 'Assessment Processing'}
                  </p>
                  <p className="text-xs font-semibold text-gray-600 mb-3">
                    {assessmentStatus === 'completed' 
                      ? 'You have already assessed this borrower.'
                      : 'Your assessment request is being processed.'
                    }
                  </p>
                  {assessmentStatus === 'completed' && loanRequest.existingAssessment?.trustScore && (
                    <div className="p-3 bg-success bg-opacity-30 border-2 border-success">
                      <p className="text-sm font-bold">Trust Score: {loanRequest.existingAssessment.trustScore}/100</p>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <div className="text-center py-6 mb-4">
                    <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-3">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <p className="text-sm font-bold mb-2">AI Risk Analysis Available</p>
                    <p className="text-xs font-semibold text-gray-600">
                      Run private AI assessment on encrypted financial data
                    </p>
                  </div>
                  
                  <div className="space-y-3 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="font-semibold">Assessment Fee:</span>
                      <span className="font-black">0.5 Credits</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="font-semibold">Processing Time:</span>
                      <span className="font-black">~30 seconds</span>
                    </div>
                  </div>

                  <NeoButton 
                    variant="accent" 
                    size="lg" 
                    className="w-full"
                    onClick={handleRequestAssessment}
                  >
                    Request Private Assessment
                  </NeoButton>
                </div>
              )}
            </NeoCard>

            {/* Quick Stats */}
            <NeoCard bg="bg-white">
              <h3 className="text-lg font-black uppercase mb-3">Quick Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm font-semibold text-gray-600">Wallets Connected</span>
                  <span className="text-sm font-black">{loanRequest.borrowerWalletsCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-semibold text-gray-600">Total Assessments</span>
                  <span className="text-sm font-black">{loanRequest.totalAssessments}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-semibold text-gray-600">Request Status</span>
                  <NeoBadge variant="success" >Active</NeoBadge>
                </div>
              </div>
            </NeoCard>

            {/* Privacy Notice */}
            <NeoCard bg="bg-accent" className="bg-opacity-30">
              <h4 className="font-black text-sm uppercase mb-2">Privacy Protected</h4>
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <span className="text-success font-black text-xs">✓</span>
                  <p className="text-xs font-semibold">Documents stay encrypted</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-success font-black text-xs">✓</span>
                  <p className="text-xs font-semibold">Only AI summaries shared</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-success font-black text-xs">✓</span>
                  <p className="text-xs font-semibold">Borrower consent required</p>
                </div>
              </div>
            </NeoCard>
          </div>
        </div>
      </div>

      <AssessmentModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onConfirm={handleConfirmAssessment}
        borrowerName={loanRequest.borrowerName}
        fee={0.5}
      />
    </main>
  );
}