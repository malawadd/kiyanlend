'use client';

import Link from 'next/link';
import type { Id } from '@/convex/_generated/dataModel';
import { NeoCard } from '../ui/NeoCard';
import { NeoButton } from '../ui/NeoButton';
import { NeoBadge } from '../ui/NeoBadge';
import { formatCurrency, formatDuration, getStatusColor, getStatusLabel } from '@/lib/loan-utils';

interface BorrowRequestCardProps {
  request: {
    _id: Id<"loanRequests">;
    shortId: string;
    amount: number;
    duration: number;
    purpose: string;
    status: string;
    createdAt: number;
    updatedAt?: number;
    isPublished?: boolean;
    assessmentCount: number;
    completedAssessments: number;
    pendingAssessments: number;
    payoutWalletAddress?: string;
  };
}

export function BorrowRequestCard({ request }: BorrowRequestCardProps) {
  const lastUpdated = request.updatedAt || request.createdAt;
  const isPublished = request.isPublished && request.status === 'active';

  return (
    <NeoCard bg="bg-white" className="h-full">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-xl font-black">{formatCurrency(request.amount)}</h3>
            <NeoBadge variant={getStatusColor(request.status)}>
              {getStatusLabel(request.status)}
            </NeoBadge>
            {isPublished && (
              <NeoBadge variant="success">Published</NeoBadge>
            )}
          </div>
          <p className="text-sm font-semibold text-gray-600 mb-1">
            {formatDuration(request.duration)} • {request.purpose}
          </p>
          <p className="text-xs font-semibold text-gray-500">
            ID: {request.shortId}
          </p>
        </div>
      </div>

      <div className="space-y-3 mb-4">
        {/* Assessment Stats */}
        <div className="flex items-center justify-between p-3 bg-gray-50 border-2 border-foreground">
          <span className="text-sm font-semibold">Assessments</span>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold">{request.assessmentCount}</span>
            {request.completedAssessments > 0 && (
              <NeoBadge variant="success" >
                {request.completedAssessments} completed
              </NeoBadge>
            )}
            {request.pendingAssessments > 0 && (
              <NeoBadge variant="accent" >
                {request.pendingAssessments} pending
              </NeoBadge>
            )}
          </div>
        </div>

        {/* Payout Wallet */}
        {request.payoutWalletAddress && (
          <div className="flex items-center justify-between p-3 bg-success bg-opacity-20 border-2 border-foreground">
            <span className="text-sm font-semibold">Payout Wallet</span>
            <span className="text-xs font-bold font-mono">
              {request.payoutWalletAddress.slice(0, 10)}...
            </span>
          </div>
        )}

        {/* Last Updated */}
        <div className="flex items-center justify-between text-gray-500">
          <span className="text-xs font-semibold">
            {request.updatedAt ? 'Updated' : 'Created'}
          </span>
          <span className="text-xs font-semibold">
            {new Date(lastUpdated).toLocaleDateString()}
          </span>
        </div>
      </div>

      <div className="flex gap-2 mt-auto">
        <Link href={`/borrow/${request.shortId}`} className="flex-1">
          <NeoButton variant="primary" size="md" className="w-full">
            {request.status === 'draft' ? 'Edit & Publish' : 'Manage'}
          </NeoButton>
        </Link>
        {isPublished && (
          <NeoButton variant="accent" size="md">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
            </svg>
          </NeoButton>
        )}
      </div>
    </NeoCard>
  );
}