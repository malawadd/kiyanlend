import { SecretVaultUserClient, SecretVaultBuilderClient } from '@nillion/secretvaults';
import { Keypair, NucTokenBuilder, Command, Did } from '@nillion/nuc';
import { randomUUID } from 'node:crypto';
import type { AclDto, CreateOwnedDataRequest } from '@nillion/secretvaults';

export const COLLECTION_ID = '244fb43c-6366-48c2-b549-9dcdd3e74756';

// Generate new user keypair (matching the example pattern)
export function generateKeypair() {
  const keypair = Keypair.generate();
  const privateKey = keypair.privateKey('hex');
  const publicKey = keypair.publicKey('hex');
  const did = keypair.toDid().toString();
  
  return {
    keypair,
    privateKey,
    publicKey,
    did,
  };
}

// Initialize SecretVault builder client
export async function initSecretVaultBuilderClient() {
  const builderKey = process.env.NILLION_BUILDER_PRIVATE_KEY;
  
  if (!builderKey) {
    throw new Error('Missing NILLION_BUILDER_PRIVATE_KEY environment variable');
  }

  const builderClient = await SecretVaultBuilderClient.from({
    keypair: Keypair.from(builderKey),
    urls: {
      chain: process.env.NILCHAIN_URL || 'http://rpc.testnet.nilchain-rpc-proxy.nilogy.xyz',
      auth: process.env.NILAUTH_URL || 'https://nilauth.sandbox.app-cluster.sandbox.nilogy.xyz',
      dbs: [
        'https://nildb-stg-n1.nillion.network',
        'https://nildb-stg-n2.nillion.network',
        'https://nildb-stg-n3.nillion.network',
      ],
    },
    blindfold: { operation: 'store' },
  });

  // Refresh token to get authentication
  await builderClient.refreshRootToken();

  return builderClient;
}

// Initialize SecretVault user client (matching the example pattern)
export async function initSecretVaultUserClient(userKey?: string) {
  // Use provided key or fall back to environment variable
  const key = userKey || process.env.NILLION_USER_KEY;

  if (!key) {
    throw new Error(
      'Missing required user key: provide as parameter or set NILLION_USER_KEY environment variable'
    );
  }

  // Create user client with same configuration as builderClient
  const userClient = await SecretVaultUserClient.from({
    keypair: Keypair.from(key),
    baseUrls: [
      'https://nildb-stg-n1.nillion.network',
      'https://nildb-stg-n2.nillion.network',
      'https://nildb-stg-n3.nillion.network',
    ],
    blindfold: { operation: 'store' },
  });

  return userClient;
}

// Create delegation token for a user to store data in owned collection
export async function createDelegationToken(userDid: string): Promise<string> {
  try {
    const builderClient = await initSecretVaultBuilderClient();
    const builderKeypair = Keypair.from(process.env.NILLION_BUILDER_PRIVATE_KEY!);
    
    // Parse the DID string (format: "did:nil:<public_key_hex>") and extract the hex part
    // Then create a Did object using Did.fromHex()
    const didParts = userDid.split(':');
    if (didParts.length !== 3 || didParts[0] !== 'did' || didParts[1] !== 'nil') {
      throw new Error(`Invalid DID format: ${userDid}. Expected format: did:nil:<public_key_hex>`);
    }
    
    const publicKeyHex = didParts[2];
    const userDidObj = Did.fromHex(publicKeyHex);
    
    // Create delegation token that allows user to create data
    const delegation = NucTokenBuilder.extending(builderClient.rootToken)
      .command(new Command(['nil', 'db', 'data', 'create']))
      .audience(userDidObj)
      .expiresAt(Math.floor(Date.now() / 1000) + 3600) // 1 hour expiry
      .build(builderKeypair.privateKey());

    return delegation;
  } catch (error) {
    console.error('Error creating delegation token:', error);
    throw error;
  }
}

// Store document data in SecretVaults using owned data pattern
export async function storeDocumentInVault(
  privateKey: string,
  documentId: string,
  rawOutput: string,
  base64Image: string,
  delegationToken?: string,
  granteeDid?: string
) {
  try {
    const client = await initSecretVaultUserClient(privateKey);
    
    // Use provided documentId or generate new UUID
    const docId = documentId || randomUUID();
    
    const userData = [{
      _id: docId,
      rawOutput: { '%allot': rawOutput }, // Use %allot for encryption
    //   base64Image: { '%allot': base64Image } 
    }];

    // For owned collections, delegation token is ALWAYS required
    // If not provided, create one
    let token = delegationToken;
    if (!token) {
      console.log('No delegation token provided, creating one...');
      token = await createDelegationToken(client.id);
    }

    // If granteeDid is provided, create with ACL
    if (granteeDid) {
      const acl = {
        grantee: granteeDid,
        read: true,
        write: false,
        execute: false,
      } as AclDto;

      const createDataRequest = {
        collection: COLLECTION_ID,
        owner: client.id,
        data: userData,
        acl: acl,
      } as unknown as CreateOwnedDataRequest;

      const createResponse = await client.createData(token, createDataRequest);

      // Extract the created document IDs from response
      const createdIds = [];
      for (const [, nodeResponse] of Object.entries(createResponse)) {
        if (nodeResponse.data?.created) {
          createdIds.push(...nodeResponse.data.created);
        }
      }

      return {
        collection: COLLECTION_ID,
        owner: client.id,
        documentId: docId,
        createdIds: [...new Set(createdIds)],
        nodes: createResponse,
      };
    } else {
      // Create owned data without ACL, but still need delegation token
      const createDataRequest = {
        collection: COLLECTION_ID,
        owner: client.id,
        data: userData,
        // No ACL field
      } as unknown as CreateOwnedDataRequest;

      const createResponse = await client.createData(token, createDataRequest);

      // Extract the created document IDs from response
      const createdIds = [];
      for (const [, nodeResponse] of Object.entries(createResponse)) {
        if (nodeResponse.data?.created) {
          createdIds.push(...nodeResponse.data.created);
        }
      }

      return {
        collection: COLLECTION_ID,
        owner: client.id,
        documentId: docId,
        createdIds: [...new Set(createdIds)],
        nodes: createResponse,
      };
    }
  } catch (error) {
    console.error('Error storing document in vault:', error);
    throw error;
  }
}

// Retrieve document data from SecretVaults
export async function getDocumentFromVault(
  privateKey: string,
  documentId: string
) {
  try {
    const client = await initSecretVaultUserClient(privateKey);
    
    // Read data using correct API signature
    const readResponse = await client.readData({
      collection: COLLECTION_ID,
      document: documentId,
    });

    return readResponse;
  } catch (error) {
    console.error('Error retrieving document from vault:', error);
    throw error;
  }
}