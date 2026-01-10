/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { NeoButton } from '../ui/NeoButton';
import { NeoBadge } from '../ui/NeoBadge';
import { useToast } from '../ui/NeoToast';

export function SecretVaultManager() {
  const user = useQuery(api.users.getCurrentUser, {});
  const keypair = useQuery(api.keypairs.getUserKeypair, user ? { userId: user._id } : "skip");
  const { showToast } = useToast();
  
  const [isGeneratingKeypair, setIsGeneratingKeypair] = useState(false);

  const generateKeypair = async () => {
    setIsGeneratingKeypair(true);
    try {
      const response = await fetch('/api/generate-keypair', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      const data = await response.json();
      
      if (data.success) {
        showToast('🔐 SecretVault keypair generated successfully!', 'success');
      } else {
        showToast(data.error || 'Failed to generate keypair', 'danger');
      }
    } catch (error) {
      showToast('Error generating keypair', 'danger');
    } finally {
      setIsGeneratingKeypair(false);
    }
  };

  const storeInVault = async (documentId: string, rawOutput: any, base64Image: string) => {
    try {
      const response = await fetch('/api/vault-operations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'store',
          documentId,
          rawOutput,
          base64Image
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        showToast('📦 Document stored in SecretVault', 'success');
        return true;
      } else {
        showToast(data.error || 'Failed to store in vault', 'danger');
        return false;
      }
    } catch (error) {
      showToast('Error storing in vault', 'danger');
      return false;
    }
  };

  const retrieveFromVault = async (documentId: string) => {
    try {
      const response = await fetch('/api/vault-operations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'retrieve',
          documentId
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        return data.data;
      } else {
        showToast(data.error || 'Failed to retrieve from vault', 'danger');
        return null;
      }
    } catch (error) {
      showToast('Error retrieving from vault', 'danger');
      return null;
    }
  };

  return {
    keypair,
    hasKeypair: !!keypair,
    isGeneratingKeypair,
    generateKeypair,
    storeInVault,
    retrieveFromVault,
    VaultStatus: () => (
      <div className="mb-4 p-3 border-4 border-foreground bg-accent bg-opacity-20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>🔐</span>
            <span className="font-bold text-sm">SecretVault Status:</span>
            {keypair ? (
              <NeoBadge variant="success">Active</NeoBadge>
            ) : (
              <NeoBadge variant="neutral">Not Setup</NeoBadge>
            )}
          </div>
          {!keypair && (
            <NeoButton
              size="sm"
              variant="primary"
              onClick={generateKeypair}
              disabled={isGeneratingKeypair}
            >
              {isGeneratingKeypair ? 'Generating...' : 'Setup Vault'}
            </NeoButton>
          )}
        </div>
        {keypair && (
          <p className="text-xs font-semibold text-gray-600 mt-2">
            DID: {keypair.did.slice(0, 20)}...
          </p>
        )}
      </div>
    )
  };
}