'use client';

import { useState } from 'react';
import { useMutation, useAction, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { NeoCard } from '@/components/ui/NeoCard';
// import { NeoBadge } from '@/components/ui/NeoBadge';
import { NeoButton } from '@/components/ui/NeoButton';
import { BorrowerCard } from '@/components/lender/BorrowerCard';
import { AssessmentModal } from '@/components/lender/AssessmentModal';
import { useToast } from '@/components/ui/NeoToast';

export default function LendPage() {
  const [selectedBorrower, setSelectedBorrower] = useState<{ id: Id<"users">; shortId: string; name: string } | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [filterBy, setFilterBy] = useState<'all' | 'with-score' | 'assessable'>('all');
  
  const loanRequests = useQuery(api.loanRequests.listPublicLoanRequests);
  const createAssessment = useMutation(api.assessments.createAssessmentRequest);
  const processAssessment = useAction(api.assessments.processAssessment);
  const { showToast } = useToast();

  const handleRequestAssessment = (borrowerId: Id<"users">, shortId: string) => {
    const request = loanRequests?.find(r => r.userId === borrowerId);
    setSelectedBorrower({ 
      id: borrowerId, 
      shortId, 
      name: request?.borrower.displayName || 'Unknown' 
    });
    setModalOpen(true);
  };

  const handleConfirmAssessment = async () => {
    if (!selectedBorrower) return;
    
    try {
      const assessmentId = await createAssessment({
        borrowerId: selectedBorrower.id,
      });
      showToast('Assessment request submitted', 'success');
      setModalOpen(false);
      setSelectedBorrower(null);
      
      // Process assessment in background
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

  // Filter loan requests
  const filteredRequests = loanRequests?.filter(request => {
    switch (filterBy) {
      case 'with-score':
        return request.borrower.humanityScore !== undefined;
      case 'assessable':
        return request.allowAssessments && !request.borrower.hasExistingAssessment;
      default:
        return true;
    }
  }) || [];

  const stats = {
    total: loanRequests?.length || 0,
    withScore: loanRequests?.filter(r => r.borrower.humanityScore).length || 0,
    assessable: loanRequests?.filter(r => r.allowAssessments && !r.borrower.hasExistingAssessment).length || 0,
  };

  return (
    <main className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl sm:text-5xl font-black uppercase mb-4">Lender Marketplace</h1>
          <p className="text-xl font-semibold">Discover borrowers and run private AI assessments</p>
        </div>

        {/* Stats & Filters */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <NeoCard bg="bg-primary">
            <h3 className="text-lg font-black uppercase mb-1">Total Requests</h3>
            <p className="text-3xl font-black">{stats.total}</p>
          </NeoCard>
          
          <NeoCard bg="bg-secondary">
            <h3 className="text-lg font-black uppercase mb-1">With Humanity Score</h3>
            <p className="text-3xl font-black">{stats.withScore}</p>
          </NeoCard>
          
          <NeoCard bg="bg-success">
            <h3 className="text-lg font-black uppercase mb-1">Available for Assessment</h3>
            <p className="text-3xl font-black">{stats.assessable}</p>
          </NeoCard>
          
          {/* <NeoCard bg="bg-accent">
            <h3 className="text-lg font-black uppercase mb-1">Filter Results</h3>
            <div className="flex gap-1 flex-wrap">
              <NeoBadge 
                variant={filterBy === 'all' ? 'primary' : 'neutral'} 
               
                className="cursor-pointer"
                onClick={() => setFilterBy('all')}
              >
                All ({stats.total})
              </NeoBadge>
              <NeoBadge 
                variant={filterBy === 'with-score' ? 'primary' : 'neutral'} 
                
                className="cursor-pointer"
                onClick={() => setFilterBy('with-score')}
              >
                With Score ({stats.withScore})
              </NeoBadge>
              <NeoBadge 
                variant={filterBy === 'assessable' ? 'primary' : 'neutral'} 
                
                className="cursor-pointer"
                onClick={() => setFilterBy('assessable')}
              >
                Assessable ({stats.assessable})
              </NeoBadge>
            </div>
          </NeoCard> */}
        </div>

        {/* Results */}
        <div className="mb-6 flex items-center justify-between">
          <p className="text-lg font-bold">
            {filteredRequests.length} Request{filteredRequests.length !== 1 ? 's' : ''} Found
          </p>
          {filterBy !== 'all' && (
            <NeoButton variant="secondary" size="sm" onClick={() => setFilterBy('all')}>
              Clear Filter
            </NeoButton>
          )}
        </div>

        {!loanRequests ? (
          <NeoCard bg="bg-white">
            <p className="text-lg font-semibold">Loading marketplace...</p>
          </NeoCard>
        ) : filteredRequests.length === 0 ? (
          <NeoCard bg="bg-white">
            <div className="text-center py-12">
              <svg className="w-24 h-24 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <h3 className="text-2xl font-black uppercase mb-2">
                {filterBy === 'all' ? 'No Active Requests' : 'No Matching Requests'}
              </h3>
              <p className="text-lg font-semibold text-gray-600">
                {filterBy === 'all' 
                  ? 'Check back later for new loan requests' 
                  : 'Try adjusting your filters or check back later'
                }
              </p>
            </div>
          </NeoCard>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRequests.map((request) => (
              <BorrowerCard
                key={request._id}
                request={request}
                onRequestAssessment={handleRequestAssessment}
              />
            ))}
          </div>
        )}

        {/* Info Cards */}
        {loanRequests && loanRequests.length > 0 && (
          <div className="mt-12 grid md:grid-cols-2 gap-6">
            <NeoCard bg="bg-secondary" className="bg-opacity-30">
              <h3 className="text-xl font-black uppercase mb-4">How Assessments Work</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-black text-sm">1</div>
                  <div>
                    <p className="font-bold text-sm">Request Assessment</p>
                    <p className="text-xs font-semibold text-gray-600">Pay 0.5 credits to run AI analysis</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-secondary text-white rounded-full flex items-center justify-center font-black text-sm">2</div>
                  <div>
                    <p className="font-bold text-sm">Borrower Approval</p>
                    <p className="text-xs font-semibold text-gray-600">Borrower reviews and approves your request</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-success text-white rounded-full flex items-center justify-center font-black text-sm">3</div>
                  <div>
                    <p className="font-bold text-sm">Get Trust Score</p>
                    <p className="text-xs font-semibold text-gray-600">Receive AI-generated risk assessment</p>
                  </div>
                </div>
              </div>
            </NeoCard>

            <NeoCard bg="bg-accent" className="bg-opacity-30">
              <h3 className="text-xl font-black uppercase mb-4">Privacy & Security</h3>
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <span className="text-success font-black">✓</span>
                  <p className="text-sm font-semibold">Documents remain encrypted in SecretVault</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-success font-black">✓</span>
                  <p className="text-sm font-semibold">Only AI summaries are shared, never raw files</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-success font-black">✓</span>
                  <p className="text-sm font-semibold">Borrower consent required for each assessment</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-success font-black">✓</span>
                  <p className="text-sm font-semibold">Humanity Score verifies real human identity</p>
                </div>
              </div>
            </NeoCard>
          </div>
        )}
      </div>

      <AssessmentModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedBorrower(null);
        }}
        onConfirm={handleConfirmAssessment}
        borrowerName={selectedBorrower?.name || ''}
        fee={0.5}
      />
    </main>
  );
}
