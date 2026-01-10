'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { NeoButton } from './NeoButton';
// import { randomUUID } from 'crypto';

export function StoreToVaultButton() {
  const { user } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<string>('');
  const [error, setError] = useState<string>('');

  // Check if user has a keypair
  const currentUser = useQuery(api.users.getCurrentUser);
  const keypair = useQuery(
    api.keypairs.getUserKeypair,
    currentUser ? { userId: currentUser._id } : 'skip'
  );

  const handleStoreToVault = async () => {
    if (!user) {
      setError('Please sign in first');
      return;
    }

    setIsLoading(true);
    setError('');
    setStatus('');

    try {
      // Step 1: Check if keypair exists, if not create one
      if (!keypair) {
        setStatus('No keypair found. Creating keypair...');
        
        const keypairResponse = await fetch('/api/generate-keypair', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!keypairResponse.ok) {
          const errorData = await keypairResponse.json();
          throw new Error(errorData.error || 'Failed to generate keypair');
        }

        const keypairData = await keypairResponse.json();
        setStatus(`Keypair created! DID: ${keypairData.keypair.did}`);
        
        // Wait a moment for the keypair to be stored
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Step 2: Store dummy data to vault
      setStatus('Storing dummy data to SecretVault...');
      
      const dummyData = {
        action: 'store',
        documentId: "1",
        rawOutput: JSON.stringify({
          type: 'test_document',
          timestamp: new Date().toISOString(),
          data: 'This is dummy test data from StoreToVaultButton',
          metadata: {
            created_by: user.id,
            email: user.emailAddresses[0]?.emailAddress || 'unknown',
          }
        }),
        base64Image: btoa('Dummy image data placeholder'),
      };

      const vaultResponse = await fetch('/api/vault-operations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dummyData),
      });

      if (!vaultResponse.ok) {
        const errorData = await vaultResponse.json();
        throw new Error(errorData.error || 'Failed to store data to vault');
      }

      const vaultData = await vaultResponse.json();
      setStatus(`✅ Successfully stored to SecretVault! Document ID: ${vaultData.result.documentId}`);
      
      console.log('Vault operation result:', vaultData);
      
    } catch (err) {
      console.error('Vault operation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to store data to vault');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <NeoButton
        variant="primary"
        onClick={handleStoreToVault}
        disabled={isLoading || !user}
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <span className="animate-spin">⏳</span>
            {status || 'Processing...'}
          </span>
        ) : (
          <>
            {keypair ? '🔐 Store Dummy Data to Vault' : '🔑 Create Keypair & Store Data'}
          </>
        )}
      </NeoButton>

      {status && !error && (
        <div className="text-sm text-green-600 dark:text-green-400 p-3 rounded-lg bg-green-50 dark:bg-green-900/20">
          {status}
        </div>
      )}

      {error && (
        <div className="text-sm text-red-600 dark:text-red-400 p-3 rounded-lg bg-red-50 dark:bg-red-900/20">
          ❌ {error}
        </div>
      )}

      {keypair && (
        <div className="text-xs text-gray-600 dark:text-gray-400 p-2 rounded bg-gray-50 dark:bg-gray-800">
          <div className="font-semibold">Your DID:</div>
          <div className="font-mono break-all">{keypair.did}</div>
        </div>
      )}
    </div>
  );
}
