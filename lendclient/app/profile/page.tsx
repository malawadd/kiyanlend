'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { NeoCard } from '@/components/ui/NeoCard';
import { NeoBadge } from '@/components/ui/NeoBadge';
import { NeoButton } from '@/components/ui/NeoButton';
import { NeoInput } from '@/components/ui/NeoInput';
import { WalletManager } from '@/components/borrower/WalletManager';
import { HumanityScore } from '@/components/borrower/HumanityScore';
import { useToast } from '@/components/ui/NeoToast';

export default function ProfilePage() {
  const {} = useUser();
  const { showToast } = useToast();
  const profile = useQuery(api.users.getProfile);
  const wallets = useQuery(api.wallets.listWallets);
  const updateProfile = useMutation(api.users.updateProfile);
  const addCredits = useMutation(api.credits.addCredits);
  const uploadHistory = useQuery(api.documents.getUploadHistory);

  const [name, setName] = useState('');
  const [role, setRole] = useState<'borrower' | 'lender' | 'both'>('both');
  const [allowAssessments, setAllowAssessments] = useState(true);

  useEffect(() => {
    if (profile) {
      setName(profile.displayName);
      setRole(profile.role);
      setAllowAssessments(profile.allowAssessments);
    }
  }, [profile]);

  const handleSaveProfile = async () => {
    try {
      await updateProfile({ displayName: name, role, allowAssessments });
      showToast('Profile updated successfully', 'success');
    } catch {
      showToast('Failed to update profile', 'danger');
    }
  };

  const handlePurchaseCredits = async () => {
    try {
      await addCredits({ amount: 10 });
      showToast('10 credits added successfully', 'success');
    } catch {
      showToast('Failed to add credits', 'danger');
    }
  };

  if (!profile) {
    return (
      <main className="min-h-screen py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-xl font-semibold">Loading...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl sm:text-5xl font-black uppercase mb-4">Profile</h1>
          <p className="text-xl font-semibold">Manage your account, wallets, and privacy settings</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          <NeoCard bg="bg-primary">
            <div className="flex items-center gap-3 mb-2">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <h3 className="text-xl font-black uppercase">Account</h3>
            </div>
            <p className="text-2xl font-black mb-1">{profile.displayName}</p>
            <p className="text-sm font-semibold">{profile.email}</p>
          </NeoCard>

          <NeoCard bg="bg-secondary">
            <div className="flex items-center gap-3 mb-2">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-xl font-black uppercase">Credits</h3>
            </div>
            <p className="text-2xl font-black mb-2">{profile.credits} Credits</p>
            <NeoButton size="sm" variant="accent" onClick={handlePurchaseCredits}>
              Purchase More
            </NeoButton>
          </NeoCard>

          <NeoCard bg="bg-accent">
            <div className="flex items-center gap-3 mb-2">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
              <h3 className="text-xl font-black uppercase">Role</h3>
            </div>
            <div className="flex gap-2">
              {role === 'borrower' && <NeoBadge variant="primary">Borrower</NeoBadge>}
              {role === 'lender' && <NeoBadge variant="secondary">Lender</NeoBadge>}
              {role === 'both' && (
                <>
                  <NeoBadge variant="primary">Borrower</NeoBadge>
                  <NeoBadge variant="secondary">Lender</NeoBadge>
                </>
              )}
            </div>
          </NeoCard>
        </div>

        <div className="space-y-8">
          <NeoCard bg="bg-white">
            <h3 className="text-2xl font-black uppercase mb-6">Account Settings</h3>
            <div className="space-y-6">
              <NeoInput
                label="Display Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />

              <div className="flex flex-col gap-2">
                <label className="font-bold text-sm uppercase tracking-wide">
                  Account Role
                </label>
                <div className="flex gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="role"
                      value="borrower"
                      checked={role === 'borrower'}
                      onChange={(e) => setRole(e.target.value as 'borrower' | 'lender' | 'both')}
                      className="w-5 h-5"
                    />
                    <span className="font-bold">Borrower</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="role"
                      value="lender"
                      checked={role === 'lender'}
                      onChange={(e) => setRole(e.target.value as 'borrower' | 'lender' | 'both')}
                      className="w-5 h-5"
                    />
                    <span className="font-bold">Lender</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="role"
                      value="both"
                      checked={role === 'both'}
                      onChange={(e) => setRole(e.target.value as 'borrower' | 'lender' | 'both')}
                      className="w-5 h-5"
                    />
                    <span className="font-bold">Both</span>
                  </label>
                </div>
              </div>

              <NeoButton variant="primary" size="lg" onClick={handleSaveProfile}>
                Save Profile
              </NeoButton>
            </div>
          </NeoCard>

          <WalletManager />

          {wallets && wallets.length > 0 && (
            <NeoCard bg="bg-white">
              <h3 className="text-2xl font-black uppercase mb-6">Humanity Verification</h3>
              <div className="space-y-6">
                {wallets.map((wallet) => (
                  <div key={wallet._id}>
                    <div className="flex items-center gap-3 mb-3">
                      <h4 className="text-lg font-black">{wallet.nickname}</h4>
                      {wallet.isPrimary && <NeoBadge variant="accent">Primary</NeoBadge>}
                      <HumanityScore 
                        walletAddress={wallet.address}
                        walletId={wallet._id}
                        showWidget={false}
                        compact={true}
                      />
                    </div>
                    <HumanityScore 
                      walletAddress={wallet.address}
                      walletId={wallet._id}
                      showWidget={true}
                      compact={false}
                    />
                    {wallet !== wallets[wallets.length - 1] && (
                      <hr className="my-6 border-t-4 border-foreground" />
                    )}
                  </div>
                ))}
              </div>
            </NeoCard>
          )}

          <NeoCard bg="bg-white">
            <h3 className="text-2xl font-black uppercase mb-6">Privacy & Data</h3>

            <div className="space-y-6">
              <div className="p-4 border-4 border-foreground bg-success bg-opacity-30">
                <div className="flex items-start gap-3 mb-3">
                  <svg className="w-6 h-6 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <div className="flex-1">
                    <p className="font-black mb-2">Your SecretVault</p>
                    <p className="text-sm font-semibold mb-3">
                      All your financial documents are encrypted and stored in your personal SecretVault. Only nilAI models can process them through secure computation.
                    </p>
                    <p className="text-xs font-bold text-gray-600">
                      Lenders never see raw documents • Only Trust Scores are shared
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 border-4 border-foreground">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allowAssessments}
                    onChange={(e) => setAllowAssessments(e.target.checked)}
                    className="mt-1 w-5 h-5 border-4 border-foreground"
                  />
                  <div>
                    <p className="font-bold mb-1">Allow lenders to request private assessments</p>
                    <p className="text-sm font-semibold text-gray-600">
                      When enabled, lenders can pay a fee to run AI models on your encrypted data. You&apos;ll be notified of all requests and can revoke access anytime.
                    </p>
                  </div>
                </label>
              </div>

              <div className="border-t-4 border-foreground pt-6">
                <p className="font-bold text-sm uppercase tracking-wide mb-3">Upload History</p>
                <div className="space-y-2">
                  {(uploadHistory || []).map((item) => (
                    <div key={item._id} className="flex items-center justify-between p-3 border-4 border-foreground bg-gray-50">
                      <p className="text-sm font-semibold">{item.action}</p>
                      <p className="text-xs font-bold text-gray-600">
                        {new Date(item.timestamp).toLocaleString()}
                      </p>
                    </div>
                  ))}
                  {(!uploadHistory || uploadHistory.length === 0) && (
                    <p className="text-sm font-semibold text-gray-600 text-center py-4">No upload history yet</p>
                  )}
                </div>
              </div>
            </div>
          </NeoCard>

          <NeoCard bg="bg-white">
            <h3 className="text-2xl font-black uppercase mb-6">How nilAI Works</h3>
            <div className="space-y-4">
              <div className="p-4 border-4 border-foreground">
                <h4 className="font-black mb-2 flex items-center gap-2">
                  <span className="text-primary text-xl">•</span>
                  <span>What is a Trust Score?</span>
                </h4>
                <p className="text-sm font-semibold text-gray-600">
                  A Trust Score is a number from 1 to 100 that represents your creditworthiness based on AI analysis of your encrypted financial data. Higher scores indicate lower risk.
                </p>
              </div>

              <div className="p-4 border-4 border-foreground">
                <h4 className="font-black mb-2 flex items-center gap-2">
                  <span className="text-secondary text-xl">•</span>
                  <span>How is it computed?</span>
                </h4>
                <p className="text-sm font-semibold text-gray-600">
                  Pre-trained nilAI models run on your encrypted data using secure multi-party computation. The model analyzes payment history, income patterns, debt ratios, and savings behavior without ever decrypting your files.
                </p>
              </div>

              <div className="p-4 border-4 border-foreground">
                <h4 className="font-black mb-2 flex items-center gap-2">
                  <span className="text-accent text-xl">•</span>
                  <span>What do lenders see?</span>
                </h4>
                <p className="text-sm font-semibold text-gray-600">
                  Lenders only see your Trust Score (1-100) and a short Risk Assessment summary with 3-5 bullet points. They never see raw financial documents, specific transaction amounts, or any personally identifiable details.
                </p>
              </div>
            </div>
          </NeoCard>
        </div>
      </div>
    </main>
  );
}
