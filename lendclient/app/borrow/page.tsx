'use client';

import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { NeoCard } from '@/components/ui/NeoCard';
import { NeoButton } from '@/components/ui/NeoButton';
import { NeoBadge } from '@/components/ui/NeoBadge';
// import { WalletManager } from '@/components/borrower/WalletManager';
import { BorrowRequestCard } from '@/components/borrower/BorrowRequestCard';
import Link from 'next/link';
// import { StoreToVaultButton } from '@/components/ui/StoreToVaultButton';

export default function BorrowPage() {
  const loanRequests = useQuery(api.loanRequests.listMyLoanRequests);
  const wallets = useQuery(api.wallets.listWallets);
  const allDocuments = useQuery(api.documents.listDocuments, {});
  const assessmentRequests = useQuery(api.assessments.listBorrowerAssessments);

  const stats = {
    totalRequests: loanRequests?.length || 0,
    activeRequests: loanRequests?.filter(r => r.status === 'active').length || 0,
    draftRequests: loanRequests?.filter(r => r.status === 'draft').length || 0,
    totalAssessments: assessmentRequests?.length || 0,
    completedAssessments: assessmentRequests?.filter(a => a.status === 'completed').length || 0,
    pendingAssessments: assessmentRequests?.filter(a => a.status === 'pending').length || 0,
    totalDocuments: allDocuments?.length || 0,
    documentsWithRequests: allDocuments?.filter(d => d.loanRequestId).length || 0,
  };

  return (
    <main className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl sm:text-5xl font-black uppercase mb-4">Borrower Dashboard</h1>
          <p className="text-xl font-semibold">Manage your loan requests and track assessment progress</p>
        </div>

        {/* <StoreToVaultButton /> */}
        {/* Quick Stats */}
        <div className="grid lg:grid-cols-4 gap-6 mb-8">
          <NeoCard bg="bg-primary">
            <div className="flex items-center gap-3 mb-2">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-xl font-black uppercase">Requests</h3>
            </div>
            <p className="text-2xl font-black mb-1">{stats.totalRequests}</p>
            <p className="text-sm font-semibold">
              {stats.activeRequests} Active, {stats.draftRequests} Draft
            </p>
          </NeoCard>

          <NeoCard bg="bg-secondary">
            <div className="flex items-center gap-3 mb-2">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <h3 className="text-xl font-black uppercase">Assessments</h3>
            </div>
            <p className="text-2xl font-black mb-1">{stats.totalAssessments}</p>
            <p className="text-sm font-semibold">
              {stats.completedAssessments} Completed, {stats.pendingAssessments} Pending
            </p>
          </NeoCard>

          <NeoCard bg="bg-success">
            <div className="flex items-center gap-3 mb-2">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <h3 className="text-xl font-black uppercase">Documents</h3>
            </div>
            <p className="text-2xl font-black mb-1">{stats.totalDocuments}</p>
            <p className="text-sm font-semibold">
              {stats.documentsWithRequests} linked to requests
            </p>
          </NeoCard>

          <NeoCard bg="bg-accent">
            <div className="flex items-center gap-3 mb-2">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              <h3 className="text-xl font-black uppercase">Wallets</h3>
            </div>
            <p className="text-2xl font-black mb-1">{wallets?.length || 0}</p>
            <p className="text-sm font-semibold">
              {wallets?.filter(w => w.isPrimary).length || 0} Primary, {wallets?.filter(w => !w.isPrimary).length || 0} Secondary
            </p>
          </NeoCard>
        </div>

        <div className="space-y-8">
          {/* My Loan Requests */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-black uppercase">My Loan Requests</h2>
              <Link href="/borrow/new">
                <NeoButton variant="primary" size="lg">
                  + Create New Request
                </NeoButton>
              </Link>
            </div>

            {!loanRequests ? (
              <NeoCard bg="bg-white">
                <p className="text-lg font-semibold">Loading your requests...</p>
              </NeoCard>
            ) : loanRequests.length === 0 ? (
              <NeoCard bg="bg-gray-50" className="text-center py-12">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="text-2xl font-black uppercase mb-2">No Loan Requests</h3>
                <p className="text-lg font-semibold text-gray-600 mb-6">
                  Create your first loan request to get started
                </p>
                <Link href="/borrow/new">
                  <NeoButton variant="primary" size="lg">
                    Create Your First Request
                  </NeoButton>
                </Link>
              </NeoCard>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {loanRequests.map((request) => (
                  <BorrowRequestCard key={request._id} request={request} />
                ))}
              </div>
            )}
          </div>

          {/* Recent Assessments */}
          {assessmentRequests && assessmentRequests.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-3xl font-black uppercase">Recent Assessment Activity</h2>
                <Link href="/requests">
                  <NeoButton variant="secondary" size="md">View All</NeoButton>
                </Link>
              </div>
              
              <div className="grid sm:grid-cols-2 gap-4">
                {assessmentRequests.slice(0, 4).map((assessment) => (
                  <NeoCard key={assessment._id} bg="bg-white">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-black text-lg">{assessment.lenderName}</h4>
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
                      <div className="p-3 bg-success bg-opacity-20 border-2 border-foreground">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold">Trust Score</span>
                          <span className="text-xl font-black">{assessment.trustScore}/100</span>
                        </div>
                      </div>
                    )}
                  </NeoCard>
                ))}
              </div>
            </div>
          )}

          {/* Getting Started Guide */}
          <div>
            <h2 className="text-3xl font-black uppercase mb-6">Getting Started</h2>
            <div className="grid lg:grid-cols-2 gap-8">
              <NeoCard bg="bg-secondary" className="bg-opacity-30">
                <h3 className="text-2xl font-black uppercase mb-4">Create Your Profile</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <span className={`text-xl ${wallets && wallets.length > 0 ? 'text-success' : 'text-gray-400'}`}>
                      {wallets && wallets.length > 0 ? '✅' : '○'}
                    </span>
                    <div>
                      <p className="font-bold text-sm">Connect Wallets</p>
                      <p className="text-xs font-semibold text-gray-600">
                        {wallets?.length || 0} wallet{wallets?.length !== 1 ? 's' : ''} connected
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <span className={`text-xl ${stats.totalDocuments > 0 ? 'text-success' : 'text-gray-400'}`}>
                      {stats.totalDocuments > 0 ? '✅' : '○'}
                    </span>
                    <div>
                      <p className="font-bold text-sm">Upload Documents</p>
                      <p className="text-xs font-semibold text-gray-600">
                        Documents are uploaded per loan request
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <span className={`text-xl ${stats.totalRequests > 0 ? 'text-success' : 'text-gray-400'}`}>
                      {stats.totalRequests > 0 ? '✅' : '○'}
                    </span>
                    <div>
                      <p className="font-bold text-sm">Create Loan Request</p>
                      <p className="text-xs font-semibold text-gray-600">
                        {stats.totalRequests} request{stats.totalRequests !== 1 ? 's' : ''} created
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6">
                  <Link href="/profile">
                    <NeoButton variant="secondary" size="md" className="w-full">
                      Complete Profile Setup
                    </NeoButton>
                  </Link>
                </div>
              </NeoCard>
              
              <NeoCard bg="bg-accent" className="bg-opacity-30">
                <h3 className="text-2xl font-black uppercase mb-4">How It Works</h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-black text-sm">1</div>
                    <div>
                      <p className="font-bold text-sm">Create Request</p>
                      <p className="text-xs font-semibold text-gray-600">Set amount, duration, and purpose</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-secondary text-white rounded-full flex items-center justify-center font-black text-sm">2</div>
                    <div>
                      <p className="font-bold text-sm">Upload Documents</p>
                      <p className="text-xs font-semibold text-gray-600">Add supporting financial documents</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-success text-white rounded-full flex items-center justify-center font-black text-sm">3</div>
                    <div>
                      <p className="font-bold text-sm">Publish & Get Assessed</p>
                      <p className="text-xs font-semibold text-gray-600">Lenders review and make offers</p>
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <Link href="/help">
                    <NeoButton variant="accent" size="md" className="w-full">
                      Learn More
                    </NeoButton>
                  </Link>
                </div>
              </NeoCard>
            </div>
          </div>

          {/* Wallet Management */}
          {/* <div>
            <h2 className="text-2xl font-black uppercase mb-6">Wallet Management</h2>
            <WalletManager />
          </div> */}
        </div>
      </div>
    </main>
  );
}
