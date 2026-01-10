'use client';

import Link from 'next/link';
import type { Id } from '@/convex/_generated/dataModel';
import { NeoCard } from '../ui/NeoCard';
import { NeoButton } from '../ui/NeoButton';
import { NeoBadge } from '../ui/NeoBadge';
import { formatCurrency, formatDuration } from '@/lib/loan-utils';

interface BorrowerCardProps {
  request: {
    _id: Id<"loanRequests">;
    shortId: string;
    userId: Id<"users">;
    amount: number;
    duration: number;
    purpose: string;
    allowAssessments: boolean;
    borrower: {
      displayName: string;
      walletsCount: number;
      humanityScore?: number;
      hasExistingAssessment: boolean;
      existingAssessmentStatus?: string;
      completedAssessments: number;
    };
  };
  onRequestAssessment: (borrowerId: Id<"users">, shortId: string) => void;
}

export function BorrowerCard({ request, onRequestAssessment }: BorrowerCardProps) {
  const canRequestAssessment = request.allowAssessments && !request.borrower.hasExistingAssessment;
  const humanityScore = request.borrower.humanityScore;

  return (
    <NeoCard bg="bg-white" className="h-full flex flex-col">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h4 className="text-xl font-black mb-1">{request.borrower.displayName}</h4>
          <p className="text-xs font-semibold text-gray-500">ID: {request.shortId}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          {request.borrower.hasExistingAssessment && (
            <NeoBadge variant="success" >
              {request.borrower.existingAssessmentStatus === 'completed' ? 'Assessed' : 'Processing'}
            </NeoBadge>
          )}
          {request.borrower.completedAssessments > 0 && (
            <NeoBadge variant="accent" >
              {request.borrower.completedAssessments} assessment{request.borrower.completedAssessments > 1 ? 's' : ''}
            </NeoBadge>
          )}
        </div>
      </div>

      <div className="flex-1 space-y-4 mb-4">
        <div>
          <p className="text-3xl font-black text-primary">{formatCurrency(request.amount)}</p>
          <p className="text-sm font-semibold text-gray-600">{formatDuration(request.duration)}</p>
        </div>

        <div>
          <p className="text-sm font-semibold text-gray-600 mb-1">Purpose</p>
          <p className="text-sm font-bold">{request.purpose}</p>
        </div>

        {/* Humanity Score */}
        <div className="p-3 bg-secondary bg-opacity-20 border-2 border-foreground">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold uppercase">Humanity Score</span>
            <span className="text-lg font-black">
              {humanityScore ? `${humanityScore}/100` : '—'}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-gray-600">
              {humanityScore ? 'Verified Human' : 'Not Available'}
            </span>
            <span className="font-semibold text-gray-600">
              {request.borrower.walletsCount} wallet{request.borrower.walletsCount > 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Assessment Status */}
        {!request.allowAssessments && (
          <div className="p-2 bg-gray-100 border-2 border-gray-300 text-center">
            <p className="text-xs font-bold text-gray-600">Assessments Disabled</p>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Link href={`/lend/${request.shortId}`} className="block">
          <NeoButton variant="primary" size="md" className="w-full">
            View Details
          </NeoButton>
        </Link>
        
        {canRequestAssessment ? (
          <NeoButton 
            variant="accent" 
            size="md" 
            className="w-full"
            onClick={() => onRequestAssessment(request.userId, request.shortId)}
          >
            Request Assessment
          </NeoButton>
        ) : request.borrower.hasExistingAssessment ? (
          <NeoButton  size="md" className="w-full" disabled>
            {request.borrower.existingAssessmentStatus === 'completed' ? 'Assessment Complete' : 'Assessment Pending'}
          </NeoButton>
        ) : (
          <NeoButton  size="md" className="w-full" disabled>
            Assessments Disabled
          </NeoButton>
        )}
      </div>
    </NeoCard>
  );
}
