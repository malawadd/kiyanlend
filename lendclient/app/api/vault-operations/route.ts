import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';
import { storeDocumentInVault, getDocumentFromVault } from '@/lib/secretvaults';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, documentId, rawOutput, base64Image } = await request.json();
    
    // Get user from Convex using the clerkId
    const user = await convex.query(api.users.getUserByClerkId, { clerkId: userId });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get user keypair
    const keypair = await convex.query(api.keypairs.getUserKeypair, { userId: user._id });
    if (!keypair) {
      return NextResponse.json({ error: 'Keypair not found. Generate keypair first.' }, { status: 404 });
    }

    if (action === 'store') {
      // Store document in SecretVaults
      const result = await storeDocumentInVault(
        keypair.privateKey,
        documentId,
        rawOutput,
        base64Image
      );
      
      return NextResponse.json({
        success: true,
        result,
        message: 'Document stored in SecretVault'
      });
      
    } else if (action === 'retrieve') {
      // Retrieve document from SecretVaults
      const result = await getDocumentFromVault(
        keypair.privateKey,
        documentId
      );
      
      return NextResponse.json({
        success: true,
        data: result,
        message: 'Document retrieved from SecretVault'
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('SecretVault operation error:', error);
    return NextResponse.json(
      { error: 'Failed to perform vault operation' },
      { status: 500 }
    );
  }
}