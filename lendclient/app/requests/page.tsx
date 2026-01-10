'use client';

import { useState } from 'react';
import { useQuery, useMutation, useAction } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { NeoCard } from '@/components/ui/NeoCard';
import { NeoBadge } from '@/components/ui/NeoBadge';
import { NeoButton } from '@/components/ui/NeoButton';
import { useToast } from '@/components/ui/NeoToast';
// import { NilaiTestComponent } from '@/components/ui/NilaiTestComponent';

type Tab = 'borrower' | 'lender';

export default function RequestsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('borrower');
  const { showToast } = useToast();
  
  const borrowerRequests = useQuery(api.assessments.listBorrowerAssessments);
  const lenderRequests = useQuery(api.assessments.listLenderAssessments);
  const approveAssessment = useMutation(api.assessments.approveAssessment);
  const declineAssessment = useMutation(api.assessments.declineAssessment);
  const processAssessment = useAction(api.assessments.processAssessment);

  const statusColors: Record<string, 'accent' | 'secondary' | 'success' | 'danger' | 'neutral'> = {
    pending: 'accent',
    processing: 'secondary',
    completed: 'success',
    declined: 'danger',
    awaiting_consent: 'neutral',
  };

  const statusLabels: Record<string, string> = {
    pending: 'Pending Approval',
    processing: 'Processing',
    completed: 'Completed',
    declined: 'Declined',
    awaiting_consent: 'Awaiting Consent',
  };

  const handleApprove = async (assessmentId: Id<"assessmentRequests">) => {
    try {
      await approveAssessment({ assessmentId });
      showToast('Assessment request approved', 'success');
      
      setTimeout(async () => {
        try {
          await processAssessment({ assessmentId });
        } catch (error) {
          console.error('Failed to process assessment:', error);
        }
      }, 100);
    } catch (error: unknown) {
      showToast(error instanceof Error ? error.message : 'Failed to approve assessment', 'danger');
    }
  };

  const handleDecline = async (assessmentId: Id<"assessmentRequests">) => {
    try {
      await declineAssessment({ assessmentId });
      showToast('Assessment request declined', 'info');
    } catch (error: unknown) {
      showToast(error instanceof Error ? error.message : 'Failed to decline assessment', 'danger');
    }
  };

  return (
    <main className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl sm:text-5xl font-black uppercase mb-4">Requests</h1>
          <p className="text-xl font-semibold">Manage assessment requests and results</p>
        </div>

        <div className="flex gap-4 mb-8">
          <NeoButton
            variant={activeTab === 'borrower' ? 'primary' : 'secondary'}
            size="lg"
            onClick={() => setActiveTab('borrower')}
          >
            As Borrower ({borrowerRequests?.length || 0})
          </NeoButton>
          <NeoButton
            variant={activeTab === 'lender' ? 'primary' : 'secondary'}
            size="lg"
            onClick={() => setActiveTab('lender')}
          >
            As Lender ({lenderRequests?.length || 0})
          </NeoButton>
        </div>

        {/* Add Nilai Test Component */}
        {/* <div className="mb-8">
          <NilaiTestComponent />
        </div> */}

        {activeTab === 'borrower' && (
          <div className="space-y-6">
            <NeoCard bg="bg-accent" className="bg-opacity-30">
              <p className="font-bold text-sm">
                These are requests from lenders who want to run a private assessment on your encrypted data. Approve or decline each request.
              </p>
            </NeoCard>

            {!borrowerRequests ? (
              <NeoCard bg="bg-white">
                <p className="text-lg font-semibold">Loading...</p>
              </NeoCard>
            ) : borrowerRequests.length === 0 ? (
              <NeoCard bg="bg-white">
                <div className="text-center py-12">
                  <svg className="w-24 h-24 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3 className="text-2xl font-black uppercase mb-2">No Requests Yet</h3>
                  <p className="text-lg font-semibold text-gray-600">Lenders will request assessments when they&apos;re interested in your loan</p>
                </div>
              </NeoCard>
            ) : (
              <div className="space-y-4">
                {borrowerRequests.map(request => (
                  <NeoCard key={request._id} bg="bg-white">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                      <div>
                        <h3 className="text-2xl font-black mb-1">{request.lenderName}</h3>
                        <p className="text-sm font-semibold text-gray-600">
                          Requested {new Date(request.requestedAt).toLocaleDateString()}
                        </p>
                        {request.completedAt && (
                          <p className="text-sm font-semibold text-gray-600">
                            Completed {new Date(request.completedAt).toLocaleDateString()}
                          </p>
                        )}
                        {request.declinedAt && (
                          <p className="text-sm font-semibold text-gray-600">
                            Declined {new Date(request.declinedAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <NeoBadge variant={statusColors[request.status]}>
                        {statusLabels[request.status]}
                      </NeoBadge>
                    </div>

                    {request.status === 'pending' && (
                      <div className="p-4 bg-accent bg-opacity-30 border-4 border-foreground mb-4">
                        <p className="text-sm font-bold mb-3">
                          {request.lenderName} wants to run a private assessment on your encrypted data. Fee: {request.fee} credits
                        </p>
                        <div className="flex gap-3">
                          <NeoButton
                            size="sm"
                            variant="success"
                            onClick={() => handleApprove(request._id)}
                          >
                            Approve
                          </NeoButton>
                          <NeoButton
                            size="sm"
                            variant="danger"
                            onClick={() => handleDecline(request._id)}
                          >
                            Decline
                          </NeoButton>
                        </div>
                      </div>
                    )}

                    {request.status === 'processing' && (
                      <div className="p-4 bg-secondary bg-opacity-30 border-4 border-foreground">
                        <p className="text-sm font-bold">
                          AI model is running on your encrypted data. Results will be available soon.
                        </p>
                      </div>
                    )}

                    {request.status === 'completed' && (
                      <div className="p-4 bg-success bg-opacity-30 border-4 border-foreground">
                        <div className="flex items-center justify-between mb-4">
                          <p className="font-bold text-sm uppercase">Trust Score</p>
                          <p className="text-3xl font-black">{request.trustScore}/100</p>
                        </div>
                        <div>
                          <p className="font-bold text-sm uppercase mb-2">Risk Assessment</p>
                          <ul className="space-y-2">
                            
                            {request.summaryBullets?.map((item, idx) => (
                              <li key={idx} className="text-sm font-semibold flex items-start gap-2">
                                <span className="text-primary font-black">•</span>
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <p className="text-xs font-bold mt-4 text-gray-600">
                          This score has been shared with {request.lenderName}
                        </p>
                      </div>
                    )}

                    {request.status === 'declined' && (
                      <div className="p-4 bg-danger bg-opacity-20 border-4 border-foreground">
                        <p className="text-sm font-bold">
                          You declined this assessment request.
                        </p>
                      </div>
                    )}
                  </NeoCard>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'lender' && (
          <div className="space-y-6">
            <NeoCard bg="bg-secondary" className="bg-opacity-30">
              <p className="font-bold text-sm">
                Track all assessment requests you&apos;ve made. View completed scores and ongoing assessments.
              </p>
            </NeoCard>

            {!lenderRequests ? (
              <NeoCard bg="bg-white">
                <p className="text-lg font-semibold">Loading...</p>
              </NeoCard>
            ) : lenderRequests.length === 0 ? (
              <NeoCard bg="bg-white">
                <div className="text-center py-12">
                  <svg className="w-24 h-24 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <h3 className="text-2xl font-black uppercase mb-2">No Assessments Yet</h3>
                  <p className="text-lg font-semibold text-gray-600">Visit the marketplace to request assessments</p>
                </div>
              </NeoCard>
            ) : (
              <div className="space-y-4">
                {lenderRequests.map(request => (
                  <NeoCard key={request._id} bg="bg-white">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                      <div>
                        <h3 className="text-2xl font-black mb-1">{request.borrowerName}</h3>
                        {request.amount && request.duration && (
                          <p className="text-sm font-semibold text-gray-600">
                            ${request.amount.toLocaleString()} • {request.duration} months
                          </p>
                        )}
                        <p className="text-sm font-semibold text-gray-600">
                          Requested {new Date(request.requestedAt).toLocaleDateString()}
                        </p>
                        {request.completedAt && (
                          <p className="text-sm font-semibold text-gray-600">
                            Completed {new Date(request.completedAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <NeoBadge variant={statusColors[request.status]}>
                        {statusLabels[request.status]}
                      </NeoBadge>
                    </div>

                    <div className="mb-4">
                      <p className="text-xs font-bold text-gray-600">
                        Fee paid: {request.fee} credits
                      </p>
                    </div>

                    {request.status === 'pending' && (
                      <div className="p-4 bg-accent bg-opacity-30 border-4 border-foreground">
                        <p className="text-sm font-bold flex items-start gap-2">
                          <svg className="w-5 h-5 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>Waiting for borrower consent. You&apos;ll be notified when approved.</span>
                        </p>
                      </div>
                    )}

                    {request.status === 'processing' && (
                      <div className="p-4 bg-secondary bg-opacity-30 border-4 border-foreground">
                        <p className="text-sm font-bold">
                          Assessment in progress. AI model is computing Trust Score on encrypted data.
                        </p>
                      </div>
                    )}

                    {request.status === 'completed' && (
                      <div className="p-4 bg-success bg-opacity-30 border-4 border-foreground">
                        <div className="flex items-center justify-between mb-4">
                          <p className="font-bold text-sm uppercase">Trust Score</p>
                          <p className="text-3xl font-black">{request.trustScore}/100</p>
                        </div>
                        <div className="mb-4">
                          <p className="font-bold text-sm uppercase mb-2">Risk Assessment</p>
                          <ul className="space-y-2">
                            {request.summaryBullets?.map((item, idx) => (
                              <li key={idx} className="text-sm font-semibold flex items-start gap-2">
                                <span className="text-primary font-black">•</span>
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                  </NeoCard>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
