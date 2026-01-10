import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';
import { generateKeypair } from '@/lib/secretvaults';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user from Convex using the clerkId
    const user = await convex.query(api.users.getUserByClerkId, { clerkId: userId });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if keypair already exists
    const existing = await convex.query(api.keypairs.getUserKeypair, { userId: user._id });
    if (existing) {
      return NextResponse.json({ 
        success: true, 
        keypair: existing,
        message: 'Keypair already exists' 
      });
    }

    // Generate new keypair
    const { privateKey, publicKey, did } = generateKeypair();
    
    // Store in Convex
    const storedKeypair = await convex.mutation(api.keypairs.storeKeypair, {
      userId: user._id,
      publicKey,
      privateKey,
      did,
    });

    return NextResponse.json({
      success: true,
      keypair: storedKeypair,
      message: 'Keypair generated successfully'
    });

  } catch (error) {
    console.error('Keypair generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate keypair' },
      { status: 500 }
    );
  }
}