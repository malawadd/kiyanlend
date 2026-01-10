'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { NeoCard } from '@/components/ui/NeoCard';
import { PassportScoreWidget, usePassportScore, LightTheme } from '@human.tech/passport-embed';
import type { Id } from '@/convex/_generated/dataModel';

interface HumanityScoreProps {
  walletAddress: string;
  walletId: Id<"wallets">;
  showWidget?: boolean;
  compact?: boolean;
}

export function HumanityScore({ 
  walletAddress, 
  walletId, 
  showWidget = true, 
  compact = false 
}: HumanityScoreProps) {
  const updateWalletScore = useMutation(api.wallets.updateHumanityScore);
  const walletData = useQuery(api.wallets.getWalletById, { walletId });
  
  const [verifiedScore, setVerifiedScore] = useState<{ score: number; isPassing: boolean } | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Client-side Passport score
  const { data: passportData, isError: passportError, error: passportHookError } = usePassportScore({
    apiKey: process.env.NEXT_PUBLIC_PASSPORT_API_KEY!,
    scorerId: process.env.NEXT_PUBLIC_PASSPORT_SCORER_ID!,
    address: walletAddress,
  });

  // Signature callback for OAuth-based Stamps
  const signMessage = async (message: string): Promise<string> => {
    if (!window.ethereum) throw new Error('No wallet found');
    
    // Properly type window.ethereum
    const ethereum = window.ethereum as {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
    };
    
    const accounts = await ethereum.request({ method: 'eth_requestAccounts' }) as string[];
    return await ethereum.request({
      method: 'personal_sign',
      params: [message, accounts[0]]
    }) as string;
  };

  // Update database when score changes and is verified
  useEffect(() => {
    if (walletAddress && passportData?.passingScore && !verifiedScore && !isUpdating) {
      setIsUpdating(true);
      
      // Server-side verification
      fetch('/api/verify-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: walletAddress })
      })
        .then(res => res.json().then(json => ({ ok: res.ok, json })))
        .then(async ({ ok, json }) => {
          if (!ok) throw new Error(json?.error || 'Verification failed');
          const numericScore = parseFloat(json.score);
          const scoreData = { score: numericScore, isPassing: numericScore >= 1 };
          
          setVerifiedScore(scoreData);
          
          // Update wallet in database with humanity score
          await updateWalletScore({
            walletId,
            humanityScore: numericScore,
            lastScoreUpdate: Date.now(),
            isHumanityVerified: scoreData.isPassing
          });
        })
        .catch(() => {
          setVerifiedScore(null);
        })
        .finally(() => {
          setIsUpdating(false);
        });
    }
  }, [walletAddress, passportData?.passingScore, verifiedScore, isUpdating, walletId, updateWalletScore]);

  // Use stored score if available and recent (within 24 hours)
  const storedScore = walletData?.humanityScore;
  const lastUpdate = walletData?.lastScoreUpdate;
  const isRecentScore = lastUpdate && (Date.now() - lastUpdate) < 24 * 60 * 60 * 1000;
  
  const displayScore = verifiedScore?.score ?? (isRecentScore ? storedScore : undefined);
  const isPassing = verifiedScore?.isPassing ?? (isRecentScore ? walletData?.isHumanityVerified : false);

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-gray-600">Humanity Score:</span>
        {displayScore !== undefined ? (
          <span className={`font-black ${isPassing ? 'text-green-600' : 'text-red-600'}`}>
            {displayScore.toFixed(2)} {isPassing ? '✅' : '❌'}
          </span>
        ) : isRecentScore && storedScore ? (
          <span className="font-black text-gray-600">
            {storedScore.toFixed(2)} (Cached)
          </span>
        ) : (
          <span className="text-sm font-semibold text-gray-500">Not verified</span>
        )}
      </div>
    );
  }

  return (
    <NeoCard bg="bg-white">
      <div className="flex items-center gap-3 mb-4">
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
        </svg>
        <h3 className="text-xl font-black uppercase">Humanity Score</h3>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <p className="text-sm font-semibold text-gray-600 mb-1">Wallet</p>
          <p className="font-black text-lg mb-4 tracking-tight">
            {walletAddress.slice(0, 10)}...{walletAddress.slice(-8)}
          </p>
          
          {showWidget && (
            <>
              <div className="bg-white rounded-lg overflow-hidden shadow-sm p-3 max-w-xl">
                <PassportScoreWidget
                  apiKey={process.env.NEXT_PUBLIC_PASSPORT_API_KEY!}
                  scorerId={process.env.NEXT_PUBLIC_PASSPORT_SCORER_ID!}
                  address={walletAddress}
                  generateSignatureCallback={signMessage}
                  theme={LightTheme}
                />
              </div>
              <p className="text-xs font-semibold text-gray-600 mt-2">Powered by Human Passport</p>
            </>
          )}
        </div>

        <div className="flex flex-col justify-between">
          <div>
            <h4 className="text-lg font-black uppercase mb-3 tracking-tight">Score Status</h4>
            <div className="space-y-2">
              {/* Show stored score if recent */}
              {isRecentScore && storedScore && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-700">Stored Score</span>
                  <span className={`text-lg font-black ${walletData?.isHumanityVerified ? 'text-green-600' : 'text-red-600'}`}>
                    {storedScore.toFixed(2)} {walletData?.isHumanityVerified ? '✅' : '❌'}
                  </span>
                </div>
              )}
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-700">Client-side Score</span>
                <span className="text-lg font-black">
                  {passportData?.score?.toFixed(2) ?? '—'} {passportData?.passingScore ? '✅' : '❌'}
                </span>
              </div>
              
              {passportData?.passingScore && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-700">Server Verification</span>
                  <span className="text-lg font-black">
                    {verifiedScore ? 'Verified ✅' : isUpdating ? '⏳ Verifying...' : '⏳ Pending'}
                  </span>
                </div>
              )}
              
              {passportError && (
                <div className="flex items-center justify-between text-red-600">
                  <span className="text-sm font-semibold">Error</span>
                  <span className="text-sm font-semibold">{(passportHookError as Error)?.message}</span>
                </div>
              )}

              {lastUpdate && (
                <div className="flex items-center justify-between text-gray-500">
                  <span className="text-xs font-semibold">Last Updated</span>
                  <span className="text-xs font-semibold">
                    {new Date(lastUpdate).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>
          
          <div className="text-right mt-6">
            <span className="text-xs font-semibold text-gray-600">Threshold: 1.00</span>
          </div>
        </div>
      </div>
    </NeoCard>
  );
}